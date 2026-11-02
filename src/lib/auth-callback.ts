export function parseAuthCallback(url: string) {
  const parsed = new URL(url);
  const parameters = new URLSearchParams(parsed.search);
  new URLSearchParams(parsed.hash.slice(1)).forEach((value, key) =>
    parameters.set(key, value)
  );
  return {
    code: parameters.get('code'),
    accessToken: parameters.get('access_token'),
    refreshToken: parameters.get('refresh_token'),
    recovery: parameters.get('type') === 'recovery',
    error: parameters.get('error_description') || parameters.get('error'),
  };
}
