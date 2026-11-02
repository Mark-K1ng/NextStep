import { startIosTabReveal } from './ios-tab-context';
import { act, createElement } from 'react';
import { createRoot, type Root } from 'test-renderer';
import { AsciiSkin, AsciiSkinOverlay, AsciiElement, AsciiContentGate, useAsciiSkinAnimation } from './ascii-skin';
import { DecodingText, decodingTextValue, splitDecodingStyle } from './decoding-text';
import { DecodingInput } from './decoding-input';
let mockFinish: ((done: boolean) => void) | undefined;
let mockReduced = false;
let mockPlatform = 'android';
const mockInputReactions: { prepare(): string | null; react(value: string | null, previous: string | null): void }[] = [];
const mockDurations: number[] = [];
const mockStyles: (() => any)[] = [];
const mockDelays: number[] = [];
const mockCompletions: ((done: boolean) => void)[] = [];
jest.mock('react-native', () => ({ Text: 'text', TextInput: 'input', View: 'view', Platform: { get OS() { return mockPlatform; } }, StyleSheet: { absoluteFill: { position: 'absolute' }, flatten: (style: unknown) => style, create: (styles: unknown) => styles } }));
jest.mock('@nextstep/ascii-reveal-native', () => ({ AsciiSkeleton: 'texture', AsciiText: 'decoded', useAsciiContext: () => ({ reduced: mockReduced, theme: { background: '#000' } }), decodeFrame: (characters: string[], progress: number) => progress < 1 ? '#0!' : characters.join('') }));
jest.mock('react-native-reanimated', () => ({
  __esModule: true, default: { View: 'animated-view', createAnimatedComponent: () => 'animated-input' },
  useSharedValue: (initial: number) => { const ref = require('react').useRef(null); if (!ref.current) { let current = initial; ref.current = { get: () => current, set: (next: number) => { current = next; } }; } return ref.current; },
  useDerivedValue: (get: () => number) => require('react').useRef({ get }).current,
  useAnimatedStyle: (style: () => unknown) => { mockStyles.push(style); return style(); }, useAnimatedProps: (props: () => unknown) => props(),
  useAnimatedRef: () => require('react').useRef(null),
  useAnimatedReaction: (prepare: () => string | null, react: (value: string | null, previous: string | null) => void) => { mockInputReactions.push({ prepare, react }); }, dispatchCommand: jest.fn(),
  cancelAnimation: jest.fn(), withTiming: (_value: number, config: { duration: number }, completion: (done: boolean) => void) => { mockDurations.push(config.duration); mockCompletions.push(completion); mockFinish = completion; return 0; },
  withDelay: (delay: number, animation: number) => { mockDelays.push(delay); return animation; },
  Easing: { linear: 'linear' }, ReduceMotion: { Never: 'never' },
}));
jest.mock('react-native-worklets', () => ({ scheduleOnRN: (callback: (...args: unknown[]) => void, ...args: unknown[]) => callback(...args) }));
let root: Root;
beforeEach(() => { jest.clearAllMocks(); mockPlatform = 'android'; mockStyles.length = 0; mockInputReactions.length = 0; mockReduced = false; mockFinish = undefined; mockDurations.length = 0; mockDelays.length = 0; mockCompletions.length = 0; root = createRoot(); });
afterEach(async () => act(async () => root.unmount()));
it('commands only the decorative iOS input and leaves its editable value intact', async () => {
  mockPlatform = 'ios';
  let current: NonNullable<ReturnType<typeof useAsciiSkinAnimation>>;
  function Field() { current = useAsciiSkinAnimation()!; return createElement(DecodingInput, { value: 'draft' }); }
  await act(async () => root.render(createElement(AsciiSkin, { enabled: true }, createElement(Field))));
  const real = root.container.queryAll(n => n.type === 'animated-input' && n.props.accessible !== false)[0];
  const display = root.container.queryAll(n => n.type === 'animated-input' && n.props.accessible === false)[0];
  expect(display.props.animatedProps.text).toBe('#0!');
  current!.progress.set(1);
  const reaction = mockInputReactions.at(-1)!;
  reaction.react(reaction.prepare(), null);
  expect(require('react-native-reanimated').dispatchCommand).toHaveBeenCalledWith(display.props.ref, 'setTextAndSelection', [0, 'draft', -1, -1]);
  expect(real.props.value).toBe('draft');
});
it('coordinates every text block with the opaque surface and removes it at completion', async () => {
  await act(async () => root.render(createElement(AsciiSkin, { enabled: true, internal: true },
    createElement(DecodingText, { style: { flex: 1, marginBottom: 8, fontSize: 20 } }, 'Title ', createElement(DecodingText, {}, 'nested')),
    createElement(DecodingText, {}, 'Subtitle'), createElement(AsciiSkinOverlay, { radius: 12 }))));
  let texts = root.container.queryAll(n => n.type === 'decoded');
  expect(texts).toHaveLength(2);
  expect(texts[0].props.text).toBe('Title nested');
  expect(texts[0].props.progress).toBe(texts[1].props.progress);
  expect(texts.every(n => n.props.animate)).toBe(true);
  expect(texts[0].props.style).toEqual({ fontSize: 20 });
  expect(texts[0].props.containerStyle[0]).toEqual({ flex: 1, marginBottom: 8 });
  const overlay = root.container.queryAll(n => n.type === 'view' && n.props.onLayout)[0];
  expect(overlay.props.style[2].backgroundColor).toBe('#000');
  await act(async () => mockFinish!(true));
  expect(root.container.queryAll(n => n.type === 'view' && n.props.onLayout)).toHaveLength(0);
  texts = root.container.queryAll(n => n.type === 'decoded');
  expect(texts.every(n => !n.props.animate)).toBe(true);
});
it('decodes a separate display without writing symbols into editable values or selection', async () => {
  const onChangeText = jest.fn();
  const selection = { start: 2, end: 2 };
  await act(async () => root.render(createElement(AsciiSkin, { enabled: true, internal: true },
    createElement(DecodingInput, { value: 'local-secret', secureTextEntry: true, editable: false, onChangeText }),
    createElement(DecodingInput, { value: '', placeholder: 'Caută', autoCorrect: true, spellCheck: true, selection, onChangeText }))));
  const real = () => root.container.queryAll(n => n.type === 'animated-input' && n.props.accessible !== false);
  const displays = () => root.container.queryAll(n => n.type === 'animated-input' && n.props.accessible === false);
  expect(real()).toHaveLength(2);
  expect(displays()).toHaveLength(2);
  expect(real()[0].props).toMatchObject({ value: 'local-secret', secureTextEntry: true, editable: false });
  expect(real()[1].props).toMatchObject({ value: '', placeholder: 'Caută', selection, autoCorrect: true, spellCheck: true });
  expect(real().every(n => n.props.animatedProps === undefined)).toBe(true);
  expect(displays().every(n => n.props.defaultValue === '#0!')).toBe(true);
  expect(real().every(n => n.props.style[2].opacity === 0)).toBe(true);
  expect(displays().every(n => n.props.animatedProps.text === '#0!')).toBe(true);
  expect(displays().every(n => n.props.editable === false && n.props.spellCheck === false && n.props.autoCorrect === false && n.props.autoComplete === 'off' && n.props.pointerEvents === 'none')).toBe(true);
  await act(async () => mockFinish!(true));
  expect(displays()).toHaveLength(0);
  expect(real()[0].props.value).toBe('local-secret');
  expect(real()[1].props.value).toBe('');
  expect(real()[1].props.selection).toEqual(selection);
  expect(onChangeText).not.toHaveBeenCalled();
});
it('gives editing priority over decoding and preserves native focus/change callbacks', async () => {
  const onFocus = jest.fn(), onChangeText = jest.fn();
  const tree = (value: string) => createElement(AsciiSkin, { enabled: true, internal: true }, createElement(DecodingInput, { value, placeholder: 'Caută', onFocus, onChangeText, style: { flex: 1, minHeight: 48, fontSize: 16, paddingVertical: 8 } }));
  await act(async () => root.render(tree('')));
  const input = () => root.container.queryAll(n => n.type === 'animated-input' && n.props.accessible !== false)[0];
  const event = { nativeEvent: {} };
  await act(async () => input().props.onFocus(event));
  expect(onFocus).toHaveBeenCalledWith(event);
  expect(root.container.queryAll(n => n.type === 'animated-input')).toHaveLength(1);
  expect(input().props.style[2].opacity).toBe(1);
  await act(async () => input().props.onChangeText('medicină'));
  expect(onChangeText).toHaveBeenCalledTimes(1);
  expect(onChangeText).toHaveBeenCalledWith('medicină');
  await act(async () => root.render(tree('medicină')));
  expect(input().props.value).toBe('medicină');
  expect(input().props.animatedProps).toBeUndefined();
  expect(input().props.style[0]).toEqual({ fontSize: 16, paddingVertical: 8 });
  expect(input().props.style[1].minHeight).toBe(48);
  expect(root.container.queryAll(n => n.type === 'animated-input')).toHaveLength(1);
});
it('shows normal text immediately for system reduced motion and outside the preview', async () => {
  mockReduced = true;
  await act(async () => root.render(createElement(AsciiSkin, { enabled: true }, createElement(DecodingText, {}, 'Normal'))));
  expect(mockFinish).toBeUndefined();
  expect(root.container.queryAll(n => n.type === 'decoded')[0].props.animate).toBe(false);
  await act(async () => root.render(createElement(DecodingText, {}, 'Normal')));
  expect(root.container.queryAll(n => n.type === 'decoded')).toHaveLength(0);
  expect(root.container.queryAll(n => n.type === 'text')).toHaveLength(1);
  expect(decodingTextValue(['A', false, 0, ['B']])).toBe('A0B');
  expect(splitDecodingStyle({ flex: 1, fontSize: 18 }).text).toEqual({ fontSize: 18 });
});

it('replays a short tab reveal and ignores completion from an interrupted entry', async () => {
  const tree = (enabled: boolean) => createElement(AsciiSkin, { enabled, internal: true, duration: 200 }, createElement(DecodingText, {}, 'Tab'));
  await act(async () => root.render(tree(true)));
  expect(mockDurations).toEqual([200]);
  const staleFinish = mockFinish!;
  await act(async () => root.render(tree(false)));
  await act(async () => root.render(tree(true)));
  expect(mockDurations).toEqual([200, 200]);
  await act(async () => staleFinish(true));
  const text = () => root.container.queryAll(n => n.type === 'decoded')[0];
  expect(text().props.animate).toBe(true);
  await act(async () => mockFinish!(true));
  expect(text().props.animate).toBe(false);
  await act(async () => root.render(tree(false)));
  await act(async () => root.render(tree(true)));
  expect(mockDurations).toEqual([200, 200, 200]);
  expect(text().props.animate).toBe(true);
});

it('settles stack content on blur and does not replay it during a native pop', async () => {
  const tree = (enabled: boolean) => createElement(AsciiSkin, { enabled, internal: true, replayOnFocus: false }, createElement(DecodingText, {}, 'Stack'));
  await act(async () => root.render(tree(true)));
  expect(mockDurations).toHaveLength(1);
  await act(async () => root.render(tree(false)));
  await act(async () => root.render(tree(true)));
  expect(mockDurations).toHaveLength(1);
  expect(root.container.queryAll(n => n.type === 'decoded')[0].props.animate).toBe(false);
});

it('clears skins and decoding immediately when reduced motion changes during entry', async () => {
  const tree = () => createElement(AsciiSkin, { enabled: true, internal: true, duration: 200 }, createElement(DecodingText, {}, 'Content'), createElement(AsciiSkinOverlay));
  await act(async () => root.render(tree()));
  const staleFinish = mockFinish!;
  expect(root.container.queryAll(n => n.type === 'decoded')[0].props.animate).toBe(true);
  mockReduced = true;
  await act(async () => root.render(tree()));
  expect(root.container.queryAll(n => n.type === 'decoded')[0].props.animate).toBe(false);
  expect(root.container.queryAll(n => n.type === 'view' && n.props.onLayout)).toHaveLength(0);
  await act(async () => staleFinish(true));
  expect(root.container.queryAll(n => n.type === 'decoded')[0].props.animate).toBe(false);
});

it('reveals late-loaded content once without adding a native layout wrapper', async () => {
  function Progress() {
    return createElement('route-progress', { progress: useAsciiSkinAnimation()!.progress });
  }
  const tree = (loaded: boolean, enabled = true) => createElement(AsciiSkin, { enabled, internal: true, duration: 200 }, createElement(Progress), loaded && createElement(AsciiElement, {}, createElement(DecodingText, {}, 'Loaded card'), createElement(AsciiSkinOverlay)));
  await act(async () => root.render(tree(false)));
  await act(async () => mockFinish!(true));
  await act(async () => root.render(tree(true)));
  expect(mockDurations).toEqual([200, 120]);
  const text = () => root.container.queryAll(n => n.type === 'decoded')[0];
  expect(text().props.animate).toBe(true);
  expect(root.container.queryAll(n => n.type === 'view' && !n.props.onLayout)).toHaveLength(1);
  await act(async () => mockFinish!(true));
  expect(text().props.animate).toBe(false);
  await act(async () => root.render(tree(true)));
  expect(mockDurations).toEqual([200, 120]);
  await act(async () => root.render(tree(true, false)));
  await act(async () => root.render(tree(true)));
  expect(text().props.progress).toBe(root.container.queryAll(n => n.type === 'route-progress')[0].props.progress);
  expect(text().props.animate).toBe(true);
});

it('keeps late-loaded stack elements settled on return as well as the route itself', async () => {
  const tree = (loaded: boolean, enabled = true) => createElement(AsciiSkin, { enabled, internal: true, replayOnFocus: false, duration: 200 }, loaded && createElement(AsciiElement, {}, createElement(DecodingText, {}, 'Loaded card')));
  await act(async () => root.render(tree(false)));
  await act(async () => mockFinish!(true));
  await act(async () => root.render(tree(true)));
  await act(async () => mockFinish!(true));
  expect(mockDurations).toEqual([200, 120]);
  await act(async () => root.render(tree(true, false)));
  await act(async () => root.render(tree(true)));
  expect(mockDurations).toEqual([200, 120]);
  expect(root.container.queryAll(n => n.type === 'decoded')[0].props.animate).toBe(false);
});

it('uses one timeline for nested route reveals instead of starting unused element timers', async () => {
  function Progress() { return createElement('tab-progress', { progress: useAsciiSkinAnimation()!.progress }); }
  await act(async () => root.render(createElement(AsciiSkin, { enabled: true, internal: true, duration: 200, delay: 200 },
    createElement(Progress), createElement(AsciiSkin, { enabled: true, internal: true, inherit: true, duration: 200 }, createElement(DecodingText, {}, 'Visible after transition')))));
  expect(mockDelays).toEqual([200]);
  expect(mockDurations).toEqual([200]);
  const text = () => root.container.queryAll(n => n.type === 'decoded')[0];
  const outer = root.container.queryAll(n => n.type === 'tab-progress')[0].props.progress;
  expect(text().props.progress).toBe(outer);
  expect(outer.get()).toBe(0);
  await act(async () => mockCompletions[0](true));
  expect(text().props.animate).toBe(false);
  expect(mockDurations).toEqual([200]);
});
it('skips the transition wait as well as decoding for reduced motion', async () => {
  mockReduced = true;
  await act(async () => root.render(createElement(AsciiSkin, { enabled: true, internal: true, delay: 200 }, createElement(DecodingText, {}, 'Immediate'))));
  expect(mockDelays).toEqual([]);
  expect(mockDurations).toEqual([]);
  expect(root.container.queryAll(n => n.type === 'decoded')[0].props.animate).toBe(false);
});

it('prepares cached text before the first re-entry render instead of briefly publishing finished text', async () => {
  const frames: { enabled: boolean; finished: boolean; progress: number }[] = [];
  let current: NonNullable<ReturnType<typeof useAsciiSkinAnimation>>;
  function Probe() {
    current = useAsciiSkinAnimation()!;
    frames.push({ enabled: current.enabled, finished: current.finished, progress: current.progress.get() });
    return createElement(DecodingText, {}, 'Cached screen');
  }
  const tree = (enabled: boolean) => createElement(AsciiSkin, { enabled, internal: true, delay: 200 }, createElement(Probe));
  await act(async () => root.render(tree(true)));
  await act(async () => { current.progress.set(1); mockFinish!(true); });
  await act(async () => root.render(tree(false)));
  frames.length = 0;
  await act(async () => root.render(tree(true)));
  expect(frames[0]).toEqual({ enabled: true, finished: false, progress: 0 });
});

it('covers the destination before starting its full reveal and cancels queued starts on blur', async () => {
  const frames: FrameRequestCallback[] = [];
  const request = jest.spyOn(global, 'requestAnimationFrame').mockImplementation((callback) => {
    frames.push(callback);
    return frames.length;
  });
  const cancel = jest.spyOn(global, 'cancelAnimationFrame').mockImplementation(() => {});
  const tree = (enabled: boolean) => createElement(AsciiSkin, { enabled, internal: true, duration: 220, startOnFrame: true }, createElement(DecodingText, {}, 'Destination'));
  try {
    await act(async () => root.render(tree(true)));
    expect(root.container.queryAll(n => n.type === 'decoded')[0].props.animate).toBe(true);
    expect(mockDurations).toEqual([]);
    await act(async () => frames.shift()!(0));
    expect(mockDurations).toEqual([]);
    await act(async () => frames.shift()!(16));
    expect(mockDurations).toEqual([220]);
    await act(async () => root.render(tree(false)));
    await act(async () => root.render(tree(true)));
    const stale = frames.shift()!;
    await act(async () => root.render(tree(false)));
    expect(cancel).toHaveBeenCalled();
    await act(async () => stale(32));
    if (frames.length) await act(async () => frames.shift()!(48));
    expect(mockDurations).toEqual([220]);
  } finally {
    request.mockRestore();
    cancel.mockRestore();
  }
});


it('prepares inactive native pages before focus, pauses their textures, and replays on entry', async () => {
  let current: NonNullable<ReturnType<typeof useAsciiSkinAnimation>>;
  function Page() { current = useAsciiSkinAnimation()!; return createElement(DecodingText, {}, 'Cached iOS page'); }
  const tree = (enabled: boolean) => createElement(AsciiSkin, { enabled, prepareOnBlur: true, internal: true, duration: 220 }, createElement(Page));
  await act(async () => root.render(tree(false)));
  expect(current!.enabled).toBe(true);
  expect(current!.finished).toBe(false);
  expect(current!.playing).toBe(false);
  expect(current!.progress.get()).toBe(0);
  expect(root.container.queryAll(n => n.type === 'decoded')[0].props.animate).toBe(true);
  expect(mockDurations).toEqual([]);
  await act(async () => root.render(tree(true)));
  expect(mockDurations).toEqual([220]);
  await act(async () => { current.progress.set(1); mockFinish!(true); });
  expect(current!.finished).toBe(true);
  await act(async () => root.render(tree(false)));
  expect(current!.finished).toBe(false);
  expect(current!.progress.get()).toBe(0);
  expect(current!.playing).toBe(false);
  await act(async () => root.render(tree(true)));
  expect(mockDurations).toEqual([220, 220]);
});

it('never covers prearmed pages when reduced motion is enabled', async () => {
  mockReduced = true;
  await act(async () => root.render(createElement(AsciiSkin, { enabled: false, prepareOnBlur: true }, createElement(DecodingText, {}, 'Readable'))));
  expect(root.container.queryAll(n => n.type === 'decoded')[0].props.animate).toBe(false);
  expect(root.container.queryAll(n => n.type === 'view' && n.props.onLayout)).toHaveLength(0);
  expect(mockDurations).toEqual([]);
});


it('starts prepared decoding before the focus render and preserves its progress', async () => {
  let current: NonNullable<ReturnType<typeof useAsciiSkinAnimation>>;
  function Page() { current = useAsciiSkinAnimation()!; return null; }
  const now = jest.spyOn(Date, 'now').mockReturnValue(1000);
  const tree = (enabled: boolean) => createElement(AsciiSkin, { enabled, prepareOnBlur: true, initialProgress: 0.25, nativeTab: '(probe)', internal: true, duration: 220 }, createElement(Page));
  await act(async () => root.render(tree(false)));
  expect(current!.progress.get()).toBe(0.25);
  await act(async () => startIosTabReveal('(probe)'));
  now.mockReturnValue(1080);
  expect(mockDurations).toEqual([220]);
  await act(async () => current.progress.set(0.4));
  const setProgress = jest.spyOn(current!.progress, 'set');
  await act(async () => root.render(tree(true)));
  // UIKit keeps the original timeline; React focus does not touch it.
  expect(setProgress).not.toHaveBeenCalled();
  expect(mockDurations).toEqual([220]);
  expect(current!.progress.get()).toBe(0.4);
  await act(async () => root.render(tree(false)));
  expect(setProgress).not.toHaveBeenCalled();
  expect(current!.progress.get()).toBe(0.4);
  now.mockRestore();
});


it('rearms native tabs and rejects stale completion before React can render blur', async () => {
  let time = 1000;
  const now = jest.spyOn(Date, 'now').mockImplementation(() => time);
  const scopes: Record<string, NonNullable<ReturnType<typeof useAsciiSkinAnimation>>> = {};
  function Page({ name }: { name: string }) { scopes[name] = useAsciiSkinAnimation()!; return createElement(DecodingText, {}, name); }
  await act(async () => root.render(createElement('pages', {}, ...['a', 'b'].map(name => createElement(AsciiSkin, { key: name, enabled: name === 'a', nativeTab: name, prepareOnBlur: true, initialProgress: 0.25, internal: true, duration: 220 }, createElement(Page, { name }))))));
  await act(async () => { scopes.a.progress.set(1); mockFinish!(true); });
  expect(scopes.a.completion?.current).toBe(true);
  expect(root.container.queryAll(n => n.type === 'decoded')[0].props.animate).toBe(true);
  await act(async () => startIosTabReveal('a'));
  const oldFinish = mockFinish!;
  time += 1000;
  await act(async () => startIosTabReveal('b'));
  expect(scopes.a.progress.get()).toBe(0.25);
  time += 1000;
  await act(async () => startIosTabReveal('a'));
  const newFinish = mockFinish!;
  await act(async () => oldFinish(true));
  expect(scopes.a.completion?.current).toBe(false);
  await act(async () => { scopes.a.progress.set(1); newFinish(true); });
  expect(scopes.a.completion?.current).toBe(true);
  now.mockRestore();
});


it('keeps settled tab stack content attached to its prepared native parent', async () => {
  let parent: NonNullable<ReturnType<typeof useAsciiSkinAnimation>>;
  let child: typeof parent;
  function Root() { parent = useAsciiSkinAnimation()!; return createElement(AsciiSkin, { enabled: true, inherit: true, retainPreparedParent: true }, createElement(Page)); }
  function Page() { child = useAsciiSkinAnimation()!; return createElement(DecodingText, {}, 'Retained'); }
  await act(async () => root.render(createElement(AsciiSkin, { enabled: true, nativeTab: 'retained', prepareOnBlur: true, internal: true }, createElement(Root))));
  await act(async () => startIosTabReveal('retained'));
  const finish = mockFinish!;
  await act(async () => { parent.progress.set(1); finish(true); });
  expect(child!).toBe(parent!);
  expect(child!.completion?.current).toBe(true);
  expect(root.container.queryAll(n => n.type === 'decoded')[0].props.animate).toBe(true);
});


it('shows the real field when a retained native timeline ends and keeps symbols decorative', async () => {
  mockPlatform = 'ios';
  let scope: NonNullable<ReturnType<typeof useAsciiSkinAnimation>>;
  let refresh: () => void;
  const change = jest.fn();
  function Field() {
    scope = useAsciiSkinAnimation()!;
    const [, update] = require('react').useState(0);
    refresh = () => update((value: number) => value + 1);
    return createElement(DecodingInput, { value: 'draft', onChangeText: change });
  }
  await act(async () => root.render(createElement(AsciiSkin, { enabled: true, nativeTab: 'field', prepareOnBlur: true }, createElement(Field))));
  await act(async () => { scope.progress.set(1); refresh(); });
  const real = root.container.queryAll(n => n.type === 'animated-input' && n.props.accessible !== false)[0];
  const display = root.container.queryAll(n => n.type === 'animated-input' && n.props.accessible === false)[0];
  expect(real.props.style[2].opacity).toBe(1);
  expect(display.props.style.at(-1).opacity).toBe(0);
  expect(real.props.value).toBe('draft');
  expect(real.props.animatedProps).toBeUndefined();
  expect(change).not.toHaveBeenCalled();
});


it('keeps a fitted skin above a mounted native icon for the entire shared reveal', async () => {
  let scope: NonNullable<ReturnType<typeof useAsciiSkinAnimation>>;
  let mounts = 0;
  function Icon() { require('react').useEffect(() => { mounts += 1; }, []); return createElement('icon'); }
  function Content() { scope = useAsciiSkinAnimation()!; return createElement(AsciiContentGate, { cover: true, nativeOnly: true, radius: 12 }, createElement(Icon)); }
  await act(async () => root.render(createElement(AsciiSkin, { enabled: true, nativeTab: 'icons', prepareOnBlur: true, internal: true, duration: 220 }, createElement(Content))));
  const overlay = root.container.queryAll(n => n.type === 'view' && n.props.onLayout)[0];
  expect(overlay).toBeDefined();
  await act(async () => overlay.props.onLayout({ nativeEvent: { layout: { width: 24.25, height: 23.75 } } }));
  expect(root.container.queryAll(n => n.type === 'texture')[0].props).toMatchObject({ width: 24.25, height: 23.75, phase: scope!.texturePhase });
  const [iconStyle, skinStyle] = mockStyles;
  scope!.progress.set(0.99);
  expect(iconStyle().opacity).toBe(0);
  expect(skinStyle().opacity).toBe(1);
  scope!.progress.set(1);
  expect(iconStyle().opacity).toBe(1);
  expect(skinStyle().opacity).toBe(0);
  expect(mounts).toBe(1);
  expect(root.container.queryAll(n => n.type === 'icon')).toHaveLength(1);
});

it.each([false, true])('keeps native-only icon covers out of ordinary scopes with reduced motion %s', async reduced => {
  mockReduced = reduced;
  await act(async () => root.render(createElement(AsciiSkin, { enabled: true, internal: true }, createElement(AsciiContentGate, { cover: true, nativeOnly: true }, createElement('icon')))));
  expect(root.container.queryAll(n => n.type === 'icon')).toHaveLength(1);
  expect(root.container.queryAll(n => n.type === 'texture')).toHaveLength(0);
  expect(mockStyles).toHaveLength(0);
});


it('inherits skin coverage from the native tab before the child route receives React focus', async () => {
  await act(async () => root.render(createElement(AsciiSkin, { enabled: true, nativeTab: 'early-icons', prepareOnBlur: true, internal: true }, createElement(AsciiSkin, { enabled: false, inherit: true, retainPreparedParent: true, internal: true }, createElement('icon'), createElement(AsciiSkinOverlay, { radius: 12 })))));
  const overlay = root.container.queryAll(n => n.type === 'view' && n.props.onLayout)[0];
  expect(overlay).toBeDefined();
  await act(async () => overlay.props.onLayout({ nativeEvent: { layout: { width: 36, height: 36 } } }));
  expect(root.container.queryAll(n => n.type === 'texture')).toHaveLength(1);
  expect(root.container.queryAll(n => n.type === 'icon')).toHaveLength(1);
});


it('shows a prepared native icon without a cover when reduced motion is enabled', async () => {
  mockReduced = true;
  await act(async () => root.render(createElement(AsciiSkin, { enabled: true, nativeTab: 'reduced-icons', prepareOnBlur: true, internal: true }, createElement(AsciiContentGate, { cover: true, nativeOnly: true }, createElement('icon')))));
  expect(root.container.queryAll(n => n.type === 'icon')).toHaveLength(1);
  expect(root.container.queryAll(n => n.type === 'view' && n.props.onLayout)).toHaveLength(0);
  expect(mockStyles[0]().opacity).toBe(1);
});


it('rearms retained route covers and decoding on every focus without remounting content', async () => {
  let scope: NonNullable<ReturnType<typeof useAsciiSkinAnimation>>;
  let mounts = 0;
  function Content() {
    scope = useAsciiSkinAnimation()!;
    require('react').useEffect(() => { mounts += 1; }, []);
    return createElement('page', {}, createElement(DecodingText, {}, 'Route'), createElement(AsciiSkinOverlay));
  }
  const tree = (enabled: boolean) => createElement(AsciiSkin, { enabled, internal: true, prepareOnBlur: true, retainLayers: true, duration: 220, initialProgress: 0.25 }, createElement(Content));
  await act(async () => root.render(tree(true)));
  for (let visit = 0; visit < 3; visit++) {
    expect(scope!.preparedNativeTab).toBe(true);
    expect(root.container.queryAll(n => n.type === 'decoded')[0].props.animate).toBe(true);
    const covers = root.container.queryAll(n => n.type === 'view' && n.props.onLayout);
    expect(covers).toHaveLength(1);
    await act(async () => { scope!.progress.set(1); mockFinish!(true); });
    expect(scope!.completion!.current).toBe(true);
    expect(root.container.queryAll(n => n.type === 'view' && n.props.onLayout)).toHaveLength(1);
    await act(async () => root.render(tree(false)));
    expect(scope!.progress.get()).toBe(0.25);
    expect(scope!.completion!.current).toBe(false);
    await act(async () => root.render(tree(true)));
  }
  expect(mounts).toBe(1);
  expect(mockDurations).toEqual([220, 220, 220, 220]);
});
