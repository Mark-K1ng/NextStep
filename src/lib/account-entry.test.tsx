jest.mock('@/components/registration-gate', () => ({ RegistrationGate: 'registration-gate' }));
import { act, createElement } from 'react';
import { createRoot } from 'test-renderer';
import Index from '../app/index';

let mockNeedsCompletion = true;
let mockAccess = { access: { account_kind: 'teacher' }, isTeacher: true, isApprovedTeacher: false, isPreview: false, isPending: false };
jest.mock('@/providers/account-mode', () => ({ useAccountMode: () => mockAccess }));
jest.mock('@/providers/auth', () => ({ useSession: () => ({ session: { user: { email_confirmed_at: 'yes', user_metadata: { nextstep_profile_pending: true } } } }) }));
jest.mock('@/hooks/use-personalization', () => ({ usePersonalization: () => ({ data: { onboarding_required: true } }) }));
jest.mock('@/lib/finish-auth', () => ({ needsProfileCompletion: () => mockNeedsCompletion }));
jest.mock('expo-router', () => ({ Redirect: 'redirect' }));
jest.mock('react-native', () => ({ Platform: { OS: 'android' } }));

it('routes teacher applicants and approved teachers without invoking student onboarding, and supports preview', async () => {
  const root = createRoot();
  const destination = () => root.container.queryAll((node) => node.type === 'redirect')[0]?.props.href;
  try {
    await act(async () => root.render(createElement(Index)));
    expect(destination()).toBe('/teacher/application');
    mockAccess = { ...mockAccess, isApprovedTeacher: true };
    await act(async () => root.render(createElement(Index)));
    expect(destination()).toBe('/teacher/dashboard');
    mockAccess = { ...mockAccess, isPreview: true };
    await act(async () => root.render(createElement(Index)));
    expect(destination()).toBe('/_tabs/home');
    mockAccess = { ...mockAccess, isTeacher: false, isApprovedTeacher: false, isPreview: false, access: { account_kind: 'student' } };
    await act(async () => root.render(createElement(Index)));
    expect(destination()).toBe('/complete-profile');
  } finally { await act(async () => root.unmount()); }
});


it('finishes a signed-in pending signup without redirecting to email verification', async () => {
  mockNeedsCompletion = false;
  mockAccess = { ...mockAccess, isTeacher: false, isApprovedTeacher: false, isPreview: false, access: { account_kind: 'student' } };
  const root = createRoot();
  try {
    await act(async () => root.render(createElement(Index)));
    expect(root.container.queryAll(n => n.type === 'registration-gate')).toHaveLength(1);
    expect(root.container.queryAll(n => n.type === 'redirect')).toHaveLength(0);
  } finally { await act(async () => root.unmount()); mockNeedsCompletion = true; }
});
