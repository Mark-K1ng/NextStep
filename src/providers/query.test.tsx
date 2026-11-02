import { act, createElement } from 'react';
import { createRoot } from 'test-renderer';
import {
  focusManager,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';
import { QueryProvider } from './query';
let mockChange: (state: string) => void;
const mockRemove = jest.fn();
jest.mock('react-native', () => ({
  Platform: { OS: 'android' },
  AppState: {
    currentState: 'active',
    addEventListener: (_: string, callback: typeof mockChange) => {
      mockChange = callback;
      return { remove: mockRemove };
    },
  },
}));
it('resumes stale queries after backgrounding and releases the listener', async () => {
  const root = createRoot();
  let client!: QueryClient;
  function Probe() {
    client = useQueryClient();
    return null;
  }
  await act(async () =>
    root.render(createElement(QueryProvider, null, createElement(Probe)))
  );
  mockChange('background');
  expect(focusManager.isFocused()).toBe(false);
  mockChange('active');
  expect(focusManager.isFocused()).toBe(true);
  // Failed fetches remain retryable without a new QueryClient or account cache.
  const request = jest
    .fn()
    .mockRejectedValueOnce(new Error('Offline'))
    .mockResolvedValueOnce(['real record']);
  await expect(
    client.fetchQuery({
      queryKey: ['recovery'],
      queryFn: request,
      retry: false,
    })
  ).rejects.toThrow('Offline');
  await expect(
    client.fetchQuery({
      queryKey: ['recovery'],
      queryFn: request,
      retry: false,
    })
  ).resolves.toEqual(['real record']);
  await act(async () => root.unmount());
  expect(mockRemove).toHaveBeenCalled();
  client.clear();
});
