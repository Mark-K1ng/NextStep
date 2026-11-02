import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
  type ReactNode,
} from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { AsciiProvider, useAsciiContext, useAsciiScope } from './provider';
import { AsciiSkeleton } from './skeleton';
import { glyphBlock, patterns, type AsciiVariant } from './patterns';

export interface AsciiRevealProps extends PropsWithChildren {
  loading?: boolean;
  variant?: AsciiVariant;
  duration?: number;
  revealOnMount?: boolean;
  /** Opt in to a separate decoding transition after data is ready. Default false. */
  revealAfterLoading?: boolean;
  animate?: boolean;
  origin?: 'left' | 'center';
  style?: StyleProp<ViewStyle>;
  onRevealComplete?(): void;
  loadingLabel?: string;
  /** Content-shaped placeholder, rendered in place while data is unavailable. */
  placeholder?: ReactNode;
}
export function AsciiReveal(props: AsciiRevealProps) {
  const scope = useAsciiContext();
  return scope ? (
    <Reveal {...props} />
  ) : (
    <AsciiProvider>
      <Reveal {...props} />
    </AsciiProvider>
  );
}
function DecodeColumn({
  progress,
  index,
  columns,
  rows,
  variant,
  width,
  height,
  origin,
}: {
  progress: SharedValue<number>;
  index: number;
  columns: number;
  rows: number;
  variant: AsciiVariant;
  width: number;
  height: number;
  origin: 'left' | 'center';
}) {
  const { theme } = useAsciiScope();
  const spec = patterns[variant];
  const grid = useMemo(
    () => glyphBlock(index * 89 + 1, 12, rows, spec.wave),
    [index, rows, spec]
  );
  const style = useAnimatedStyle(() => {
    const delay =
      origin === 'center'
        ? Math.abs((index + 0.5) / columns - 0.5) * 1.4
        : (index / columns) * 0.65;
    const local = Math.max(
      0,
      Math.min(1, (progress.get() - delay) / (1 - delay))
    );
    return { opacity: 1 - local, transform: [{ translateY: -local * 2 }] };
  });
  return (
    <Animated.View
      style={[
        styles.column,
        {
          left: (index * width) / columns,
          width: width / columns + 1,
          height,
          backgroundColor: theme.background,
        },
        style,
      ]}
    >
      <Text
        allowFontScaling={false}
        style={[
          styles.glyph,
          {
            color: theme.accent,
            fontFamily:
              theme.fontFamily ??
              (Platform.OS === 'ios' ? 'Menlo' : 'monospace'),
          },
        ]}
      >
        {grid}
      </Text>
    </Animated.View>
  );
}
function Reveal({
  children,
  loading = false,
  variant = 'scan',
  duration = 360,
  revealOnMount = true,
  revealAfterLoading = false,
  animate = true,
  origin = 'left',
  style,
  onRevealComplete,
  loadingLabel = 'Loading',
  placeholder,
}: AsciiRevealProps) {
  const { theme, reduced, active } = useAsciiScope();
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [revealing, setRevealing] = useState(!loading && revealOnMount);
  const first = useRef(true);
  const previousLoading = useRef(loading);
  const progress = useSharedValue(1);
  const callback = useRef(onRevealComplete);
  callback.current = onRevealComplete;
  const finish = () => {
    setRevealing(false);
    callback.current?.();
  };
  const finishRef = useRef(finish);
  finishRef.current = finish;
  const complete = useRef(() => finishRef.current()).current;
  useEffect(() => {
    if (!size.width || !size.height) {
      return;
    }
    const shouldReveal =
      !loading &&
      ((first.current && revealOnMount) ||
        (previousLoading.current && revealAfterLoading));
    first.current = false;
    previousLoading.current = loading;
    cancelAnimation(progress);
    if (loading) {
      progress.set(0);
      setRevealing(false);
      return;
    }
    if (!animate || reduced || !active) {
      progress.set(1);
      setRevealing(false);
      return;
    }
    if (shouldReveal) {
      setRevealing(true);
      progress.set(0);
      progress.set(
        withTiming(
          1,
          {
            duration: Math.max(80, Math.min(800, duration)),
            easing: Easing.linear,
            reduceMotion: ReduceMotion.Never,
          },
          (finished) => {
            if (finished) {
              scheduleOnRN(complete);
            }
          }
        )
      );
    } else {
      progress.set(1);
      setRevealing(false);
    }
    return () => cancelAnimation(progress);
  }, [
    loading,
    size.width,
    size.height,
    revealOnMount,
    revealAfterLoading,
    duration,
    reduced,
    animate,
    active,
    progress,
    complete,
  ]);
  return (
    <View
      style={style}
      onLayout={({ nativeEvent }) => {
        const next = {
          width: Math.round(nativeEvent.layout.width),
          height: Math.round(nativeEvent.layout.height),
        };
        setSize((old) =>
          old.width === next.width && old.height === next.height ? old : next
        );
      }}
    >
      <View
        pointerEvents={loading ? 'none' : 'auto'}
        accessibilityElementsHidden={loading}
        importantForAccessibility={loading ? 'no-hide-descendants' : 'auto'}
        style={loading ? styles.hidden : undefined}
      >
        {children}
      </View>
      {loading && (
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: theme.background },
          ]}
        >
          {placeholder ?? (
            <AsciiSkeleton
              variant={variant}
              rows={Math.max(1, Math.ceil(size.height / 16))}
              height={size.height || 48}
              accessibilityLabel={loadingLabel}
            />
          )}
        </View>
      )}
      {!loading && revealing && animate && !reduced && size.width > 0 && (
        <View
          pointerEvents='none'
          accessible={false}
          accessibilityElementsHidden
          importantForAccessibility='no-hide-descendants'
          style={[StyleSheet.absoluteFill, styles.overlay]}
        >
          {Array.from({ length: 12 }, (_, index) => (
            <DecodeColumn
              key={index}
              progress={progress}
              index={index}
              columns={12}
              rows={Math.ceil(size.height / 16)}
              width={size.width}
              height={size.height}
              variant={variant}
              origin={origin}
            />
          ))}
        </View>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  hidden: { opacity: 0 },
  overlay: { overflow: 'hidden' },
  column: { position: 'absolute', top: 0, overflow: 'hidden' },
  glyph: {
    fontSize: 12,
    lineHeight: 16,
    includeFontPadding: false,
    opacity: 0.8,
  },
});
