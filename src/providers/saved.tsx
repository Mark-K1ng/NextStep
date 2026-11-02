import {
  createContext,
  useContext,
  useEffect,
  useRef,
  type PropsWithChildren,
} from 'react';
import { AppState } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from './auth';
import type { ExploreItem } from '@/types/models';
import { showMessage } from '@/lib/show-message';
import { normalizeSavedOption } from '@/lib/saved-options';
import { loadBookmarks, writeBookmark } from '@/services/bookmarks';
import { ro } from '@/i18n/ro';
import { useAccountMode } from './account-mode';

type SavedContextValue = {
  error: boolean;
  retry(): void;
  items: ExploreItem[];
  ready: boolean;
  toggle(item: ExploreItem): Promise<boolean | undefined>;
};
const SavedContext = createContext<SavedContextValue>({
  items: [],
  ready: false,
  error: false,
  retry() {},
  async toggle() {
    return undefined;
  },
});
export function SavedProvider({ children }: PropsWithChildren) {
  const { session } = useSession();
  const { isTeacher, access } = useAccountMode();
  const userId = session?.user.id;
  const principal = useRef(userId);
  principal.current = userId;
  const client = useQueryClient();
  const key = ['bookmarks', userId];
  const queue = useRef(Promise.resolve<boolean | undefined>(undefined));
  const query = useQuery({
    queryKey: key,
    enabled: !!userId && !!access,
    queryFn: () => loadBookmarks(userId!, { migrate: !isTeacher }),
    refetchInterval: 30_000,
  });
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        client.invalidateQueries({ queryKey: ['bookmarks', userId] });
      }
    });
    return () => subscription.remove();
  }, [client, userId]);
  const toggle = (input: ExploreItem) => {
    if (isTeacher) {
      showMessage(
        'Salvarea opțiunilor este disponibilă doar pentru conturile de elev.'
      );
      return Promise.resolve(undefined);
    }
    const requested = userId;
    const operation = async () => {
      if (!requested || principal.current !== requested) {
        return undefined;
      }
      const queryKey = ['bookmarks', requested];
      const previous = client.getQueryData<ExploreItem[]>(queryKey);
      if (!previous) {
        return undefined;
      }
      let item: ExploreItem;
      try {
        item = normalizeSavedOption(input);
      } catch {
        showMessage(ro.errors.serverError);
        return undefined;
      }
      await client.cancelQueries({ queryKey });
      const exists = previous.some(
        (value) => value.type === item.type && value.id === item.id
      );
      client.setQueryData(
        queryKey,
        exists
          ? previous.filter(
              (value) => value.type !== item.type || value.id !== item.id
            )
          : [...previous, item]
      );
      try {
        await writeBookmark(requested, item, !exists);
        return principal.current === requested ? !exists : undefined;
      } catch {
        if (principal.current === requested) {
          client.setQueryData(queryKey, previous);
          showMessage(ro.errors.serverError);
        }
        return undefined;
      } finally {
        if (principal.current === requested) {
          await client.invalidateQueries({ queryKey });
          await client.invalidateQueries({
            queryKey: ['education-route', requested],
          });
        }
      }
    };
    const pending = queue.current.then(operation, operation);
    queue.current = pending;
    return pending;
  };
  return (
    <SavedContext.Provider
      value={{
        items: query.data || [],
        ready: !!userId && !!query.data,
        error: query.isError,
        retry: () => {
          query.refetch();
        },
        toggle,
      }}
    >
      {children}
    </SavedContext.Provider>
  );
}
export const useSaved = () => useContext(SavedContext);
