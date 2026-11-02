import { useEffect, useState, type PropsWithChildren } from 'react';
import { AppState } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useSession } from './auth';
import { getAccountAccess } from '@/services/account-access';
import { AccountModeContext as Context } from './account-mode';
import { normalizeCounty } from '@/constants/profile-options';

export function AccountModeProvider({ children }: PropsWithChildren) {
  const { session } = useSession();
  const userId = session?.user.id;
  const enabled = !!session?.user.email_confirmed_at;
  const [previewFor, setPreviewFor] = useState<string | null>(null);
  const [previewCounty, setPreviewCounty] = useState('');
  const query = useQuery({
    queryKey: ['account-access', userId],
    enabled,
    queryFn: ({ signal }) => getAccountAccess(signal),
    staleTime: 0,
    refetchInterval: enabled ? 30_000 : false,
    refetchOnMount: 'always',
  });
  const isTeacher = query.data?.account_kind === 'teacher';
  const isApprovedTeacher = isTeacher && query.data?.can_teach === true;
  const isPreview = !!userId && previewFor === userId && isApprovedTeacher;
  const { refetch } = query;
  useEffect(() => {
    setPreviewFor(null);
    setPreviewCounty('');
  }, [userId, isApprovedTeacher]);
  useEffect(() => {
    if (!enabled) {
      return;
    }
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        refetch();
      }
    });
    return () => subscription.remove();
  }, [enabled, refetch]);
  return (
    <Context.Provider
      value={{
        access: enabled ? query.data : undefined,
        isTeacher,
        isApprovedTeacher,
        isPreview,
        isPending: enabled && query.isPending,
        error: enabled && query.isError,
        previewCounty,
        setPreviewCounty: (county) => setPreviewCounty(normalizeCounty(county)),
        enterPreview: () => {
          if (isApprovedTeacher && userId) {
            setPreviewFor(userId);
          }
        },
        exitPreview: () => setPreviewFor(null),
        refresh: refetch,
      }}
    >
      {children}
    </Context.Provider>
  );
}
