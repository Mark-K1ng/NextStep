import { useMemo, useState } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  View,
  type DimensionValue,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';
import { glyphs, patterns, mascotFrames, type AsciiVariant } from './patterns';
import { AsciiProvider, useAsciiContext, useAsciiScope } from './provider';

export interface AsciiSkeletonProps {
  variant?: AsciiVariant;
  lines?: number;
  widths?: number[];
  rows?: number;
  width?: DimensionValue;
  height?: number;
  circle?: boolean;
  fontSize?: number;
  seed?: number;
  animate?: boolean;
  /** A bounded UI timeline; avoids subscribing to the loading loop. */
  phase?: SharedValue<number>;
  color?: string;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  decorative?: boolean;
  mascot?: keyof typeof mascotFrames | readonly string[];
}
export function AsciiSkeleton(props: AsciiSkeletonProps) {
  const scope = useAsciiContext();
  return scope ? (
    <Skeleton {...props} />
  ) : (
    <AsciiProvider>
      <Skeleton {...props} />
    </AsciiProvider>
  );
}
function Wave({
  phase,
  width,
  index,
  layers,
  color,
  fontFamily,
  height,
}: {
  phase: SharedValue<number>;
  width: number;
  index: number;
  layers: string[];
  color: string;
  fontFamily: string;
  height: number;
}) {
  const band = Math.max(12, width * 0.5);
  const x = () => {
    'worklet';
    const progress = (phase.get() / 1800 + 1 - index * 0.05) % 1;
    return -band + progress * (width + band);
  };
  const moving = useAnimatedStyle(() => ({ transform: [{ translateX: x() }] }));
  const anchored = useAnimatedStyle(() => ({
    transform: [{ translateX: -x() }],
  }));
  const first = useAnimatedStyle(() => ({
    opacity: Math.floor(phase.get() / 120) % 2 ? 0 : 0.9,
  }));
  const second = useAnimatedStyle(() => ({
    opacity: Math.floor(phase.get() / 120) % 2 ? 0.9 : 0,
  }));
  return (
    <Animated.View
      pointerEvents='none'
      style={[styles.band, { width: band, height }, moving]}
    >
      <Animated.View style={[{ width }, anchored]}>
        {[first, second].map((opacity, frame) => (
          <Animated.Text
            key={frame}
            allowFontScaling={false}
            style={[styles.glyph, styles.layer, { color, fontFamily }, opacity]}
          >
            {layers[frame]}
          </Animated.Text>
        ))}
      </Animated.View>
    </Animated.View>
  );
}
function Skeleton({
  variant = 'dither',
  lines = 3,
  widths = [1, 0.94, 0.72],
  rows,
  width = '100%',
  height,
  circle,
  seed = 1,
  animate = true,
  phase: suppliedPhase,
  color,
  style,
  accessibilityLabel = 'Loading',
  decorative = false,
  mascot,
}: AsciiSkeletonProps) {
  const {
    theme,
    reduced,
    active,
    phase: scopePhase,
  } = useAsciiScope(animate && !suppliedPhase);
  const phase = suppliedPhase ?? scopePhase;
  const [measuredWidth, setMeasuredWidth] = useState(
    typeof width === 'number' ? width : 240
  );
  const fontFamily =
    theme.fontFamily ?? (Platform.OS === 'ios' ? 'Menlo' : 'monospace');
  const spec = patterns[variant];
  const blockRows = Math.max(1, Math.min(48, rows ?? 1));
  const glyphHeight = blockRows * 16;
  const frames = typeof mascot === 'string' ? mascotFrames[mascot] : mascot;
  const count =
    frames || rows ? 1 : Math.max(1, Math.min(12, Math.floor(lines)));
  const groups = useMemo(
    () =>
      Array.from({ length: count }, (_, index) => {
        const n = Math.min(160, Math.ceil(measuredWidth / 7.2) + 1);
        const block = (alphabet: string, offset: number) =>
          Array.from({ length: blockRows }, (_row, row) =>
            glyphs(seed * 43 + index * 97 + row * 71 + offset, n, alphabet)
          ).join('\n');
        return [
          block(spec.base, 0),
          block(spec.wave, 163),
          block(spec.wave, 419),
        ];
      }),
    [count, measuredWidth, blockRows, seed, spec]
  );
  const mascotFirst = useAnimatedStyle(() => ({
    opacity:
      !animate || !active || reduced || Math.floor(phase.get() / 300) % 2 === 0
        ? 1
        : 0,
  }));
  const mascotSecond = useAnimatedStyle(() => ({
    opacity:
      animate && active && !reduced && Math.floor(phase.get() / 300) % 2 !== 0
        ? 1
        : 0,
  }));
  return (
    <View
      accessible={!decorative}
      accessibilityRole={decorative ? undefined : 'progressbar'}
      accessibilityLabel={decorative ? undefined : accessibilityLabel}
      accessibilityState={decorative ? undefined : { busy: true }}
      accessibilityElementsHidden={decorative}
      importantForAccessibility={decorative ? 'no-hide-descendants' : 'yes'}
      pointerEvents='none'
      onLayout={({ nativeEvent }) => {
        const next = Math.round(nativeEvent.layout.width);
        if (next > 0 && next !== measuredWidth) {
          setMeasuredWidth(next);
        }
      }}
      style={[
        styles.skeleton,
        { width, height },
        circle && styles.circle,
        style,
      ]}
    >
      <View
        accessible={false}
        accessibilityElementsHidden
        importantForAccessibility='no-hide-descendants'
        style={styles.decoration}
      >
        {frames ? (
          <View style={{ height: frames[0].split('\n').length * 16 }}>
            <Animated.Text
              allowFontScaling={false}
              style={[
                styles.glyph,
                { color: color ?? theme.accent, fontFamily },
                mascotFirst,
              ]}
            >
              {frames[0]}
            </Animated.Text>
            <Animated.Text
              allowFontScaling={false}
              style={[
                styles.glyph,
                styles.layer,
                { color: color ?? theme.accent, fontFamily },
                mascotSecond,
              ]}
            >
              {frames[1] ?? frames[0]}
            </Animated.Text>
          </View>
        ) : (
          groups.map(([base, ...layers], index) => (
            <View
              key={index}
              style={[
                styles.row,
                {
                  height: glyphHeight,
                  width: `${Math.round((rows ? 1 : Math.max(0.05, Math.min(1, widths[index % widths.length] ?? 1))) * 100)}%`,
                },
              ]}
            >
              <Text
                allowFontScaling={false}
                style={[
                  styles.glyph,
                  {
                    fontFamily,
                    color: color ?? theme.foreground,
                    opacity: spec.opacity,
                  },
                ]}
              >
                {base}
              </Text>
              {animate && active && !reduced && (
                <Wave
                  phase={phase}
                  width={
                    measuredWidth *
                    (rows ? 1 : (widths[index % widths.length] ?? 1))
                  }
                  index={index}
                  layers={layers}
                  color={color ?? theme.accent}
                  fontFamily={fontFamily}
                  height={glyphHeight}
                />
              )}
            </View>
          ))
        )}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  circle: { borderRadius: 999 },
  skeleton: { overflow: 'hidden', justifyContent: 'center' },
  decoration: { gap: 8 },
  row: { overflow: 'hidden' },
  glyph: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
    includeFontPadding: false,
  },
  layer: { position: 'absolute', top: 0, left: 0 },
  band: { position: 'absolute', top: 0, left: 0, overflow: 'hidden' },
});
