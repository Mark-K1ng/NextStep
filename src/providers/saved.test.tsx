import { act, createElement } from 'react';
import { createRoot } from 'test-renderer';
import { QueryClient, QueryClientProvider, notifyManager } from '@tanstack/react-query';
import { SavedProvider, useSaved } from './saved';
import { loadBookmarks, writeBookmark } from '@/services/bookmarks';
import type { ExploreItem } from '@/types/models';
let mockTeacher = false;
jest.mock('./account-mode', () => ({ useAccountMode: () => ({ isTeacher: mockTeacher, access: { account_kind: mockTeacher ? 'teacher' : 'student' } }) }));
jest.mock('./auth', () => ({
  useSession: () => ({ session: { user: { id: 'owner' } } }),
}));
jest.mock('@/services/bookmarks', () => ({
  loadBookmarks: jest.fn(),
  writeBookmark: jest.fn(),
}));
jest.mock('@/lib/show-message', () => ({ showMessage: jest.fn() }));
let saved: ReturnType<typeof useSaved>;
function Probe() {
  saved = useSaved();
  return null;
}
let root: ReturnType<typeof createRoot>;
let client: QueryClient;
let items: ExploreItem[];
beforeEach(() => {
  mockTeacher = false;
  notifyManager.setScheduler((callback)=>callback());
  jest.clearAllMocks();
  items = [];
  jest.mocked(loadBookmarks).mockImplementation(async () => items);
  jest
    .mocked(writeBookmark)
    .mockImplementation(async (_user, item, selected) => {
      items = selected
        ? [...items, item]
        : items.filter((v) => v.id !== item.id || v.type !== item.type);
    });
  client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  root = createRoot();
});
it('reads preserved teacher bookmarks without importing student data and refuses preview writes', async () => {
  mockTeacher = true;
  await mount();
  expect(loadBookmarks).toHaveBeenCalledWith('owner', { migrate: false });
  let result;
  await act(async () => { result = await saved.toggle({ id: 'x', type: 'skills' }); });
  expect(result).toBeUndefined();
  expect(writeBookmark).not.toHaveBeenCalled();
});
afterEach(async () => {
  await act(async () => root.unmount());
  client.clear();
});
async function mount() {
  await act(async () => {
    await root.render(
      createElement(
        QueryClientProvider,
        { client },
        createElement(SavedProvider, null, createElement(Probe))
      )
    );
  });
  await act(async()=>{await new Promise((resolve)=>setTimeout(resolve,10));});
}
it.each([
  'skills',
  'schools',
  'school_profiles',
  'universities',
  'programs',
  'careers',
  'courses',
])('persists %s as an account bookmark only', async (type) => {
  await mount();
  expect(saved.ready).toBe(true);
  let result;
  await act(async () => {
    result = await saved.toggle({ id: 'option', type, name: 'Opțiune' });
  });
  expect(result).toBe(true);
  expect(writeBookmark).toHaveBeenCalledWith(
    'owner',
    expect.objectContaining({ id: 'option', type }),
    true
  );
  expect(saved.items).toHaveLength(1);
  await act(async () => {
    await saved.toggle({ id: 'option', type });
  });
  expect(saved.items).toEqual([]);
});
it('rolls back optimistic feedback and withholds success when persistence fails', async () => {
  await mount();
  jest.mocked(writeBookmark).mockRejectedValue(new Error('offline'));
  let result;
  await act(async () => {
    result = await saved.toggle({ id: 'x', type: 'skills' });
  });
  expect(result).toBeUndefined();
  expect(saved.items).toEqual([]);
});
it('loads account data even without any local cache and refreshes other-device changes', async () => {
  items = [{ id: 'x', type: 'skills', name: 'SQL' }];
  await mount();
  expect(saved.items).toEqual(items);
  items = [];
  await act(async () => {
    await client.refetchQueries({ queryKey: ['bookmarks', 'owner'] });
    await new Promise((resolve) => setTimeout(resolve, 10));
  });
  expect(saved.items).toEqual([]);
});
it('shows a retry state instead of enabling unsynchronised saves on initial failure', async () => {
  jest.mocked(loadBookmarks).mockRejectedValue(new Error('offline'));
  await mount();
  expect(saved.error).toBe(true);
  expect(saved.ready).toBe(false);
});
