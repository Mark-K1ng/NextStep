import { useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useSession } from '@/providers/auth';
import { supabase } from '@/lib/supabase';
import { loadGapAnalysis } from '@/services/gap-analysis';
import { loadPathSteps } from '@/services/path';
import type { Career } from '@/types/models';
import { normalizeCounty } from '@/constants/profile-options';
import { useProfileQuery } from '@/hooks/use-profile';

export function useStudentData({
  includeGap = true,
  includePath = false,
}: { includeGap?: boolean; includePath?: boolean } = {}) {
  const { session } = useSession();
  const userId = session?.user.id;
  const profileQuery = useProfileQuery();
  const county = normalizeCounty(profileQuery.data?.county);
  const goalQuery = useQuery({
    queryKey: ['student', userId, 'goal'],
    staleTime: 60_000,
    enabled: !!userId,
    queryFn: async ({ signal }) => {
      const result = await supabase
        .from('user_goals')
        .select('careers(*)')
        .eq('user_id', userId!)
        .order('created_at', { ascending: false })
        .limit(1)
        .abortSignal(signal);
      if (result.error) {
        throw result.error;
      }
      return (result.data?.[0]?.careers || null) as unknown as Career | null;
    },
  });
  const goal = goalQuery.data;
  const gapQuery = useQuery({
    queryKey: ['student', userId, 'gap', goal?.id],
    staleTime: 5 * 60_000,
    enabled: !!userId && !!goal && includeGap,
    queryFn: ({ signal }) => loadGapAnalysis(userId!, goal!.id, signal),
  });
  const pathQuery = useQuery({
    queryKey: ['student', userId, 'path', county],
    enabled: !!userId && profileQuery.isSuccess && includePath,
    queryFn: ({ signal }) => loadPathSteps(userId!, county, signal),
  });
  const { refetch: refetchProfile, isStale: profileStale } = profileQuery;
  const { refetch: refetchGoal, isStale: goalStale } = goalQuery;
  const { refetch: refetchGap, isStale: gapStale } = gapQuery;
  const { refetch: refetchPath, isStale: pathStale } = pathQuery;
  useFocusEffect(
    useCallback(() => {
      if (profileStale) {
        refetchProfile({ cancelRefetch: false });
      }
      if (goalStale) {
        refetchGoal({ cancelRefetch: false });
      }
      if (includeGap && goal && gapStale) {
        refetchGap({ cancelRefetch: false });
      }
      if (includePath && pathStale) {
        refetchPath({ cancelRefetch: false });
      }
    }, [
      profileStale,
      goalStale,
      gapStale,
      pathStale,
      refetchProfile,
      refetchGoal,
      refetchGap,
      refetchPath,
      includeGap,
      includePath,
      goal,
    ])
  );
  return {
    profile: profileQuery.data || null,
    goal: goal || null,
    gap: includeGap ? gapQuery.data || null : null,
    steps: includePath ? pathQuery.data || [] : [],
    loading: profileQuery.isPending || goalQuery.isPending || !userId,
    gapLoading: includeGap && !!goal && gapQuery.isPending,
    pathLoading: includePath && pathQuery.isPending,
    error:
      profileQuery.isError ||
      goalQuery.isError ||
      (includeGap && !!goal && gapQuery.isError) ||
      (includePath && pathQuery.isError),
    retry: () => {
      refetchProfile();
      refetchGoal();
      if (includeGap && goal) {
        refetchGap();
      }
      if (includePath) {
        refetchPath();
      }
    },
  };
}
