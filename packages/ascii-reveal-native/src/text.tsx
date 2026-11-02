import { useLayoutEffect, useMemo, useState, type ReactNode } from 'react';
import {
  StyleSheet,
  Platform,
  TextInput,
  View,
  type TextProps,
  type TextInputProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  ReduceMotion,
  dispatchCommand,
  useAnimatedProps,
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { AsciiProvider, useAsciiContext, useAsciiScope } from './provider';
import { decodeFrame } from './patterns';

// Native TextInput exposes `text` to Reanimated even though the public RN prop
// surface only declares the React-controlled `value`.
const AnimatedInput = Animated.createAnimatedComponent(
  TextInput as React.ComponentType<TextInputProps & { text?: string }>
);
export interface AsciiTextProps extends Omit<TextProps, 'children'> {
  text: string;
  duration?: number;
  animate?: boolean;
  revealOnMount?: boolean;
  glyphs?: string;
  children?: ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  progress?: SharedValue<number>;
  initialProgress?: number;
}
export function AsciiText(props: AsciiTextProps) {
  const scope = useAsciiContext();
  // Screen scopes pre-arm their shared progress while off screen. Reuse their
  // native text layers instead of remounting every label on a tab switch.
  const phase = props.progress
    ? 'shared'
    : props.animate === false
      ? 'normal'
      : 'reveal';
  return scope ? (
    <DecodingText key={phase} {...props} />
  ) : (
    <AsciiProvider>
      <DecodingText key={phase} {...props} />
    </AsciiProvider>
  );
}
function DecodingText({
  text,
  duration = 360,
  animate = true,
  revealOnMount = true,
  glyphs = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#%&*+=?/',
  style,
  accessibilityLabel,
  onLayout,
  children,
  containerStyle,
  progress: suppliedProgress,
  initialProgress = 0,
  ...props
}: AsciiTextProps) {
  const { theme, reduced, active } = useAsciiScope();
  const [initialText] = useState(text);
  const characters = useMemo(() => Array.from(text), [text]);
  const enabled =
    animate &&
    characters.length <= 1024 &&
    !reduced &&
    active &&
    (revealOnMount || text !== initialText);
  const keepDisplay =
    !!suppliedProgress && !reduced && active && characters.length <= 1024;
  // The first native commit must already hide the readable text.
  const ownProgress = useSharedValue(enabled ? 0 : 1);
  const progress = suppliedProgress ?? ownProgress;
  const nativeText = Platform.OS === 'ios';
  const finalColor = StyleSheet.flatten(style)?.color ?? theme.foreground;
  const displayRef = useAnimatedRef<TextInput>();
  const finishRef = useAnimatedRef<TextInput>();
  const initialFrame = useMemo(
    () => decodeFrame(characters, initialProgress, 0, glyphs),
    [characters, glyphs, initialProgress]
  );
  useLayoutEffect(() => {
    if (suppliedProgress) {
      return;
    }
    cancelAnimation(progress);
    progress.set(enabled ? 0 : 1);
    if (enabled) {
      progress.set(
        withTiming(1, {
          duration: Math.max(80, Math.min(800, duration)),
          easing: Easing.linear,
          reduceMotion: ReduceMotion.Never,
        })
      );
    }
    return () => cancelAnimation(progress);
  }, [text, enabled, duration, progress, suppliedProgress]);
  useAnimatedReaction(
    () => (nativeText && enabled ? progress.get() >= 1 : null),
    (done, previous) => {
      if (done === null || done === previous) {
        return;
      }
      if (done) {
        // These display-only commands share one UI-runtime turn. The finish
        // layer already has the correct color, so it needs no Fabric update.
        dispatchCommand(displayRef, 'setTextAndSelection', [0, '', -1, -1]);
        dispatchCommand(finishRef, 'setTextAndSelection', [0, text, -1, -1]);
      } else {
        // Clear the cached finish before the next reveal is presented.
        dispatchCommand(finishRef, 'setTextAndSelection', [0, '', -1, -1]);
      }
    }
  );
  const animatedProps = useAnimatedProps(() => {
    const p = progress.get();
    return {
      text:
        nativeText && p >= 1
          ? ''
          : decodeFrame(characters, p, Math.floor(p * 12), glyphs),
    };
  });
  const finalStyle = useAnimatedStyle(() => ({
    opacity: !enabled || progress.get() >= 1 ? 1 : 0,
  }));
  const scrambleStyle = useAnimatedStyle(() => ({
    opacity: enabled && progress.get() < 1 ? 1 : 0,
  }));
  return (
    <View
      accessible
      accessibilityRole={props.accessibilityRole ?? 'text'}
      accessibilityLabel={accessibilityLabel ?? text}
      onLayout={onLayout}
      style={containerStyle}
    >
      <Animated.Text
        {...props}
        accessible={false}
        importantForAccessibility='no-hide-descendants'
        style={[{ color: theme.foreground }, style, finalStyle]}
      >
        {children ?? text}
      </Animated.Text>
      {(enabled || keepDisplay) && (
        <AnimatedInput
          ref={displayRef}
          multiline={props.numberOfLines !== 1}
          editable={false}
          autoCorrect={false}
          spellCheck={false}
          autoComplete='off'
          textContentType='none'
          importantForAutofill='no'
          caretHidden
          scrollEnabled={false}
          accessible={false}
          importantForAccessibility='no-hide-descendants'
          pointerEvents='none'
          underlineColorAndroid='transparent'
          defaultValue={initialFrame}
          animatedProps={animatedProps}
          style={[
            StyleSheet.absoluteFill,
            styles.input,
            style,
            { color: theme.accent },
            scrambleStyle,
          ]}
        />
      )}
      {nativeText && (enabled || keepDisplay) && (
        <AnimatedInput
          ref={finishRef}
          multiline={props.numberOfLines !== 1}
          editable={false}
          autoCorrect={false}
          spellCheck={false}
          autoComplete='off'
          textContentType='none'
          importantForAutofill='no'
          caretHidden
          scrollEnabled={false}
          accessible={false}
          importantForAccessibility='no-hide-descendants'
          pointerEvents='none'
          underlineColorAndroid='transparent'
          defaultValue=''
          style={[
            StyleSheet.absoluteFill,
            styles.input,
            style,
            { color: finalColor },
            scrambleStyle,
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    padding: 0,
    margin: 0,
    textAlignVertical: 'top',
    includeFontPadding: false,
  },
});
