import { parseAuthCallback } from './auth-callback';

it('reads native recovery tokens from the URL fragment', () => {
  expect(parseAuthCallback('nextstep://auth-callback#access_token=access&refresh_token=refresh&type=recovery')).toEqual({
    code: null, accessToken: 'access', refreshToken: 'refresh', recovery: true, error: null,
  });
});

it('reads PKCE codes and errors from the query string', () => {
  expect(parseAuthCallback('https://example.com/auth-callback?code=one-time-code').code).toBe('one-time-code');
  expect(parseAuthCallback('https://example.com/auth-callback?error=access_denied').error).toBe('access_denied');
});

it('does not treat an arbitrary URL as a recovery link', () => {
  const result = parseAuthCallback('https://example.com/auth-callback');
  expect(result.accessToken).toBeNull();
  expect(result.code).toBeNull();
  expect(result.recovery).toBe(false);
});
