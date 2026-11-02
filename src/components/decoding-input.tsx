import { useMemo, useState, type ComponentType } from 'react';
import {
  Platform,
  StyleSheet,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import Animated, {
  dispatchCommand,
  useAnimatedProps,
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { decodeFrame } from '@nextstep/ascii-reveal-native';
import { useAsciiSkinAnimation } from './ascii-skin';
import { splitDecodingStyle } from './decoding-text';

const NativeInput = Animated.createAnimatedComponent(TextInput);
const DisplayInput = Animated.createAnimatedComponent(
  TextInput as ComponentType<TextInputProps & { text?: string }>
);

type Animation = NonNullable<ReturnType<typeof useAsciiSkinAnimation>>;
function ScopedInput({
  animation,
  ...props
}: TextInputProps & { animation: Animation }) {
  const [interacted, setInteracted] = useState(false);
  const value = props.value ?? props.defaultValue ?? '';
  // Decorative text never receives a password's actual characters.
  const display =
    value && props.secureTextEntry
      ? '•'.repeat(Array.from(value).length)
      : value || props.placeholder || '';
  const characters = useMemo(() => Array.from(display), [display]);
  const initialFrame = useMemo(
    () =>
      decodeFrame(
        characters,
        animation.initialProgress,
        0,
        'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#%&*+=?/'
      ),
    [characters, animation.initialProgress]
  );
  const enabled =
    animation.enabled &&
    animation.active &&
    !animation.reduced &&
    (!animation.finished || animation.preparedNativeTab === true) &&
    !interacted;
  // The context also contains a mutable JS completion ref. Capture only the
  // shared value and primitive needed by the UI-runtime styles.
  const { progress, preparedNativeTab } = animation;
  const nativeText = Platform.OS === 'ios';
  const displayRef = useAnimatedRef<TextInput>();
  useAnimatedReaction(
    () => (nativeText && enabled && progress.get() >= 1 ? display : null),
    (frame, previous) => {
      if (frame !== null && frame !== previous) {
        // Only the non-editable display receives this command, never the field.
        dispatchCommand(displayRef, 'setTextAndSelection', [0, frame, -1, -1]);
      }
    }
  );
  const animatedProps = useAnimatedProps(() => {
    const p = progress.get();
    return {
      text: decodeFrame(
        characters,
        p,
        Math.floor(p * 12),
        'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#%&*+=?/'
      ),
    };
  });
  // Set the native prop in this commit, before a cached UI mapper can show text.
  const inputStyle = useAnimatedStyle(() => ({
    opacity: enabled && (!preparedNativeTab || progress.get() < 1) ? 0 : 1,
  }));
  const displayStyle = useAnimatedStyle(() => ({
    ...(preparedNativeTab
      ? { opacity: enabled && progress.get() < 1 ? 1 : 0 }
      : {}),
  }));
  const { layout, text } = splitDecodingStyle(StyleSheet.flatten(props.style));
  return (
    <View style={[layout, enabled && styles.foreground]}>
      <NativeInput
        {...props}
        style={[
          text,
          {
            height: layout.height,
            minHeight: layout.minHeight,
            maxHeight: layout.maxHeight,
          },
          inputStyle,
        ]}
        onFocus={(event) => {
          setInteracted(true);
          props.onFocus?.(event);
        }}
      />
      {enabled && (
        <DisplayInput
          ref={displayRef}
          pointerEvents='none'
          accessible={false}
          accessibilityElementsHidden
          importantForAccessibility='no-hide-descendants'
          importantForAutofill='no'
          autoComplete='off'
          textContentType='none'
          autoCorrect={false}
          spellCheck={false}
          autoCapitalize='none'
          editable={false}
          focusable={false}
          caretHidden
          contextMenuHidden
          scrollEnabled={false}
          underlineColorAndroid='transparent'
          multiline={props.multiline}
          numberOfLines={props.numberOfLines}
          allowFontScaling={props.allowFontScaling}
          maxFontSizeMultiplier={props.maxFontSizeMultiplier}
          secureTextEntry={props.secureTextEntry}
          defaultValue={initialFrame}
          animatedProps={animatedProps}
          style={[StyleSheet.absoluteFill, text, displayStyle]}
        />
      )}
    </View>
  );
}
/** Decode a decorative display; the editable field always holds only real text. */
export function DecodingInput(props: TextInputProps) {
  const animation = useAsciiSkinAnimation();
  return animation ? (
    <ScopedInput {...props} animation={animation} />
  ) : (
    <TextInput {...props} />
  );
}
const styles = StyleSheet.create({ foreground: { zIndex: 1 } });
