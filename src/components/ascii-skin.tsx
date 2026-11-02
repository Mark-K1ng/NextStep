import { registerIosTabReveal } from './ios-tab-context';
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  type PropsWithChildren,
} from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { AsciiSkeleton, useAsciiContext } from '@nextstep/ascii-reveal-native';
import Animated, {
  cancelAnimation,
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
  withDelay,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { ASCII_REVEAL_MS } from '@/constants/tab-transition';

const SkinContext = createContext(false);
type SkinAnimation = {
  enabled: boolean;
  active: boolean;
  playing: boolean;
  reduced: boolean;
  finished: boolean;
  preparedNativeTab?: boolean;
  /** Native completion must not force every cached consumer to render. */
  completion?: { current: boolean };
  texturePhase?: SharedValue<number>;
  progress: SharedValue<number>;
  initialProgress: number;
  replayOnFocus: boolean;
  background: string;
};
const AnimationContext = createContext<SkinAnimation | null>(null);
export const useAsciiSkinAnimation = () => useContext(AnimationContext);

/** Late-arriving content gets one short entry, then follows future route entries. */
export function AsciiElement({ children }: PropsWithChildren) {
  const parent = useAsciiSkinAnimation();
  const late = useRef(
    parent?.completion?.current ?? parent?.finished ?? false
  ).current;
  return late && parent ? (
    <AsciiSkin
      enabled={parent.enabled}
      internal
      duration={ASCII_REVEAL_MS}
      contentsOnly
      inherit
      replayOnFocus={parent.replayOnFocus}
    >
      {children}
    </AsciiSkin>
  ) : (
    children
  );
}
function SurfaceProgress({
  animation,
  children,
}: PropsWithChildren<{ animation: SkinAnimation }>) {
  const { progress } = animation;
  const style = useAnimatedStyle(() => ({
    opacity: progress.get() < 1 ? 1 : 0,
  }));
  return (
    <Animated.View
      pointerEvents='none'
      style={[StyleSheet.absoluteFill, style]}
    >
      {children}
    </Animated.View>
  );
}
function ContentGate({
  animation,
  children,
}: PropsWithChildren<{ animation: SkinAnimation }>) {
  const { enabled, progress } = animation;
  const style = useAnimatedStyle(() => ({
    opacity: enabled && progress.get() < 1 ? 0 : 1,
  }));
  return <Animated.View style={style}>{children}</Animated.View>;
}
export function AsciiContentGate({
  children,
  cover = false,
  radius = 0,
  nativeOnly = false,
}: PropsWithChildren<{
  cover?: boolean;
  radius?: number;
  nativeOnly?: boolean;
}>) {
  const animation = useAsciiSkinAnimation();
  if (!animation || (nativeOnly && !animation.preparedNativeTab)) {
    return children;
  }
  const content = <ContentGate animation={animation}>{children}</ContentGate>;
  // Icon-sized covers keep their real geometry and share the tab timeline.
  return cover && animation.preparedNativeTab ? (
    <View>
      {content}
      <AsciiSkinOverlay enabled radius={radius} />
    </View>
  ) : (
    content
  );
}

/** An opt-in overlay on a real surface. It never owns the surface's layout. */
export function AsciiSkinOverlay({
  enabled,
  radius = 0,
}: {
  enabled?: boolean;
  radius?: number;
}) {
  const inherited = useContext(SkinContext);
  const animation = useAsciiSkinAnimation();
  const visible =
    (enabled ?? inherited) &&
    !animation?.reduced &&
    (!animation?.finished || animation.preparedNativeTab);
  const [size, setSize] = useState({ width: 0, height: 0 });
  if (!visible) {
    return null;
  }
  const fontSize = Math.max(10, size.height / 48, size.width / 56);
  const surface = (
    <View
      pointerEvents='none'
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility='no-hide-descendants'
      onLayout={({ nativeEvent: { layout } }) => {
        // Keep fractional native dimensions: rounding can leave a visible edge.
        const next = { width: layout.width, height: layout.height };
        setSize((previous) =>
          previous.width === next.width && previous.height === next.height
            ? previous
            : next
        );
      }}
      style={[
        StyleSheet.absoluteFill,
        styles.overlay,
        { borderRadius: radius, backgroundColor: animation?.background },
      ]}
    >
      {size.width > 0 && size.height > 0 && (
        <AsciiSkeleton
          decorative
          animate={
            animation?.preparedNativeTab
              ? !animation.reduced
              : animation
                ? animation.playing && !animation.finished
                : true
          }
          phase={
            animation?.preparedNativeTab ? animation.texturePhase : undefined
          }
          width={size.width}
          height={size.height}
          fontSize={fontSize}
          rows={Math.max(1, Math.ceil(size.height / fontSize))}
          style={styles.texture}
        />
      )}
    </View>
  );
  return animation ? (
    <SurfaceProgress animation={animation}>{surface}</SurfaceProgress>
  ) : (
    surface
  );
}

/** Keep the exact same child mounted in both modes. Internal surfaces opt in when needed. */
export function AsciiSkin({
  enabled,
  radius = 0,
  fit = false,
  internal = false,
  active = true,
  duration = 600,
  delay = 0,
  style,
  contentsOnly = false,
  inherit = false,
  retainPreparedParent = false,
  startOnFrame = false,
  prepareOnBlur = false,
  retainLayers = false,
  replayOnFocus = true,
  nativeTab,
  initialProgress = 0,
  children,
}: PropsWithChildren<{
  enabled: boolean;
  radius?: number;
  fit?: boolean;
  internal?: boolean;
  active?: boolean;
  duration?: number;
  delay?: number;
  style?: StyleProp<ViewStyle>;
  /** Provider only, for an existing element that already owns its layout. */
  contentsOnly?: boolean;
  inherit?: boolean;
  /** Tab stack roots keep following the native timeline after it settles. */
  retainPreparedParent?: boolean;
  /** Commit the destination's covered surfaces before starting UI-thread work. */
  startOnFrame?: boolean;
  /** Keep cached native screens covered before their next focus event. */
  prepareOnBlur?: boolean;
  /** Keep route decoders and covers mounted between repeat entries. */
  retainLayers?: boolean;
  /** Stack destinations stay readable when revealed by native back navigation. */
  replayOnFocus?: boolean;
  nativeTab?: string;
  /** Pre-render visible glyphs instead of an empty first decode frame. */
  initialProgress?: number;
}>) {
  const parent = useAsciiSkinAnimation();
  const ascii = useAsciiContext();
  const reduced = ascii?.reduced ?? false;
  const revealEnabled = enabled || prepareOnBlur;
  const pending = revealEnabled && !reduced;
  const retained = prepareOnBlur && (!!nativeTab || retainLayers);
  const startProgress = Math.max(0, Math.min(0.5, initialProgress));
  const progress = useSharedValue(reduced ? 1 : startProgress);
  const [finished, setFinished] = useState(!pending);
  const texturePhase = useDerivedValue(() =>
    retained ? progress.get() * duration : 0
  );
  const generation = useRef(0);
  const completed = useRef(false);
  const hasStarted = useRef(false);
  const nativeManaged = useRef(false);
  const complete = useCallback(
    (token: number) => {
      if (generation.current === token) {
        completed.current = true;
        if (!retained) {
          setFinished(true);
        }
      }
    },
    [retained]
  );
  useLayoutEffect(() => {
    if (!nativeTab || reduced) {
      return;
    }
    const unregister = registerIosTabReveal(
      nativeTab,
      () => {
        const token = ++generation.current;
        completed.current = false;
        nativeManaged.current = true;
        setFinished(false);
        cancelAnimation(progress);
        progress.set(startProgress);
        progress.set(
          withTiming(
            1,
            {
              duration,
              easing: Easing.linear,
              reduceMotion: ReduceMotion.Never,
            },
            (done) => {
              if (done) {
                scheduleOnRN(complete, token);
              }
            }
          )
        );
      },
      () => {
        nativeManaged.current = true;
        generation.current += 1;
        completed.current = false;
        cancelAnimation(progress);
        progress.set(startProgress);
        setFinished(false);
      },
      () => {
        nativeManaged.current = true;
        generation.current += 1;
        completed.current = true;
        cancelAnimation(progress);
        progress.set(1);
      },
      progress
    );
    return () => {
      unregister();
      generation.current += 1;
      cancelAnimation(progress);
    };
  }, [nativeTab, reduced, duration, progress, startProgress, complete]);
  const borrowing = !!(
    inherit &&
    parent?.enabled &&
    (!(parent.completion?.current ?? parent.finished) ||
      (retainPreparedParent && parent.preparedNativeTab))
  );
  useLayoutEffect(() => {
    // Once UIKit owns this tab, stale/coalesced React focus renders must not
    // cancel, reset or restart its native appearance timeline.
    if (nativeTab && nativeManaged.current && !reduced) {
      return;
    }
    const token = ++generation.current;
    let frame: number | undefined;
    cancelAnimation(progress);
    if (enabled && active && !reduced) {
      hasStarted.current = true;
    }
    if (borrowing) {
      // One timeline per screen. Nested/late elements must not each start an
      // unused timer and send a completion update during the tab switch.
      completed.current = true;
      setFinished(true);
      progress.set(1);
    } else if (!enabled && !replayOnFocus && hasStarted.current) {
      // Do not re-cover the outgoing screen or replay the previous screen
      // while the native stack is moving them. Also settle interrupted entry.
      completed.current = true;
      setFinished(true);
      progress.set(1);
    } else if (!enabled || reduced) {
      completed.current = false;
      setFinished(!prepareOnBlur || reduced);
      // Pre-arm cached consumers; disabled text still renders normally.
      progress.set(reduced ? 1 : startProgress);
    } else if (completed.current) {
      setFinished(true);
      progress.set(1);
    } else {
      setFinished(false);
      progress.set(startProgress);
    }
    if (!borrowing && enabled && active && !reduced && !completed.current) {
      const start = () => {
        if (generation.current !== token) {
          return;
        }
        const reveal = withTiming(
          1,
          {
            duration,
            easing: Easing.linear,
            reduceMotion: ReduceMotion.Never,
          },
          (done) => {
            if (done) {
              scheduleOnRN(complete, token);
            }
          }
        );
        progress.set(
          delay > 0 ? withDelay(delay, reveal, ReduceMotion.Never) : reveal
        );
      };
      if (startOnFrame) {
        frame = requestAnimationFrame(() => {
          frame = requestAnimationFrame(start);
        });
      } else {
        start();
      }
    }
    return () => {
      if (nativeTab && nativeManaged.current && !reduced) {
        return;
      }
      generation.current += 1;
      if (frame !== undefined) {
        cancelAnimationFrame(frame);
      }
      cancelAnimation(progress);
    };
  }, [
    enabled,
    active,
    reduced,
    duration,
    delay,
    progress,
    complete,
    nativeTab,
    borrowing,
    startOnFrame,
    prepareOnBlur,
    replayOnFocus,
    startProgress,
  ]);
  // Publish pending state on the activation render, before layout effects run.
  const revealFinished =
    revealEnabled && !reduced && !completed.current ? false : finished;
  const animation = useMemo(
    () => ({
      enabled: revealEnabled,
      active,
      playing: enabled && active,
      reduced,
      finished: revealFinished,
      preparedNativeTab: retained,
      completion: completed,
      texturePhase,
      progress,
      initialProgress: startProgress,
      replayOnFocus,
      background: ascii?.theme.background ?? 'transparent',
    }),
    [
      enabled,
      active,
      reduced,
      revealFinished,
      revealEnabled,
      retained,
      replayOnFocus,
      startProgress,
      progress,
      texturePhase,
      ascii?.theme.background,
    ]
  );
  const current = borrowing ? parent : animation;
  return (
    <AnimationContext.Provider value={current}>
      <SkinContext.Provider
        value={internal && (current?.enabled ?? revealEnabled)}
      >
        {contentsOnly ? (
          children
        ) : (
          <View style={[fit ? styles.fit : undefined, style]}>
            {children}
            {!internal && (
              <AsciiSkinOverlay enabled={revealEnabled} radius={radius} />
            )}
          </View>
        )}
      </SkinContext.Provider>
    </AnimationContext.Provider>
  );
}
const styles = StyleSheet.create({
  overlay: { overflow: 'hidden', borderCurve: 'continuous' },
  texture: { borderRadius: 0 },
  fit: { alignSelf: 'flex-start', maxWidth: '100%' },
});
