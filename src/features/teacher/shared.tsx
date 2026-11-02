import type { PropsWithChildren } from 'react';
import { Copy, Screen } from '@/components/design';
import type { LoadingLayout } from '@/components/loading-layout';
import { DataState } from '@/components/data-state';
import { useTutoringAccount } from '@/hooks/use-tutoring';
import { useTheme } from '@/hooks/use-theme';

export function TeacherPage({
  title,
  children,
}: PropsWithChildren<{ title: string }>) {
  return (
    <Screen>
      <Copy kind='title'>{title}</Copy>
      {children}
    </Screen>
  );
}

export function TeacherNote({ children }: PropsWithChildren) {
  const theme = useTheme();
  return (
    <Copy kind='caption' style={{ color: theme.textSecondary }}>
      {children}
    </Copy>
  );
}

export function TeacherAccountContent({
  children,
  loadingLayout = 'dashboard',
}: {
  loadingLayout?: LoadingLayout;
  children: (
    data: NonNullable<ReturnType<typeof useTutoringAccount>['query']['data']>
  ) => React.ReactNode;
}) {
  const { query } = useTutoringAccount();
  if (query.isPending) {
    return <DataState loading loadingLayout={loadingLayout} />;
  }
  if (query.isError && !query.data) {
    return <DataState error retry={() => query.refetch()} />;
  }
  if (!query.data) {
    return (
      <TeacherNote>
        Profilul didactic nu este încă disponibil. Actualizează starea contului
        și încearcă din nou.
      </TeacherNote>
    );
  }
  return (
    <>
      {children(query.data)}
      {query.isError && <DataState error retry={() => query.refetch()} />}
    </>
  );
}
