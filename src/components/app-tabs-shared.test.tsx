import { act, createElement, isValidElement } from 'react';
import { createRoot } from 'test-renderer';
import { transformFileSync } from '@babel/core';

let mockReduced = false;
jest.mock('@/providers/motion', () => ({
  useMotionPreference: () => mockReduced,
}));

it.each(['web', 'android'])(
  'keeps the %s tab-bar callback compatible with the persistent Android frame',
  async (platform) => {
    let renderTabBar: (props: unknown) => React.ReactElement;
    let tabProps: any;
    const Tabs = Object.assign(
      (props: { tabBar: typeof renderTabBar }) => {
        renderTabBar = props.tabBar;
        tabProps = props;
        return null;
      },
      {
        Screen: () => null,
        Protected: ({ children }: { children: React.ReactNode }) => children,
      }
    );
    const code = transformFileSync(require.resolve('./app-tabs-shared'), {
      babelrc: false,
      configFile: false,
      presets: ['babel-preset-expo'],
      caller: {
        name: 'metro',
        platform: 'android',
        supportsReactCompiler: true,
      },
    })!.code!;
    expect(code).toContain('react/compiler-runtime');
    const compiled = { exports: {} as { default: React.ComponentType } };
    const load = (id: string) => {
      if (id === 'react-native') return { Platform: { OS: platform } };
      if (id === 'expo-router') return { Tabs };
      if (id === './bottom-navigation') {
        return {
          BottomNavigation: ({ active }: { active: string }) =>
            createElement('navigation', { active }),
        };
      }
      if (id === '@/hooks/use-theme')
        return { useTheme: () => ({ background: '#18171F' }) };
      return require(id);
    };
    new Function('require', 'module', 'exports', code)(
      load,
      compiled,
      compiled.exports
    );
    const root = createRoot();
    try {
      await act(async () => {
        root.render(createElement(compiled.exports.default));
      });
      expect(tabProps.backBehavior).toBe('fullHistory');
      expect(tabProps.screenOptions.animation).toBe('none');
      expect(tabProps.screenOptions.transitionSpec).toBeUndefined();
      mockReduced = true;
      await act(async () => {
        root.render(createElement(compiled.exports.default));
      });
      expect(tabProps.screenOptions.animation).toBe('none');
      expect(tabProps.screenOptions.transitionSpec).toBeUndefined();
      for (const [route, active] of [
        ['home/index', 'home'],
        ['tutoring/index', 'tutoring'],
        ['recommendations/index', 'path'],
        ['profile/index', 'profile'],
      ]) {
        // Context render callbacks can run without a component's hook dispatcher.
        const element = renderTabBar!({
          state: { index: 0, routes: [{ name: route }] },
        });
        if (platform === 'android') {
          expect(element).toBeNull();
          continue;
        }
        expect(isValidElement(element)).toBe(true);
        await act(async () => {
          root.render(element);
        });
        expect(root.container.toJSON()).toMatchObject({
          children: [{ type: 'navigation', props: { active } }],
        });
      }
    } finally {
      mockReduced = false;
      await act(async () => {
        root.unmount();
      });
    }
  }
);
