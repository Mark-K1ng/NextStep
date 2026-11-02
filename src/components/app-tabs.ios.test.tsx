import { registerIosTabReveal } from './ios-tab-context';
import { act, createElement } from 'react';
import { createRoot } from 'test-renderer';
import AppTabs from './app-tabs.ios';
jest.mock('./ios-tab-touch-boundary', () => ({ IosTabTouchBoundary: ({ children }: { children: React.ReactNode }) => children }));

let mockSegments = ['_tabs', '(profile)', 'index'];
jest.mock('expo-router', () => ({ useSegments: () => mockSegments }));
jest.mock('expo-router/native-tabs', () => {
  const React = require('react');
  const Trigger = Object.assign(
    (props: Record<string, unknown>) =>
      React.createElement('native-tab', props),
    { Icon: () => null, Label: () => null }
  );
  return {
    NativeTabs: Object.assign(
      (props: Record<string, unknown>) =>
        React.createElement('native-tabs', props),
      { Trigger }
    ),
  };
});
jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => require('@/theme/tokens').darkColors,
}));

it('lets screen safe areas own insets instead of letting UIKit adjust them again during navigation', async () => {
  const root = createRoot();
  try {
    await act(async () => root.render(createElement(AppTabs)));
    const tabs = root.container.queryAll(
      (node) => node.type === 'native-tab' && !node.props.hidden
    );
    expect(tabs.map((tab) => tab.props.name)).toEqual([
      '(home)',
      '(tutoring)',
      '(explore)',
      '(path)',
      '(profile)',
    ]);
    for (const tab of tabs) {
      expect(tab.props.disableAutomaticContentInsets).toBe(true);
    }
  } finally {
    await act(async () => root.unmount());
  }
});

it('hides the native bar only while the palette editor is open and restores it on Back', async () => {
  const root = createRoot();
  try {
    mockSegments = ['_tabs', '(profile)', 'palette'];
    await act(async () => root.render(createElement(AppTabs)));
    expect(
      root.container.queryAll((node) => node.type === 'native-tabs')[0].props
        .hidden
    ).toBe(true);
    mockSegments = ['_tabs', '(profile)', 'index'];
    await act(async () => root.render(createElement(AppTabs)));
    expect(
      root.container.queryAll((node) => node.type === 'native-tabs')[0].props
        .hidden
    ).toBe(false);
  } finally {
    mockSegments = ['_tabs', '(profile)', 'index'];
    await act(async () => root.unmount());
  }
});


it('starts before focus from a native tab press, ignores prevented presses, and deduplicates appearance', async () => {
  jest.useFakeTimers();
  const now = jest.spyOn(Date, 'now').mockReturnValue(1000);
  const startHome = jest.fn(), startProfile = jest.fn(), prepareHome = jest.fn();
  const removeHome = registerIosTabReveal('(home)', startHome, prepareHome);
  const removeProfile = registerIosTabReveal('(profile)', startProfile);
  const root = createRoot();
  try {
    await act(async () => root.render(createElement(AppTabs)));
    const tabs = root.container.queryAll(n => n.type === 'native-tab');
    const home = tabs.find(n => n.props.name === '(home)')!;
    const profile = tabs.find(n => n.props.name === '(profile)')!;
    await act(async () => home.props.unstable_nativeProps.onWillAppear());
    now.mockReturnValue(2000);
    await act(async () => profile.props.listeners.tabPress({ data: { isPrevented: false } }));
    await act(async () => profile.props.unstable_nativeProps.onWillAppear());
    expect(startProfile).toHaveBeenCalledTimes(1);
    await act(async () => home.props.listeners.tabPress({ data: { isPrevented: true } }));
    expect(startHome).toHaveBeenCalledTimes(1);
    await act(async () => home.props.unstable_nativeProps.onWillDisappear());
    expect(prepareHome).toHaveBeenCalled();
  } finally {
    await act(async () => root.unmount());
    removeHome(); removeProfile(); now.mockRestore(); jest.useRealTimers();
  }
});
