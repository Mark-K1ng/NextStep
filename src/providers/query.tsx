import { PropsWithChildren, useEffect, useState } from 'react';
import { AppState, Platform } from 'react-native';
import {
  focusManager,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
export function QueryProvider({ children }: PropsWithChildren) {
  const [client] = useState(() => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
    });
    queryClient.setQueryDefaults(['explore'], {
      staleTime: 15 * 60_000,
      gcTime: 30 * 60_000,
    });
    queryClient.setQueryDefaults(['option'], {
      staleTime: 10 * 60_000,
      gcTime: 30 * 60_000,
    });
    queryClient.setQueryDefaults(['profile'], { staleTime: 60_000 });
    // A user ID occupies index 1, so resource-specific defaults live in the hooks.
    return queryClient;
  });
  useEffect(() => {
    if (Platform.OS === 'web') {
      return;
    }
    focusManager.setFocused(AppState.currentState === 'active');
    const subscription = AppState.addEventListener('change', (state) => {
      focusManager.setFocused(state === 'active');
    });
    return () => {
      subscription.remove();
      focusManager.setFocused(undefined);
    };
  }, []);
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
