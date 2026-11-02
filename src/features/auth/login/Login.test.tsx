jest.mock('@/hooks/use-app-router', () => ({
  useAppRouter: () => require('expo-router').useRouter(),
}));
import { act, createElement } from 'react';
import { createRoot } from 'test-renderer';
import Login from './Login';
import { ro } from '@/i18n/ro';

const mockSignIn = jest.fn();
const mockGetUser = jest.fn();
const mockReplace = jest.fn();
const mockShowMessage = jest.fn();
const mockCompleteRegistration = jest.fn();
const mockGetAccountAccess = jest.fn();
let mockSubmit: () => Promise<void>;
const mockInputs: Record<string, (value: string) => void> = {};
jest.mock('@/hooks/use-supabase', () => ({
  useSupabase: () => ({
    supabase: {
      auth: { signInWithPassword: mockSignIn, getUser: mockGetUser },
    },
  }),
}));
jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace, push: jest.fn() }),
  useLocalSearchParams: () => ({}),
}));
jest.mock('../account-kind-choice', () => ({
  AccountKindChoice: 'account-kind-choice',
}));
jest.mock('@/lib/show-message', () => ({
  showMessage: (value: string) => mockShowMessage(value),
}));
jest.mock('@/services/registration', () => ({
  completeRegistration: (user: unknown) => mockCompleteRegistration(user),
}));
jest.mock('@/services/account-access', () => ({
  getAccountAccess: () => mockGetAccountAccess(),
}));
jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => require('@/theme/tokens').darkColors,
}));
jest.mock('@/hooks/use-translation', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock('@/components/social-sign-in', () => ({ SocialSignIn: () => null }));
jest.mock('@/components/design', () => ({
  Screen: 'screen',
  Brand: 'brand',
  Copy: 'copy',
}));
jest.mock('@/components', () => ({
  Button: (props: { onPress(): Promise<void> }) => {
    mockSubmit = props.onPress;
    return require('react').createElement('button', props);
  },
  Input: (props: { label: string; onChangeText(value: string): void }) => {
    mockInputs[props.label] = props.onChangeText;
    return require('react').createElement('input', props);
  },
}));
jest.mock('react-native', () => ({
  View: 'view',
  Text: 'text',
  StyleSheet: { create: (value: unknown) => value },
}));
beforeEach(() => {
  jest.clearAllMocks();
  mockGetAccountAccess.mockResolvedValue({ account_kind: 'student' });
});

async function submit() {
  const root = createRoot();
  try {
    await act(async () => {
      root.render(createElement(Login));
    });
    await act(async () => {
      mockInputs['auth.email'](' student@example.com ');
      mockInputs['auth.password']('example-password');
    });
    await act(async () => {
      await mockSubmit();
    });
  } finally {
    await act(async () => {
      root.unmount();
    });
  }
}

it('opens verification for an email_not_confirmed rejection instead of reporting bad credentials', async () => {
  mockSignIn.mockResolvedValue({
    data: { user: null },
    error: { code: 'email_not_confirmed', status: 400 },
  });
  await submit();
  expect(mockReplace).toHaveBeenCalledWith({
    pathname: '/(auth)/verify-email',
    params: { email: 'student@example.com', accountKind: 'student' },
  });
  expect(mockShowMessage).not.toHaveBeenCalled();
  expect(mockCompleteRegistration).not.toHaveBeenCalled();
});

it('keeps invalid credentials generic and does not open protected screens', async () => {
  mockSignIn.mockResolvedValue({
    data: { user: null },
    error: { code: 'invalid_credentials' },
  });
  await submit();
  expect(mockShowMessage).toHaveBeenCalledWith(ro.feedback.loginFailed);
  expect(mockReplace).not.toHaveBeenCalled();
});

it('finishes confirmed onboarding after a successful login', async () => {
  const user = { id: 'owner', email_confirmed_at: 'confirmed' };
  mockSignIn.mockResolvedValue({ data: { user }, error: null });
  mockGetUser.mockResolvedValue({ data: { user }, error: null });
  await submit();
  expect(mockSignIn).toHaveBeenCalledWith({
    email: 'student@example.com',
    password: 'example-password',
  });
  expect(mockCompleteRegistration).toHaveBeenCalledWith(user);
  expect(mockReplace).toHaveBeenCalledWith('/');
});

it('does not reclassify a student when Profesor is selected at login', async () => {
  const user = {
    id: 'owner',
    email_confirmed_at: 'confirmed',
    user_metadata: { account_kind: 'student' },
  };
  mockSignIn.mockResolvedValue({ data: { user }, error: null });
  const root = createRoot();
  try {
    await act(async () => root.render(createElement(Login)));
    await act(async () =>
      root.container
        .queryAll((node) => node.type === 'account-kind-choice')[0]
        .props.onChange('teacher')
    );
    await act(async () => {
      mockInputs['auth.email']('student@example.com');
      mockInputs['auth.password']('example-password');
    });
    await act(async () => mockSubmit());
    expect(mockSignIn).toHaveBeenCalledWith({
      email: 'student@example.com',
      password: 'example-password',
    });
    expect(mockCompleteRegistration).toHaveBeenCalledWith(user);
    expect(mockShowMessage).toHaveBeenCalledWith(
      'Acesta este un cont de elev sau student. Deschidem contul tău de elev.'
    );
    expect(mockReplace).toHaveBeenCalledWith('/');
  } finally {
    await act(async () => root.unmount());
  }
});

it('does not label profile setup failures as incorrect credentials', async () => {
  mockSignIn.mockResolvedValue({
    data: { user: { id: 'owner', email_confirmed_at: 'confirmed' } },
    error: null,
  });
  mockCompleteRegistration.mockRejectedValueOnce(
    new Error('Profile write unavailable')
  );
  await submit();
  expect(mockShowMessage).toHaveBeenCalledWith(ro.feedback.profileFailed);
  expect(mockReplace).not.toHaveBeenCalled();
});

it('lets the root own authoritative access recovery when the optional mismatch lookup fails', async () => {
  mockSignIn.mockResolvedValue({
    data: { user: { id: 'owner', email_confirmed_at: 'confirmed' } },
    error: null,
  });
  mockGetAccountAccess.mockRejectedValueOnce(
    new Error('Account access unavailable')
  );
  await submit();
  expect(mockReplace).toHaveBeenCalledWith('/');
  expect(mockShowMessage).not.toHaveBeenCalled();
});

it('keeps network failures separate from incorrect credentials', async () => {
  mockSignIn.mockRejectedValueOnce(new Error('Network unavailable'));
  await submit();
  expect(mockShowMessage).toHaveBeenCalledWith(ro.feedback.loginUnavailable);
  expect(mockReplace).not.toHaveBeenCalled();
});
jest.mock('@/components/decoding-text', () => ({ DecodingText: 'Text' }));
