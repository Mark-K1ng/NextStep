import { DecodingText as Text } from '@/components/decoding-text';
import { useEffect } from 'react';
import { AccessibilityInfo, Platform, StyleSheet, View } from 'react-native';
import { CheckCircle2, CircleMinus } from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/use-theme';
import { spacing as s, radius, typography } from '@/theme/tokens';
import { useJourney } from '@/providers/journey';
import { useMotionPreference } from '@/providers/motion';
import { ASCII_REVEAL_MS } from '@/constants/tab-transition';
import { AsciiSkin, AsciiSkinOverlay, AsciiContentGate } from './ascii-skin';
export type ToastProps = {
  message: string;
  type?: 'success' | 'removed' | 'error' | 'warning' | 'info';
  visible: boolean;
  onHide?(): void;
  duration?: number;
};
export function Toast({
  message,
  type = 'success',
  visible,
  onHide,
  duration = 2600,
}: ToastProps) {
  const theme = useTheme();
  const removed = type === 'removed';
  const color =
    removed || type === 'error'
      ? theme.danger
      : type === 'warning'
        ? theme.warning
        : type === 'info'
          ? theme.accent
          : theme.success;
  const Icon = removed ? CircleMinus : CheckCircle2;
  const insets = useSafeAreaInsets();
  const { barHeight } = useJourney();
  const reduced = useMotionPreference();
  const offset = useSharedValue(240);
  const opacity = useSharedValue(0);
  const animation = useAnimatedStyle(() => ({
    transform: [{ translateY: offset.get() }],
    opacity: opacity.get(),
  }));
  useEffect(() => {
    if (!visible) {
      return;
    }
    if (Platform.OS !== 'web') {
      AccessibilityInfo.announceForAccessibility(message);
    }
    offset.set(reduced ? 0 : withSpring(0, { duration: 300, dampingRatio: 1 }));
    opacity.set(withTiming(1, { duration: reduced ? 0 : 120 }));
    const timer = setTimeout(() => {
      opacity.set(withTiming(0, { duration: reduced ? 0 : 180 }));
      offset.set(
        withTiming(
          240,
          {
            duration: reduced ? 0 : 220,
            easing: Easing.bezier(0.23, 1, 0.32, 1),
          },
          (finished) => {
            if (finished && onHide) {
              scheduleOnRN(onHide);
            }
          }
        )
      );
    }, duration);
    return () => clearTimeout(timer);
  }, [visible, message, duration, onHide, reduced, offset, opacity]);
  if (!visible) {
    return null;
  }
  return (
    <Animated.View
      pointerEvents='none'
      accessibilityRole='alert'
      accessibilityLiveRegion='polite'
      style={[
        styles.position,
        { bottom: Math.max(barHeight, insets.bottom + 64) + s.md },
        animation,
      ]}
    >
      <AsciiSkin
        key={message}
        enabled={!reduced}
        internal
        duration={ASCII_REVEAL_MS}
        style={styles.scope}
      >
        <View
          style={[
            styles.bubble,
            {
              backgroundColor: removed
                ? theme.dangerSurface
                : theme.surfaceElevated,
              borderColor: color,
            },
          ]}
        >
          <AsciiSkinOverlay radius={radius.lg} />
          <AsciiContentGate>
            <Icon color={color} size={22} />
          </AsciiContentGate>
          <Text
            style={[typography.body, styles.text, { color: theme.textPrimary }]}
          >
            {message}
          </Text>
        </View>
      </AsciiSkin>
    </Animated.View>
  );
}
const styles = StyleSheet.create({
  scope: { width: '100%', maxWidth: 600 },
  position: {
    position: 'absolute',
    left: s.lg,
    right: s.lg,
    zIndex: 1000,
    alignItems: 'center',
  },
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.md,
    padding: s.lg,
    borderRadius: radius.lg,
    borderCurve: 'continuous',
    borderWidth: 1,
    width: '100%',
    maxWidth: 600,
  },
  text: { flex: 1 },
});
