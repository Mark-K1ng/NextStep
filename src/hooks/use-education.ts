import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useIsFocused } from 'expo-router';
import { useSession } from '@/providers/auth';
import { useAccountMode } from '@/providers/account-mode';
import { EDUCATION_ROUTES_ENABLED } from '@/constants/education-rollout';
import {
  importGuestIntake,
  loadEducation,
  loadEducationRoute,
} from '@/services/education';
import { needsProfileCompletion } from '@/lib/finish-auth';

export function useEducation() {
  const { session } = useSession();
  const account = useAccountMode();
  const user = session?.user;
  return useQuery({
    queryKey: ['education', user?.id],
    enabled:
      EDUCATION_ROUTES_ENABLED &&
      !!user?.email_confirmed_at &&
      account.access?.account_kind === 'student' &&
      !user.user_metadata.nextstep_profile_pending &&
      !needsProfileCompletion(user),
    staleTime: 60_000,
    queryFn: async () => {
      await importGuestIntake(user!);
      return loadEducation(user!.id);
    },
  });
}
export function useEducationRoute() {
  const education = useEducation();
  const focused = useIsFocused();
  const { session } = useSession();
  const id = session?.user.id;
  const route = useQuery({
    queryKey: ['education-route', id, education.data?.revision],
    enabled: focused && !!education.data && !education.isError,
    staleTime: 5 * 60_000,
    queryFn: ({ signal }) => loadEducationRoute(id!, signal),
  });
  return {
    ...route,
    isPending: education.isPending || route.isPending,
    isError: education.isError || route.isError,
    refetch: async () => {
      await education.refetch();
      return route.refetch();
    },
  };
}
export function useRefreshEducation() {
  const client = useQueryClient();
  const { session } = useSession();
  return async (defer = false) => {
    const id = session?.user.id;
    await Promise.all([
      client.invalidateQueries({
        queryKey: ['education-route', id],
        refetchType: defer ? 'none' : 'active',
      }),
      client.invalidateQueries({
        queryKey: ['personalized-path', id],
        refetchType: defer ? 'none' : 'active',
      }),
      client.invalidateQueries({
        queryKey: ['student', id],
        refetchType: defer ? 'none' : 'active',
      }),
    ]);
  };
}
