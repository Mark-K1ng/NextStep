import {
  Children,
  isValidElement,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { PropsWithChildren } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { PressableProps, ViewProps } from 'react-native';
import Animated, {
  cancelAnimation,
  FadeInDown,
  FadeOutDown,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useMotionPreference } from '@/providers/motion';
import { motion } from '@/theme/motion';
import { radius, spacing } from '@/theme/tokens';
import { useTheme } from '@/hooks/use-theme';
import {
  AsciiContentGate,
  AsciiSkinOverlay,
  useAsciiSkinAnimation,
  AsciiElement,
} from './ascii-skin';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const contentEnter = FadeInDown.duration(motion.state)
  .easing(motion.easeOut)
  .withInitialValues({ translateY: motion.travel });
const contentExit = FadeOutDown.duration(motion.press)
  .easing(motion.easeOut)
  .withTargetValues({ translateY: motion.travel });
const contentLayout = LinearTransition.duration(motion.state).easing(
  motion.easeOut
);

/** Inline state changes share the same arrival, dismissal and reflow. */
export function MotionContent({
  animateExit = true,
  ...props
}: ViewProps & { animateExit?: boolean }) {
  const reduced = useMotionPreference();
  return (
    <AsciiElement>
      <Animated.View
        {...props}
        collapsable={false}
        entering={reduced ? undefined : contentEnter}
        exiting={reduced || !animateExit ? undefined : contentExit}
        layout={reduced ? undefined : contentLayout}
      />
    </AsciiElement>
  );
}

export function MotionLayout(props: ViewProps) {
  const reduced = useMotionPreference();
  return (
    <Animated.View {...props} layout={reduced ? undefined : contentLayout} />
  );
}

export function MotionChevron({
  expanded,
  children,
}: PropsWithChildren<{ expanded: boolean }>) {
  const reduced = useMotionPreference();
  const style = {
    transform: [{ rotate: expanded ? '180deg' : '0deg' }],
    transitionProperty: 'transform' as const,
    transitionDuration: reduced ? 0 : motion.state,
    transitionTimingFunction: motion.transitionEase,
  };
  return (
    <AsciiContentGate cover>
      <Animated.View style={style}>{children}</Animated.View>
    </AsciiContentGate>
  );
}

/** One native target; the motion never changes layout or delays onPress. */
export function MotionPressable({
  children,
  style,
  onPressIn,
  onPressOut,
  onHoverIn,
  onHoverOut,
  disabled,
  feedback = 'scale',
  ...props
}: PressableProps & { feedback?: 'scale' | 'highlight' }) {
  const reduced = useMotionPreference();
  const [pressed, setPressed] = useState(false);
  const [hovered, setHovered] = useState(false);
  const active = pressed && !disabled;
  const skin = useAsciiSkinAnimation();
  const showSkin = skin?.enabled && !skin.finished && !skin.reduced;
  const targetStyle =
    typeof style === 'function' ? style({ pressed: active, hovered }) : style;
  const content =
    typeof children === 'function'
      ? children({ pressed: active, hovered })
      : children;
  const hasSkin = Children.toArray(content).some(
    (child) => isValidElement(child) && child.type === AsciiSkinOverlay
  );
  // Composite rows already skin their own surfaces; covering the whole row
  // would hide its nested decoding labels behind a second opaque layer.
  const hasContainer = Children.toArray(content).some(
    (child) => isValidElement(child) && child.type === View
  );
  const corner = showSkin ? StyleSheet.flatten(targetStyle)?.borderRadius : 0;
  const transition = useMemo(
    () => ({
      transitionProperty: [
        'transform' as const,
        'opacity' as const,
        'backgroundColor' as const,
        'borderColor' as const,
      ],
      transitionDuration: reduced ? 0 : motion.press,
      transitionTimingFunction: motion.transitionEase,
    }),
    [reduced]
  );
  return (
    <AnimatedPressable
      {...props}
      disabled={disabled}
      onHoverIn={(event) => {
        setHovered(true);
        onHoverIn?.(event);
      }}
      onHoverOut={(event) => {
        setHovered(false);
        onHoverOut?.(event);
      }}
      pressRetentionOffset={props.pressRetentionOffset ?? 16}
      onPressIn={(event) => {
        setPressed(true);
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        setPressed(false);
        onPressOut?.(event);
      }}
      style={[
        targetStyle,
        transition,
        feedback === 'scale' && {
          transform: [{ scale: active && !reduced ? motion.pressedScale : 1 }],
        },
      ]}
    >
      {content}
      {showSkin && !hasSkin && !hasContainer && (
        <AsciiSkinOverlay radius={typeof corner === 'number' ? corner : 0} />
      )}
    </AnimatedPressable>
  );
}

/** Only use on a few first-use blocks, never on recycled catalogue rows. */
export function Reveal({
  order = 0,
  ...props
}: ViewProps & { order?: number }) {
  const reduced = useMotionPreference();
  const entering = useMemo(
    () =>
      FadeInDown.duration(motion.reveal)
        .delay(Math.min(Math.max(order, 0), 3) * motion.stagger)
        .easing(motion.easeOut)
        .withInitialValues({ translateY: motion.travel }),
    [order]
  );
  return <Animated.View {...props} entering={reduced ? undefined : entering} />;
}

/** A local acknowledgement when a saved/completed state actually changes. */
export function StateFeedback({
  value,
  children,
}: PropsWithChildren<{ value: boolean }>) {
  const reduced = useMotionPreference();
  const previous = useRef(value);
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.get() }],
  }));
  useEffect(() => {
    if (reduced) {
      scale.set(1);
    } else if (previous.current !== value) {
      scale.set(
        withSequence(
          withTiming(0.9, { duration: 80, easing: motion.easeOut }),
          withSpring(1, {
            duration: 200,
            dampingRatio: 1,
            overshootClamping: true,
          })
        )
      );
    }
    previous.current = value;
    return () => cancelAnimation(scale);
  }, [value, reduced, scale]);
  return <Animated.View style={style}>{children}</Animated.View>;
}

export function AnimatedProgress({
  value,
  total,
  label,
}: {
  value: number;
  total: number;
  label: string;
}) {
  const theme = useTheme();
  const reduced = useMotionPreference();
  const maximum = Number.isFinite(total) ? Math.max(0, total) : 0;
  const current = Number.isFinite(value)
    ? Math.min(maximum, Math.max(0, value))
    : 0;
  const fillStyle = {
    width: `${maximum ? (current / maximum) * 100 : 0}%` as `${number}%`,
    backgroundColor: theme.accent,
    transitionProperty: 'width' as const,
    transitionDuration: reduced ? 0 : motion.reveal,
    transitionTimingFunction: motion.transitionEase,
  };
  return (
    <View
      accessible
      accessibilityRole='progressbar'
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: maximum || 1, now: current }}
      style={[styles.track, { backgroundColor: theme.border }]}
    >
      <Animated.View style={[styles.fill, fillStyle]} />
      <AsciiSkinOverlay radius={radius.sm} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: spacing.sm,
    overflow: 'hidden',
    borderRadius: radius.sm,
    borderCurve: 'continuous',
  },
  // Absolute and childless: interpolating width never reflows adjacent content.
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: radius.sm,
    borderCurve: 'continuous',
  },
});
