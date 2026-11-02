import { act, createElement } from 'react';
import { createRoot, type Root } from 'test-renderer';
import { AsciiProvider, AsciiActivity } from '../../packages/ascii-reveal-native/src/provider';
import { AsciiSkeleton } from '../../packages/ascii-reveal-native/src/skeleton-fallback';
jest.mock('../../packages/ascii-reveal-native/src/skeleton', () => jest.requireActual('../../packages/ascii-reveal-native/src/skeleton-fallback'));
jest.mock('../../packages/ascii-reveal-native/src/reveal', () => jest.requireActual('../../packages/ascii-reveal-native/src/reveal-fallback'));
import { AsciiReveal } from '../../packages/ascii-reveal-native/src/reveal-fallback';
import { AsciiText } from '../../packages/ascii-reveal-native/src/text';
import { AsciiImage } from '../../packages/ascii-reveal-native/src/image';
import { decodeFrame, glyphs } from '../../packages/ascii-reveal-native/src/patterns';
import { withRepeat, cancelAnimation } from 'react-native-reanimated';

let mockPlatform = 'android';
const mockTextProps: (() => any)[] = [];
const mockFinishReactions: { prepare(): boolean | null; react(value: boolean | null, previous: boolean | null): void }[] = [];
let mockForeground: (state: string) => void;
let mockReduced: (state: boolean) => void;
let mockComplete: (() => void) | undefined;
let mockDisplayMounts = 0;
const mockRemove = jest.fn();
jest.mock('react-native', () => ({
  View: 'view', Text: 'text', Image: 'image',
  TextInput: (props: unknown) => {
    const React = require('react');
    React.useEffect(() => { mockDisplayMounts += 1; }, []);
    return React.createElement('input', props);
  },
  Platform: { get OS() { return mockPlatform; } },
  StyleSheet: { flatten: (value: any): any => Array.isArray(value) ? Object.assign({}, ...value.map((item: any) => Array.isArray(item) ? Object.assign({}, ...item) : item)) : value, create: (value: unknown) => value, absoluteFill: { position: 'absolute' } },
  AppState: { currentState: 'active', addEventListener: (_event: string, listener: (state: string) => void) => { mockForeground = listener; return { remove: mockRemove }; } },
  AccessibilityInfo: { addEventListener: (_event: string, listener: (state: boolean) => void) => { mockReduced = listener; return { remove: mockRemove }; } },
}));
jest.mock('react-native-worklets', () => ({ scheduleOnRN: (callback: () => void) => callback() }));
jest.mock('react-native-reanimated', () => ({
  __esModule: true,
  default: { View: 'animated-view', Text: 'animated-text', createAnimatedComponent: (value: unknown) => value },
  Easing: { linear: 'linear' }, ReduceMotion: { Never: 'never' },
  useReducedMotion: () => false,
  useSharedValue: (initial: number) => require('react').useRef({ value: initial, get() { return this.value; }, set(value: number) { this.value = value; } }).current,
  useDerivedValue: (get: () => number) => ({ get }),
  useAnimatedStyle: (callback: () => unknown) => callback(),
  useAnimatedProps: (callback: () => unknown) => { mockTextProps.push(callback); return callback(); },
  useAnimatedRef: () => require('react').useRef(null),
  useAnimatedReaction: (prepare: () => boolean | null, react: (value: boolean | null, previous: boolean | null) => void) => { mockFinishReactions.push({ prepare, react }); },
  dispatchCommand: jest.fn(),
  cancelAnimation: jest.fn(),
  withRepeat: jest.fn((value) => value),
  withTiming: (value: number, _config: unknown, callback?: (finished: boolean) => void) => { if (callback) { mockComplete = () => callback(true); return 0; } return value; },
}));
let root: Root;
beforeEach(() => { jest.clearAllMocks(); mockPlatform = 'android'; mockTextProps.length = 0; mockFinishReactions.length = 0; mockComplete = undefined; mockDisplayMounts = 0; root = createRoot(); });
afterEach(async () => act(async () => root.unmount()));
const render = async (node: React.ReactNode) => act(async () => root.render(node));

it.each([undefined, [{ color: '#ffffff' }, { color: '#121212' }]])('finishes iOS decoding on a correctly colored display without waiting for React or Fabric props', async style => {
  mockPlatform = 'ios';
  let value = 0.25;
  await render(createElement(AsciiProvider, { reducedMotion: false }, createElement(AsciiText, { text: 'Următorul pas', style, progress: { get: () => value } as any })));
  const displays = root.container.queryAll(node => node.type === 'input');
  expect(displays).toHaveLength(2);
  const [scramble, finish] = displays;
  expect(finish.props.defaultValue).toBe('');
  expect(finish.props).toMatchObject({ editable: false, accessible: false, pointerEvents: 'none', autoComplete: 'off', importantForAutofill: 'no' });
  expect(Object.assign({}, ...finish.props.style).color).toBe(style ? '#121212' : '#8C8796');
  const reaction = mockFinishReactions.at(-1)!;
  const command = require('react-native-reanimated').dispatchCommand;
  reaction.react(reaction.prepare(), null);
  command.mockClear();
  value = 1;
  reaction.react(reaction.prepare(), false);
  expect(command.mock.calls).toEqual([
    [scramble.props.ref, 'setTextAndSelection', [0, '', -1, -1]],
    [finish.props.ref, 'setTextAndSelection', [0, 'Următorul pas', -1, -1]],
  ]);
  expect(mockTextProps.at(-1)!().text).toBe('');
  reaction.react(reaction.prepare(), true);
  expect(command).toHaveBeenCalledTimes(2);
  value = 0.25;
  reaction.react(reaction.prepare(), true);
  expect(command).toHaveBeenLastCalledWith(finish.props.ref, 'setTextAndSelection', [0, '', -1, -1]);
});

it.each(['android', 'ios'])('never commands a disabled %s label', async platform => {
  mockPlatform = platform;
  await render(createElement(AsciiProvider, { reducedMotion: false }, createElement(AsciiText, { text: 'Ready', animate: false, progress: { get: () => 1 } as any })));
  const reaction = mockFinishReactions.at(-1)!;
  reaction.react(reaction.prepare(), null);
  expect(require('react-native-reanimated').dispatchCommand).not.toHaveBeenCalled();
});

it('keeps Android decorative props unchanged', async () => {
  await render(createElement(AsciiProvider, { reducedMotion: false }, createElement(AsciiText, { text: 'Ready', progress: { get: () => 1 } as any })));
  expect(mockTextProps.at(-1)!()).toEqual({ text: 'Ready' });
  expect(require('react-native-reanimated').dispatchCommand).not.toHaveBeenCalled();
});

it('generates deterministic bounded patterns and preserves text/whitespace at decode completion', () => {
  expect(glyphs(7, 40, 'ABC')).toBe(glyphs(7, 40, 'ABC'));
  expect(glyphs(8, 40, 'ABC')).not.toBe(glyphs(7, 40, 'ABC'));
  expect(glyphs(7, 10000, 'ABC')).toHaveLength(240);
  const text = 'Știință 😊\nUn pas';
  expect(decodeFrame(Array.from(text), 1, 0, '#$')).toBe(text);
  expect(decodeFrame(Array.from('A B\nC'), 0, 1, '#')).toBe('   \n ');
});
it('shares one loading loop, pauses in background and stops immediately for system reduced motion', async () => {
  await render(createElement(AsciiProvider, null, createElement(AsciiSkeleton), createElement(AsciiSkeleton), createElement(AsciiSkeleton)));
  expect(withRepeat).toHaveBeenCalledTimes(1);
  const before = jest.mocked(cancelAnimation).mock.calls.length;
  await act(async () => mockForeground('background'));
  expect(jest.mocked(cancelAnimation).mock.calls.length).toBeGreaterThan(before);
  expect(root.container.queryAll((node) => node.type === 'animated-text')).toHaveLength(0);
  await act(async () => mockForeground('active'));
  expect(withRepeat).toHaveBeenCalledTimes(2);
  await act(async () => mockReduced(true));
  expect(root.container.queryAll((node) => node.type === 'animated-text')).toHaveLength(0);
});
it('keeps one accessible loading label and hides decorative glyphs with motion disabled', async () => {
  await render(createElement(AsciiProvider, { reducedMotion: true }, createElement(AsciiSkeleton, { accessibilityLabel: 'Se încarcă', lines: 3 })));
  expect(root.container.queryAll((node) => node.props.accessible && node.props.accessibilityRole === 'progressbar')).toHaveLength(1);
  expect(root.container.queryAll((node) => node.type === 'text')).toHaveLength(3);
  expect(withRepeat).not.toHaveBeenCalled();
});
it('preserves content layout through loading, exposes content immediately when ready and completes the overlay once', async () => {
  const complete = jest.fn();
  const tree = (loading: boolean) => createElement(AsciiProvider, null, createElement(AsciiReveal, { loading, revealAfterLoading: true, onRevealComplete: complete }, createElement('real-content')));
  await render(tree(true));
  expect(root.container.queryAll((node) => node.type === 'real-content')).toHaveLength(1);
  const container = root.container.queryAll((node) => node.type === 'view' && !!node.props.onLayout)[0];
  await act(async () => container.props.onLayout({ nativeEvent: { layout: { width: 240, height: 80 } } }));
  await render(tree(false));
  expect(root.container.queryAll((node) => node.props.pointerEvents === 'auto')).toHaveLength(1);
  expect(mockComplete).toBeDefined();
  await act(async () => mockComplete?.());
  expect(complete).toHaveBeenCalledTimes(1);
  expect(root.container.queryAll((node) => node.type === 'animated-view')).toHaveLength(0);
});
it.each(['android', 'ios'])('keeps final text available to accessibility and disables scramble in reduced motion on %s', async platform => {
  mockPlatform = platform;
  await render(createElement(AsciiProvider, { reducedMotion: true }, createElement(AsciiText, { text: 'Următorul pas' })));
  expect(root.container.queryAll((node) => node.props.accessible && node.props.accessibilityLabel === 'Următorul pas')).toHaveLength(1);
  expect(root.container.queryAll((node) => node.type === 'input')).toHaveLength(0);
});
it('ends an image loading failure and preserves the supplied error callback', async () => {
  const error = jest.fn();
  await render(createElement(AsciiImage, { source: { uri: 'https://example.test/missing.png' }, onError: error, errorLabel: 'Indisponibilă' }));
  const image = root.container.queryAll((node) => node.type === 'image')[0];
  await act(async () => image.props.onError({ nativeEvent: { error: 'offline' } }));
  expect(error).toHaveBeenCalledTimes(1);
  expect(root.container.queryAll((node) => node.type === 'text' && node.props.accessibilityRole === 'alert')[0].props.children).toBe('Indisponibilă');
});

it('stops off-screen consumers without starting a separate animation clock', async () => {
  const tree = (active: boolean) => createElement(AsciiProvider, null, createElement(AsciiActivity, { active }, createElement(AsciiSkeleton)));
  await render(tree(false));
  expect(withRepeat).not.toHaveBeenCalled();
  await render(tree(true));
  expect(withRepeat).toHaveBeenCalledTimes(1);
  const before = jest.mocked(cancelAnimation).mock.calls.length;
  await render(tree(false));
  expect(jest.mocked(cancelAnimation).mock.calls.length).toBeGreaterThan(before);
  expect(root.container.queryAll(node => node.type === 'animated-text')).toHaveLength(0);
});

it('keeps decorative text out of keyboard spelling and autofill services', async () => {
  await render(createElement(AsciiProvider, { reducedMotion: false }, createElement(AsciiText, { text: 'Caută în catalog' })));
  const display = root.container.queryAll(node => node.type === 'input')[0];
  expect(display.props).toMatchObject({ editable: false, autoCorrect: false, spellCheck: false, autoComplete: 'off', textContentType: 'none', importantForAutofill: 'no', pointerEvents: 'none', accessible: false });
});

it('never seeds a reveal display with readable text on its first frame', async () => {
  await render(createElement(AsciiProvider, { reducedMotion: false }, createElement(AsciiText, { text: 'Textul final', progress: { get: () => 0 } as any })));
  const display = root.container.queryAll(node => node.type === 'input')[0];
  expect(display.props.defaultValue).toBe(decodeFrame(Array.from('Textul final'), 0, 0, 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#%&*+=?/'));
  expect(display.props.defaultValue).not.toBe('Textul final');
  const finalText = root.container.queryAll(node => node.type === 'animated-text')[0];
  expect(finalText.props.style.at(-1).opacity).toBe(0);
});
it('seeds prepared native text with visible symbols on the first commit', async () => {
  await render(createElement(AsciiProvider, { reducedMotion: false }, createElement(AsciiText, { text: 'Caută în catalog', initialProgress: 0.25, progress: { get: () => 0.25 } as any })));
  const display = root.container.queryAll(node => node.type === 'input')[0];
  expect(display.props.defaultValue).toBe(decodeFrame(Array.from('Caută în catalog'), 0.25, 0, 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#%&*+=?/'));
  expect(display.props.defaultValue.trim().length).toBeGreaterThan(0);
  expect(display.props.defaultValue).not.toBe('Caută în catalog');
});

it('mounts a standalone text reveal with its final text already hidden', async () => {
  await render(createElement(AsciiProvider, { reducedMotion: false }, createElement(AsciiText, { text: 'Prima randare' })));
  const finalText = root.container.queryAll(node => node.type === 'animated-text')[0];
  expect(finalText.props.style.at(-1).opacity).toBe(0);
});

it('keeps inactive or reduced-motion text readable when its next reveal is pre-armed', async () => {
  await render(createElement(AsciiProvider, { reducedMotion: false }, createElement(AsciiText, { text: 'Ready', animate: false, progress: { get: () => 0 } as any })));
  expect(root.container.queryAll(node => node.type === 'animated-text')[0].props.style.at(-1).opacity).toBe(1);
  expect(root.container.queryAll(node => node.type === 'input')[0].props.style.at(-1).opacity).toBe(0);
});

it.each(['android', 'ios'])('replays shared tab text without recreating native displays or nested content on %s', async platform => {
  mockPlatform = platform;
  const displayCount = platform === 'ios' ? 2 : 1;
  let contentMounts = 0;
  function Content() {
    require('react').useEffect(() => { contentMounts += 1; }, []);
    return createElement('text', null, 'Retained');
  }
  const progress = { get: () => 0 } as any;
  const tree = (animate: boolean, reducedMotion = false) => createElement(
    AsciiProvider, { reducedMotion }, createElement(
      AsciiText, { text: 'Retained', animate, progress }, createElement(Content)
    )
  );
  await render(tree(false));
  expect(mockDisplayMounts).toBe(displayCount);
  for (let entry = 0; entry < 5; entry += 1) {
    await render(tree(true));
    expect(root.container.queryAll(node => node.type === 'animated-text')[0].props.style.at(-1).opacity).toBe(0);
    expect(root.container.queryAll(node => node.type === 'input')[0].props.style.at(-1).opacity).toBe(1);
    await render(tree(false));
    expect(root.container.queryAll(node => node.type === 'input')[0].props.style.at(-1).opacity).toBe(0);
  }
  expect(mockDisplayMounts).toBe(displayCount);
  expect(contentMounts).toBe(1);
  await render(tree(true, true));
  expect(root.container.queryAll(node => node.type === 'input')).toHaveLength(0);
  expect(root.container.queryAll(node => node.type === 'animated-text')[0].props.style.at(-1).opacity).toBe(1);
});

it('starts a cached text decoder hidden when animation is re-enabled', async () => {
  const tree = (animate: boolean) => createElement(AsciiProvider, { reducedMotion: false }, createElement(AsciiText, { text: 'Cached text', animate }));
  await render(tree(false));
  expect(root.container.queryAll(node => node.type === 'animated-text')[0].props.style.at(-1).opacity).toBe(1);
  await render(tree(true));
  expect(root.container.queryAll(node => node.type === 'animated-text')[0].props.style.at(-1).opacity).toBe(0);
});


it('uses a supplied reveal texture phase without starting a background loading loop', async () => {
  await render(createElement(AsciiProvider, { reducedMotion: false }, createElement(AsciiSkeleton, { phase: { get: () => 55 } as any })));
  expect(withRepeat).not.toHaveBeenCalled();
});
