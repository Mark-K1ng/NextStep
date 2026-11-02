import { accountRequest } from './account-request';
it('returns a successful response without leaving a timer', async () => {
  await expect(accountRequest(async () => 42, 20)).resolves.toBe(42);
});
it('aborts a stalled request and rejects instead of reporting success', async () => {
  let signal: AbortSignal | undefined;
  await expect(
    accountRequest((value) => {
      signal = value;
      return new Promise(() => {});
    }, 5)
  ).rejects.toThrow('timed out');
  expect(signal?.aborted).toBe(true);
});
