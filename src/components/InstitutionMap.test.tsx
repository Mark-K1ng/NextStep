import { act, createElement } from 'react';
import { createRoot } from 'test-renderer';
import { InstitutionMap } from './InstitutionMap';
import { institutionMap } from '@/lib/institution-map';

let mockWebView: {
  source: { html?: string; uri?: string };
  onError(): void;
  onShouldStartLoadWithRequest(request: { url: string }): boolean;
};
let mockPress: () => void;
const mockOpenExternalUrl = jest.fn();
jest.mock('@/components/motion', () => ({
  MotionPressable: (props: { onPress(): void; children?: React.ReactNode }) => {
    mockPress = props.onPress;
    return require('react').createElement('pressable', props, props.children);
  },
}));
jest.mock('react-native', () => ({
  View: 'view',
  Pressable: (props: { onPress(): void }) => {
    mockPress = props.onPress;
    return require('react').createElement('pressable', props);
  },
  StyleSheet: { create: (styles: unknown) => styles },
}));
jest.mock('react-native-webview', () => ({
  WebView: (props: typeof mockWebView) => {
    mockWebView = props;
    return require('react').createElement('webview', props);
  },
}));
jest.mock('@/components/design', () => ({ Copy: 'copy' }));
jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => require('@/theme/tokens').darkColors,
}));
jest.mock('@/lib/open-external-url', () => ({
  openExternalUrl: (url: string) => mockOpenExternalUrl(url),
}));

it('loads a real iframe document on native and keeps the external Maps action after failure', async () => {
  const root = createRoot();
  try {
    await act(async () => {
      root.render(
        createElement(InstitutionMap, { name: 'Liceu', city: 'Oradea' })
      );
    });
    expect(mockWebView.source.uri).toBeUndefined();
    expect(mockWebView.source.html).toContain('<iframe');
    expect(mockWebView.source.html).toContain('filter:invert(');
    expect(
      mockWebView.onShouldStartLoadWithRequest({ url: 'about:blank' })
    ).toBe(true);
    expect(
      mockWebView.onShouldStartLoadWithRequest({ url: 'https://example.com/' })
    ).toBe(false);
    await act(async () => mockWebView.onError());
    expect(JSON.stringify(root.container.toJSON())).not.toContain(
      '"type":"webview"'
    );
    mockPress();
    expect(mockOpenExternalUrl).toHaveBeenCalledWith(
      institutionMap('Liceu', 'Oradea').search
    );
    await act(async () => {
      root.render(
        createElement(InstitutionMap, { name: 'Alt liceu', city: 'Beiuș' })
      );
    });
    expect(JSON.stringify(root.container.toJSON())).toContain(
      '"type":"webview"'
    );
  } finally {
    await act(async () => root.unmount());
  }
});
