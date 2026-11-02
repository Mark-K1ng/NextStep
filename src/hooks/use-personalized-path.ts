import { useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useSession } from '@/providers/auth';
import { useSaved } from '@/providers/saved';
import { usePersonalization } from './use-personalization';
import { useStudentData } from './use-student-data';
import { normalizeCounty } from '@/constants/profile-options';
import {
  loadRecommendationCatalogue,
  loadRecommendationState,
  recommendationSavedKeys,
} from '@/services/personalized-path';
import {
  buildPersonalizedPath,
  recommendationKey,
} from '@/engine/personalizedPath';
import { EDUCATION_ROUTES_ENABLED } from '@/constants/education-rollout';
import { useEducationRoute } from './use-education';
// The rollout flag is immutable for the lifetime of a bundle.
export const usePersonalizedPath = EDUCATION_ROUTES_ENABLED
  ? useServerPersonalizedPath
  : useLegacyPersonalizedPath;
function useServerPersonalizedPath() {
  const route = useEducationRoute();
  const { session } = useSession();
  const seen = new Set<string>();
  const items = (route.data?.directions.flatMap((d) => d.options) || [])
    .filter((item) => {
      if (seen.has(item.key)) {
        return false;
      }
      seen.add(item.key);
      return true;
    })
    .slice(0, 5);
  return {
    items,
    notices: route.data?.notices || [],
    userId: session?.user.id,
    loading: route.isPending,
    error: route.isError,
    hasDismissed: false,
    retry: () => route.refetch(),
  };
}
function useLegacyPersonalizedPath() {
  const { session } = useSession();
  const id = session?.user.id;
  const saved = useSaved();
  const personalization = usePersonalization();
  const student = useStudentData({ includeGap: false });
  const county = normalizeCounty(student.profile?.county);
  const catalogue = useQuery({
    queryKey: ['recommendation-catalogue', county],
    enabled: !!id && !!student.profile,
    staleTime: 15 * 60_000,
    queryFn: ({ signal }) => loadRecommendationCatalogue(county, signal),
  });
  const state = useQuery({
    queryKey: ['personalized-path', id],
    enabled: !!id,
    queryFn: ({ signal }) => loadRecommendationState(id!, signal),
  });
  const { refetch: refetchState } = state;
  const { refetch: refetchPersonalization } = personalization;
  useFocusEffect(
    useCallback(() => {
      refetchState();
      refetchPersonalization();
    }, [refetchState, refetchPersonalization])
  );
  const candidates = catalogue.data?.candidates || [];
  const keys = recommendationSavedKeys(
    saved.items,
    catalogue.data?.schools || []
  ).map((item) => recommendationKey(item.type, item.id));
  const savedCandidates = candidates.filter((c) =>
    keys.includes(recommendationKey(c.type, c.id))
  );
  const result = student.profile
    ? buildPersonalizedPath({
        profile: student.profile,
        answers: personalization.data?.answers || {},
        candidates,
        savedKeys: keys,
        savedSkillIds: [
          ...new Set(
            savedCandidates.flatMap((c) => (c.skills || []).map((s) => s.id))
          ),
        ],
        savedCareerIds: savedCandidates
          .filter((c) => c.type === 'career')
          .map((c) => c.id),
        userSkills: state.data?.skills || [],
        goalId: student.goal?.id,
        goalSkills:
          candidates.find(
            (c) => c.type === 'career' && c.id === student.goal?.id
          )?.skills || [],
        acceptedKeys: [
          ...(state.data?.progress || []).map((row) =>
            recommendationKey(row.step_type, row.ref_id)
          ),
          ...(state.data?.decisions || [])
            .filter((d) => d.decision === 'accepted')
            .map((d) => recommendationKey(d.item_type, d.item_id)),
        ],
        dismissedKeys: (state.data?.decisions || [])
          .filter((d) => d.decision === 'dismissed')
          .map((d) => recommendationKey(d.item_type, d.item_id)),
        completedKeys: (state.data?.progress || [])
          .filter((row) => row.status === 'completed')
          .map((row) => recommendationKey(row.step_type, row.ref_id)),
      })
    : { items: [], notices: [] };
  return {
    ...result,
    userId: id,
    loading:
      student.loading ||
      catalogue.isPending ||
      state.isPending ||
      personalization.isPending ||
      !saved.ready,
    error:
      student.error ||
      catalogue.isError ||
      state.isError ||
      personalization.isError ||
      saved.error,
    hasDismissed: state.data?.decisions.some((d) => d.decision === 'dismissed'),
    retry: () => {
      student.retry();
      catalogue.refetch();
      state.refetch();
      personalization.refetch();
      saved.retry();
    },
  };
}
