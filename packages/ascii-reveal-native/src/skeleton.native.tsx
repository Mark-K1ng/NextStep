import { useAsciiFont } from './font.native';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Canvas,
  Group,
  LinearGradient,
  Text,
  vec,
  type SkFont,
} from '@shopify/react-native-skia';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';
import { AsciiProvider, useAsciiContext, useAsciiScope } from './provider';
import { glyphRow, sweepEase, variants } from './upstream';
import type { AsciiSkeletonProps } from './skeleton';
import { AsciiSkeleton as FallbackSkeleton } from './skeleton-fallback';

function Row({
  index,
  width,
  rows,
  lineHeight,
  phase,
  font,
  variant,
  seed,
  color,
  foreground,
  animate,
}: {
  index: number;
  width: number;
  rows: number;
  lineHeight: number;
  phase: SharedValue<number>;
  font: SkFont;
  variant: keyof typeof variants;
  seed: number;
  color: string;
  foreground: string;
  animate: boolean;
}) {
  const v = variants[variant];
  const n = Math.min(
    rows > 1 ? 96 : 120,
    Math.ceil(
      width / Math.max(1, font.getGlyphWidths(font.getGlyphIDs(v.base[0]))[0])
    ) + 1
  );
  const text = useMemo(
    () =>
      Array.from({ length: rows }, (_, row) => [
        glyphRow(seed * 97 + index * 13 + row, n, v.base, v.gap, v.bias),
        glyphRow(seed * 97 + index * 13 + row + 300, n, v.wave, v.gap, v.bias),
        glyphRow(seed * 97 + index * 13 + row + 600, n, v.wave, v.gap, v.bias),
      ]),
    [rows, seed, index, n, v]
  );
  const metrics = font.getMetrics();
  const baseline =
    (lineHeight - (metrics.descent - metrics.ascent)) / 2 - metrics.ascent;
  return (
    <Group
      transform={[{ translateY: index * (lineHeight + 6.6) }]}
      clip={{ x: 0, y: 0, width, height: rows * lineHeight }}
    >
      {text.map((line, row) => (
        <Text
          key={row}
          text={line[0]}
          font={font}
          x={0}
          y={row * lineHeight + baseline}
          color={foreground}
          opacity={v.baseAlpha}
        />
      ))}
      {animate && (
        <Wave
          texts={text}
          width={width}
          rows={rows}
          lineHeight={lineHeight}
          baseline={baseline}
          phase={phase}
          font={font}
          variant={variant}
          color={color}
          index={index}
        />
      )}
    </Group>
  );
}
function Wave({
  texts,
  width,
  rows: _rows,
  lineHeight,
  baseline,
  phase,
  font,
  variant,
  color,
  index,
}: {
  texts: string[][];
  width: number;
  rows: number;
  lineHeight: number;
  baseline: number;
  phase: SharedValue<number>;
  font: SkFont;
  variant: keyof typeof variants;
  color: string;
  index: number;
}) {
  const v = variants[variant];
  const band = width * v.band;
  const x = useDerivedValue(() => {
    const p =
      ((((phase.get() - index * 90) % v.speed) + v.speed) % v.speed) / v.speed;
    return (width - band) * (-1.2 + 3.4 * sweepEase(p));
  });
  const start = useDerivedValue(() => vec(x.get(), 0));
  const end = useDerivedValue(() => vec(x.get() + band, 0));
  const a = useDerivedValue(() =>
    Math.floor(phase.get() / 120) % 2 === 0 ? v.opacity : 0
  );
  const b = useDerivedValue(() =>
    Math.floor(phase.get() / 120) % 2 !== 0 ? v.opacity : 0
  );
  return (
    <Group>
      <LinearGradient
        start={start}
        end={end}
        colors={['transparent', color, color, 'transparent']}
        positions={[0, 0.45, 0.55, 1]}
      />
      <Group opacity={a}>
        {texts.map((line, row) => (
          <Text
            key={row}
            text={line[1]}
            font={font}
            x={0}
            y={row * lineHeight + baseline}
          />
        ))}
      </Group>
      <Group opacity={b}>
        {texts.map((line, row) => (
          <Text
            key={row}
            text={line[2]}
            font={font}
            x={0}
            y={row * lineHeight + baseline}
          />
        ))}
      </Group>
    </Group>
  );
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
function Skeleton({
  variant = 'dither',
  lines = 3,
  widths = [1, 0.94, 0.72],
  rows,
  width = '100%',
  height,
  circle,
  fontSize = 12,
  seed = 1,
  animate = true,
  phase: suppliedPhase,
  color,
  style,
  decorative = false,
  accessibilityLabel = 'Loading',
  mascot,
}: AsciiSkeletonProps) {
  const {
    theme,
    reduced,
    active,
    phase: scopePhase,
  } = useAsciiScope(animate && !suppliedPhase);
  const phase = suppliedPhase ?? scopePhase;
  const [measured, setMeasured] = useState(
    typeof width === 'number' ? width : 240
  );
  const font = useAsciiFont(variant, fontSize, theme.fontFamily);
  if (mascot) {
    return (
      <FallbackSkeleton
        variant={variant}
        mascot={mascot}
        width={width}
        decorative={decorative}
      />
    );
  }
  const count = rows ? 1 : Math.max(1, Math.min(12, lines));
  const blockRows = Math.max(1, Math.min(48, rows ?? 1));
  const lh = rows || variant === 'dither' ? fontSize : fontSize * 1.3;
  const naturalHeight = count * lh + (count - 1) * 6.6;
  const canvasHeight = height ?? (rows ? blockRows * lh : naturalHeight);
  return (
    <View
      accessible={!decorative}
      accessibilityRole={decorative ? undefined : 'progressbar'}
      accessibilityLabel={decorative ? undefined : accessibilityLabel}
      accessibilityState={decorative ? undefined : { busy: true }}
      importantForAccessibility={decorative ? 'no-hide-descendants' : 'yes'}
      pointerEvents='none'
      onLayout={({ nativeEvent }) => {
        const w = Math.round(nativeEvent.layout.width);
        if (w > 0 && w !== measured) {
          setMeasured(w);
        }
      }}
      style={[
        { width, height: canvasHeight },
        rows && styles.block,
        circle && styles.circle,
        style,
      ]}
    >
      <Canvas
        accessible={false}
        importantForAccessibility='no-hide-descendants'
        style={StyleSheet.absoluteFill}
      >
        {font &&
          Array.from({ length: count }, (_, index) => (
            <Row
              key={index}
              index={index}
              width={
                measured * (rows ? 1 : (widths[index % widths.length] ?? 1))
              }
              rows={blockRows}
              lineHeight={lh}
              phase={phase}
              font={font}
              variant={variant}
              seed={seed}
              color={color ?? theme.accent}
              foreground={color ?? theme.foreground}
              animate={animate && active && !reduced}
            />
          ))}
      </Canvas>
    </View>
  );
}
const styles = StyleSheet.create({
  block: { borderRadius: 8, overflow: 'hidden' },
  circle: { borderRadius: 999, overflow: 'hidden' },
});
