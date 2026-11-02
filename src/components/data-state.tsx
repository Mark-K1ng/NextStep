import { Copy, Panel } from './design';
import { Button } from './Button';
import { ro } from '@/i18n/ro';
import { LoadingPlaceholder, type LoadingLayout } from './loading-layout';
import type { ReactNode } from 'react';
export function DataState({
  loading,
  error,
  retry,
  loadingLayout = 'text',
  loadingContent,
}: {
  loading?: boolean;
  error?: boolean;
  retry?: () => void;
  loadingLayout?: LoadingLayout;
  loadingContent?: ReactNode;
}) {
  if (loading) {
    return (
      <LoadingPlaceholder layout={loadingLayout}>
        {loadingContent}
      </LoadingPlaceholder>
    );
  }
  return (
    <Panel>
      <>
        <Copy accessibilityRole={error ? 'alert' : undefined}>
          {error ? ro.errors.serverError : ro.common.noItems}
        </Copy>
        {retry && (
          <Button variant='secondary' onPress={retry}>
            {ro.common.retry}
          </Button>
        )}
      </>
    </Panel>
  );
}
