import { act, createElement } from 'react';
import { createRoot } from 'test-renderer';
import TeacherTabs from '@/app/teacher/(tabs)/_layout';
import TeacherNativeTabs from '@/app/teacher/(tabs)/_layout.ios';

let mockAccount: {
  isApprovedTeacher: boolean;
  isPreview: boolean;
  isPending: boolean;
  error: boolean;
};
jest.mock('@/providers/account-mode', () => ({
  useAccountMode: () => ({ ...mockAccount, refresh: jest.fn() }),
}));
jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({
    background: '#18171F',
    surface: '#25232F',
    accentText: '#A78BFA',
    textSecondary: '#A5A1B5',
    border: '#3A3748',
  }),
}));
jest.mock('@/components/data-state', () => ({ DataState: 'data-state' }));
jest.mock('expo-router', () => ({
  Redirect: 'redirect',
  Tabs: Object.assign(
    (props: { children?: unknown }) =>
      require('react').createElement('tabs', props, props.children),
    { Screen: 'tab-screen' }
  ),
}));
jest.mock('expo-router/native-tabs', () => ({
  NativeTabs: Object.assign(
    (props: { children?: unknown }) =>
      require('react').createElement('tabs', props, props.children),
    {
      Trigger: Object.assign(
        (props: { children?: unknown }) =>
          require('react').createElement('trigger', props, props.children),
        { Icon: 'icon', Label: 'label' }
      ),
    }
  ),
}));
jest.mock('lucide-react-native', () => ({
  CalendarDays: 'icon',
  Clock: 'icon',
  LayoutDashboard: 'icon',
  UserRound: 'icon',
}));
beforeEach(() => {
  mockAccount = {
    isApprovedTeacher: true,
    isPreview: false,
    isPending: false,
    error: false,
  };
});

describe.each([
  ['Android/web', TeacherTabs],
  ['iOS', TeacherNativeTabs],
] as const)('%s teacher direct-route guards', (_platform, Component) => {
  it.each(['applicant', 'rejected', 'suspended'])(
    'keeps %s out of every approved teacher tab',
    async () => {
      mockAccount.isApprovedTeacher = false;
      const root = createRoot();
      try {
        await act(async () => root.render(createElement(Component)));
        expect(
          root.container.queryAll((node) => node.type === 'tabs')
        ).toHaveLength(0);
        expect(
          root.container.queryAll((node) => node.type === 'redirect')[0].props
            .href
        ).toBe('/teacher/application');
      } finally {
        await act(async () => root.unmount());
      }
    }
  );

  it('keeps student preview separate from teacher route state', async () => {
    mockAccount.isPreview = true;
    const root = createRoot();
    try {
      await act(async () => root.render(createElement(Component)));
      expect(
        root.container.queryAll((node) => node.type === 'tabs')
      ).toHaveLength(0);
      expect(
        root.container.queryAll((node) => node.type === 'redirect')[0].props
          .href
      ).toBe('/');
    } finally {
      await act(async () => root.unmount());
    }
  });

  it('does not choose a route while access is pending or failed', async () => {
    const root = createRoot();
    try {
      mockAccount.isPending = true;
      await act(async () => root.render(createElement(Component)));
      expect(
        root.container.queryAll((node) => node.type === 'redirect')
      ).toHaveLength(0);
      expect(
        root.container.queryAll((node) => node.type === 'tabs')
      ).toHaveLength(0);
      mockAccount.isPending = false;
      mockAccount.error = true;
      await act(async () => root.render(createElement(Component)));
      expect(
        root.container.queryAll((node) => node.type === 'redirect')
      ).toHaveLength(0);
      expect(
        root.container.queryAll((node) => node.type === 'tabs')
      ).toHaveLength(0);
    } finally {
      await act(async () => root.unmount());
    }
  });

  it('mounts distinct stable destinations for an approved teacher', async () => {
    const root = createRoot();
    try {
      await act(async () => root.render(createElement(Component)));
      const names = root.container
        .queryAll(
          (node) => node.type === 'tab-screen' || node.type === 'trigger'
        )
        .map((node) => node.props.name);
      expect(names).toEqual([
        'dashboard',
        'lessons',
        'availability',
        'profile',
      ]);
    } finally {
      await act(async () => root.unmount());
    }
  });
});
