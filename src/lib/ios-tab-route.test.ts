import { iosTabRoute } from './ios-tab-route';

it.each(['home', 'tutoring', 'explore', 'path', 'profile'] as const)(
  'keeps detail navigation in the %s native tab with params intact',
  (origin) => {
    const input = {
      pathname: '/school/[id]' as const,
      params: { id: 'verified-school', intent: 'goal' },
    };
    expect(iosTabRoute(input, origin)).toEqual({
      ...input,
      pathname: `/_tabs/(${origin})/school/[id]`,
    });
  }
);
it('switches peer tabs without pushing into the originating tab', () => {
  expect(iosTabRoute('/_tabs/tutoring', 'home')).toBe('/_tabs/(tutoring)');
  expect(iosTabRoute('/tutoring/application', 'profile')).toBe(
    '/_tabs/(tutoring)/tutoring/application'
  );
  expect(iosTabRoute('/tutoring/application', 'tutoring')).toBe(
    '/_tabs/(tutoring)/tutoring/application'
  );
  expect(iosTabRoute('/_tabs/profile', 'explore')).toBe('/_tabs/(profile)');
  expect(iosTabRoute('/_tabs/home/index?source=saved', 'profile')).toBe(
    '/_tabs/(home)?source=saved'
  );
});
it('preserves auth, external, already scoped routes and public policies', () => {
  for (const href of [
    '/(auth)/login',
    'https://example.org',
    '/_tabs/(home)/saved',
    '/privacy',
    '/terms',
  ] as const) {
    expect(iosTabRoute(href, null)).toBe(href);
  }
  expect(iosTabRoute('/privacy', 'profile')).toBe('/_tabs/(profile)/privacy');
});
it('keeps category and comparison state on their native stack', () => {
  expect(iosTabRoute('/qa', 'profile')).toBe('/_tabs/(profile)/qa');
  expect(
    iosTabRoute(
      { pathname: '/explore', params: { section: 'skills', intent: 'goal' } },
      'path'
    )
  ).toEqual({
    pathname: '/_tabs/(path)/explore',
    params: { section: 'skills', intent: 'goal' },
  });
  expect(iosTabRoute('/compare', 'explore')).toBe('/_tabs/(explore)/compare');
});
it('keeps preferences full-screen without a bottom tab bar for onboarding and later edits', () => {
  expect(iosTabRoute('/personalize', null)).toBe('/personalize');
  expect(iosTabRoute('/personalize', 'profile')).toBe('/personalize');
  expect(iosTabRoute('/personalize', 'path')).toBe('/personalize');
});
