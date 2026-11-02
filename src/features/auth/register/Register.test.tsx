import { completeRegistration } from '@/services/registration';
jest.mock('@/services/education', () => ({ readGuestIntake: jest.fn() }));
let mockRoutesEnabled = false;
jest.mock('@/constants/education-rollout', () => ({
  get EDUCATION_ROUTES_ENABLED() {
    return mockRoutesEnabled;
  },
}));
jest.mock('@/hooks/use-app-router', () => ({
  useAppRouter: () => require('expo-router').useRouter(),
}));
import { act, createElement } from 'react';
import { createRoot } from 'test-renderer';
import Register from './Register';
import { ro } from '@/i18n/ro';
const mockSignUp = jest.fn();
const mockReplace = jest.fn();
const mockPush = jest.fn();
let mockAccountKind: string | undefined;
jest.mock('../account-kind-choice', () => ({
  AccountKindChoice: 'account-kind-choice',
}));

jest.mock('expo-linking', () => ({ createURL: jest.fn() }));
jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace, push: mockPush }),
  useLocalSearchParams: () => ({
    county: 'București',
    sector: '3',
    gradeLevel: 'VIII',
    accountKind: mockAccountKind,
  }),
}));
jest.mock('@/hooks/use-supabase', () => ({
  useSupabase: () => ({ supabase: { auth: { signUp: mockSignUp } } }),
}));

beforeEach(() => {
  mockRoutesEnabled = false;
  jest.clearAllMocks();
  mockAccountKind = undefined;
  mockSignUp.mockResolvedValue({
    data: { session: null, user: null },
    error: null,
  });
});
it('offers the intake before email entry for a direct student signup, while keeping skip explicit', async () => {
  mockRoutesEnabled = true;
  const root = createRoot();
  try {
    await act(async () => root.render(createElement(Register)));
    expect(
      root.container.queryAll((node) => node.type === 'input')
    ).toHaveLength(0);
    const start = root.container.queryAll(
      (node) =>
        node.type === 'button' &&
        node.props.children === 'Descoperă primele direcții'
    )[0];
    await act(async () => start.props.onPress());
    expect(mockReplace).toHaveBeenCalledWith('/(auth)/onboarding/2');
    expect(mockSignUp).not.toHaveBeenCalled();
  } finally {
    await act(async () => root.unmount());
  }
});

it('opens teacher registration directly from the welcome entry without student fields', async () => {
  mockAccountKind = 'teacher';
  const root = createRoot();
  try {
    await act(async () => root.render(createElement(Register)));
    expect(
      root.container.queryAll((node) => node.type === 'account-kind-choice')[0]
        .props.value
    ).toBe('teacher');
    expect(
      root.container.queryAll((node) => node.type === 'county-selector')
    ).toHaveLength(0);
    expect(
      root.container.queryAll(
        (node) =>
          node.type === 'input' && node.props.label === 'Nume și prenume'
      )
    ).toHaveLength(1);
  } finally {
    await act(async () => root.unmount());
  }
});
jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => require('@/theme/tokens').darkColors,
}));
jest.mock('@/hooks/use-translation', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock('@/services/registration', () => ({
  completeRegistration: jest.fn(),
  parseStringArray: () => [],
}));
jest.mock('@/lib/show-message', () => ({ showMessage: jest.fn() }));
jest.mock('@/components/social-sign-in', () => ({ SocialSignIn: () => null }));
jest.mock('@/components/design', () => ({
  Screen: 'screen',
  Brand: 'brand',
  Copy: 'copy',
}));
jest.mock('@/components', () => ({ Button: 'button', Input: 'input' }));
jest.mock('@/components/motion', () => ({ MotionPressable: 'pressable' }));
jest.mock('@/components/profile-selectors', () => ({
  CountySelect: (props: {
    county: string;
    sector: number | null;
    onChange(county: string, sector: number | null): void;
  }) => require('react').createElement('county-selector', props),
  GradeSelect: () => null,
}));
jest.mock('react-native', () => ({
  View: 'view',
  Text: 'text',
  Pressable: 'pressable',
  StyleSheet: { create: (value: unknown) => value },
}));

it('keeps the county editable after changing the capital supplied by onboarding', async () => {
  const root = createRoot();
  const countyFields = () =>
    root.container.queryAll((node) => node.type === 'county-selector');
  try {
    await act(async () => root.render(createElement(Register)));
    expect(countyFields()).toHaveLength(1);
    expect(countyFields()[0].props.county).toBe('București');
    expect(countyFields()[0].props.sector).toBe(3);

    await act(async () => countyFields()[0].props.onChange('Bihor', null));
    expect(countyFields()).toHaveLength(1);
    expect(countyFields()[0].props.county).toBe('Bihor');
    expect(countyFields()[0].props.sector).toBeNull();

    await act(async () => countyFields()[0].props.onChange('Cluj', null));
    expect(countyFields()).toHaveLength(1);
    expect(countyFields()[0].props.county).toBe('Cluj');
  } finally {
    await act(async () => root.unmount());
  }
});

it.each([false, true])(
  'registers identity-only teacher accounts and follows the server session (automatic confirmation: %s)',
  async (autoConfirm) => {
    const user = {
      id: 'new-teacher',
      email_confirmed_at: 'automatic',
      user_metadata: {},
    };
    if (autoConfirm)
      mockSignUp.mockResolvedValue({
        data: { session: { user }, user },
        error: null,
      });
    const root = createRoot();
    try {
      await act(async () => root.render(createElement(Register)));
      await act(async () =>
        root.container
          .queryAll((node) => node.type === 'account-kind-choice')[0]
          .props.onChange('teacher')
      );
      expect(
        root.container.queryAll((node) => node.type === 'county-selector')
      ).toHaveLength(0);
      const input = (label: string) =>
        root.container.queryAll(
          (node) => node.type === 'input' && node.props.label === label
        )[0];
      await act(async () => {
        input('Nume și prenume').props.onChangeText('Profesor Ana');
        input('auth.email').props.onChangeText('teacher@example.com');
        input('auth.password').props.onChangeText('good-password');
        input('auth.confirmPassword').props.onChangeText('good-password');
        root.container
          .queryAll(
            (node) =>
              node.type === 'pressable' &&
              node.props.accessibilityRole === 'checkbox'
          )[0]
          .props.onPress();
      });
      await act(async () =>
        root.container
          .queryAll(
            (node) =>
              node.type === 'button' &&
              node.props.children === ro.visual.registerAction
          )[0]
          .props.onPress()
      );
      expect(mockSignUp).toHaveBeenCalledWith(
        expect.objectContaining({
          options: expect.objectContaining({
            data: {
              account_kind: 'teacher',
              nextstep_profile_pending: { display_name: 'Profesor Ana' },
            },
          }),
        })
      );
      if (autoConfirm) {
        expect(completeRegistration).toHaveBeenCalledWith(user);
        expect(mockReplace).toHaveBeenCalledWith('/');
        expect(mockReplace).not.toHaveBeenCalledWith(
          expect.objectContaining({ pathname: '/(auth)/verify-email' })
        );
      } else {
        expect(mockReplace).toHaveBeenCalledWith({
          pathname: '/(auth)/verify-email',
          params: { email: 'teacher@example.com', accountKind: 'teacher' },
        });
      }
    } finally {
      await act(async () => root.unmount());
    }
  }
);
jest.mock('@/components/decoding-text', () => ({ DecodingText: 'Text' }));

it.each([
  [ro.profile.terms, '/terms', false],
  [ro.profile.terms, '/terms', true],
  [ro.profile.privacyPolicy, '/privacy', false],
  [ro.profile.privacyPolicy, '/privacy', true],
])(
  'opens %s at %s without changing consent or entered fields (accepted: %s)',
  async (label, route, accepted) => {
    const root = createRoot();
    const checkbox = () =>
      root.container.queryAll(
        (node) => node.props.accessibilityRole === 'checkbox'
      )[0];
    const email = () =>
      root.container.queryAll(
        (node) => node.type === 'input' && node.props.label === 'auth.email'
      )[0];
    try {
      await act(async () => root.render(createElement(Register)));
      await act(async () => {
        email().props.onChangeText('reader@example.com');
        if (accepted) checkbox().props.onPress();
      });
      const link = root.container.queryAll(
        (node) =>
          node.type === 'pressable' &&
          node.props.accessibilityRole === 'link' &&
          node.props.accessibilityLabel === label
      )[0];
      await act(async () => link.props.onPress());
      expect(mockPush).toHaveBeenCalledWith(route);
      expect(mockReplace).not.toHaveBeenCalled();
      expect(checkbox().props.accessibilityState.checked).toBe(accepted);
      expect(email().props.value).toBe('reader@example.com');
      expect(mockSignUp).not.toHaveBeenCalled();
    } finally {
      await act(async () => root.unmount());
    }
  }
);
