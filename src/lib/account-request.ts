/** Bound interactive requests. A timeout never counts as a successful save;
 * reload authoritative account state before retrying an uncertain mutation.
 */
export async function accountRequest<T>(
  request: (signal: AbortSignal) => PromiseLike<T>,
  milliseconds = 15_000
): Promise<T> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      Promise.resolve().then(() => request(controller.signal)),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          controller.abort();
          reject(new Error('Request timed out'));
        }, milliseconds);
      }),
    ]);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}
