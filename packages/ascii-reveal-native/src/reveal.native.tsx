import { useAsciiFont } from './font.native';
import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  AlphaType,
  Canvas,
  ColorType,
  Picture,
  Skia,
  makeImageFromView,
} from '@shopify/react-native-skia';
import {
  cancelAnimation,
  Easing,
  ReduceMotion,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { AsciiProvider, useAsciiContext, useAsciiScope } from './provider';
import { loadingCell, loadingSweep } from './loading-frame';
import { buildMediaGrid, type GridStep } from './media-grid';
import { clamp, ease, easeIO, hash, mediaPreset } from './upstream';
import type { AsciiRevealProps } from './reveal';

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
function Reveal({
  children,
  loading = false,
  variant = 'dither',
  duration = 450,
  revealOnMount = true,
  revealAfterLoading = false,
  animate = true,
  origin = 'center',
  style,
  onRevealComplete,
  loadingLabel = 'Loading',
  placeholder,
}: AsciiRevealProps) {
  const { theme, reduced, active, phase } = useAsciiScope(
    loading && animate && placeholder == null
  );
  const target = useRef<ComponentRef<typeof View>>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [grid, setGrid] = useState<GridStep[] | null>(null);
  const [revealing, setRevealing] = useState(!loading && revealOnMount);
  const progress = useSharedValue(1);
  const first = useRef(true),
    previousLoading = useRef(loading),
    generation = useRef(0);
  const callback = useRef(onRevealComplete);
  callback.current = onRevealComplete;
  const complete = useRef(() => {
    setRevealing(false);
    setGrid(null);
    callback.current?.();
  }).current;
  const font = useAsciiFont(variant, 12, theme.fontFamily);
  const preset =
    variant === 'dither'
      ? 'dither'
      : variant === 'terminal'
        ? 'terminal'
        : 'decode';
  const p = mediaPreset[preset];
  const frameClock = useDerivedValue(() => Math.floor(phase.get() / 33) * 33);
  const frame = useDerivedValue(() => {
    const recorder = Skia.PictureRecorder();
    const canvas = recorder.beginRecording(
      Skia.XYWHRect(0, 0, size.width, size.height)
    );
    const q = clamp(
      (Math.floor((progress.get() * duration) / 33) * 33) / duration
    );
    if (grid && (loading || q < 1) && font) {
      const paint = Skia.Paint();
      paint.setAntiAlias(true);
      paint.setColor(Skia.Color(theme.background));
      paint.setAlphaf(loading || q < 0.68 ? 1 : 1 - easeIO((q - 0.68) / 0.32));
      canvas.drawRect(Skia.XYWHRect(0, 0, size.width, size.height), paint);
      const step =
        grid[
          loading
            ? grid.length - 1
            : Math.min(grid.length - 1, Math.floor((q / 0.8) * grid.length))
        ];
      const alpha = q < 0.74 ? 1 : 1 - ease((q - 0.74) / 0.26);
      const tick = Math.floor((q * duration) / p.tick);
      font.setSize(Math.round(step.cell * 1.02));
      const metrics = font.getMetrics();
      const baseline = -(metrics.ascent + metrics.descent) / 2;
      const sweep = loading
        ? loadingSweep(variant, frameClock.get(), size.width)
        : null;
      for (let i = 0; i < step.glyphs.length; i += 1) {
        const cell = step.glyphs[i];
        if (loading && sweep) {
          const texture = loadingCell(variant, i, cell.x, sweep);
          const x = cell.x - step.cell * 0.31,
            y = cell.y + baseline;
          paint.setColor(Skia.Color(theme.foreground));
          paint.setAlphaf(texture.baseAlpha);
          canvas.drawText(texture.base, x, y, paint, font);
          if (animate && active && !reduced) {
            paint.setColor(Skia.Color(theme.accent));
            paint.setAlphaf(texture.waveAlpha);
            canvas.drawText(texture.wave, x, y, paint, font);
          }
          continue;
        }
        if (cell.gate > q * 2.3) {
          continue;
        }
        let lv = cell.ink;
        if (hash(i, tick, 3) < 0.16) {
          lv += (hash(i, tick, 77) - 0.5) * 0.35;
        }
        const index = Math.round(clamp(lv * 1.15) * (p.ramp.length - 1));
        if (index <= 0) {
          continue;
        }
        const glyph = p.ramp[index];
        paint.setColor(
          Skia.Color(p.color === 'source' ? cell.color : theme.accent)
        );
        paint.setAlphaf(alpha);
        canvas.drawText(
          glyph,
          cell.x - step.cell * 0.31,
          cell.y + baseline,
          paint,
          font
        );
      }
      paint.dispose();
    }
    const picture = recorder.finishRecordingAsPicture();
    recorder.dispose();
    return picture;
  });
  useEffect(() => {
    if (!size.width || !size.height || !font) {
      return;
    }
    const reveal =
      !loading &&
      ((first.current && revealOnMount) ||
        (previousLoading.current && revealAfterLoading));
    first.current = false;
    previousLoading.current = loading;
    const token = ++generation.current;
    cancelAnimation(progress);
    if (loading) {
      progress.set(0);
      setRevealing(false);
      if (placeholder != null) {
        setGrid(null);
        return;
      }
    }
    if (!loading && (!reveal || !animate || reduced || !active)) {
      progress.set(1);
      setRevealing(false);
      setGrid(null);
      return;
    }
    setRevealing(!loading);
    progress.set(0);
    const raf = requestAnimationFrame(async () => {
      try {
        const image = // Skia still types refs as legacy RN instances; RN 0.88 uses native elements.
          await makeImageFromView(
            target as unknown as Parameters<typeof makeImageFromView>[0]
          );
        if (!image) {
          throw new Error('Snapshot unavailable');
        }
        if (generation.current !== token) {
          image.dispose();
          return;
        }
        const w = Math.min(640, Math.ceil(size.width)),
          h = Math.min(640, Math.ceil(size.height));
        const surface = Skia.Surface.MakeOffscreen(w, h);
        if (!surface) {
          image.dispose();
          throw new Error('Snapshot surface unavailable');
        }
        const paint = Skia.Paint();
        surface
          .getCanvas()
          .drawImageRect(
            image,
            Skia.XYWHRect(0, 0, image.width(), image.height()),
            Skia.XYWHRect(0, 0, w, h),
            paint
          );
        surface.flush();
        const small = surface.makeImageSnapshot();
        const pixels = small.readPixels(0, 0, {
          width: w,
          height: h,
          colorType: ColorType.RGBA_8888,
          alphaType: AlphaType.Unpremul,
        });
        image.dispose();
        small.dispose();
        surface.dispose();
        paint.dispose();
        if (!(pixels instanceof Uint8Array)) {
          throw new Error('Pixel sampling unavailable');
        }
        const bg = Array.from(Skia.Color(theme.background))
          .slice(0, 3)
          .map((c) => c * 255);
        const prepared = buildMediaGrid(
          size.width,
          size.height,
          pixels,
          w,
          h,
          bg,
          preset,
          origin
        );
        if (generation.current !== token) {
          return;
        }
        setGrid(prepared);
        if (!loading) {
          progress.set(
            withTiming(
              1,
              {
                duration: Math.max(120, Math.min(1200, duration)),
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
        }
      } catch {
        if (generation.current === token) {
          setRevealing(false);
          setGrid(null);
          progress.set(1);
        }
      }
    });
    return () => {
      generation.current += 1;
      cancelAnimationFrame(raf);
      cancelAnimation(progress);
    };
  }, [
    loading,
    children,
    placeholder,
    font,
    size.width,
    size.height,
    revealOnMount,
    revealAfterLoading,
    animate,
    reduced,
    active,
    duration,
    theme.background,
    preset,
    origin,
    progress,
    complete,
  ]);
  return (
    <View
      style={[styles.container, style]}
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
        ref={target}
        collapsable={false}
        pointerEvents={loading ? 'none' : 'auto'}
        accessibilityElementsHidden={loading}
        importantForAccessibility={loading ? 'no-hide-descendants' : 'auto'}
      >
        {children}
      </View>
      {(loading || (revealing && !grid)) && (
        <View
          accessible={loading}
          accessibilityRole={loading ? 'progressbar' : undefined}
          accessibilityLabel={loading ? loadingLabel : undefined}
          accessibilityState={loading ? { busy: true } : undefined}
          pointerEvents='none'
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: theme.background },
          ]}
        >
          {placeholder ??
            (grid && (
              <Canvas
                pointerEvents='none'
                accessible={false}
                importantForAccessibility='no-hide-descendants'
                style={StyleSheet.absoluteFill}
              >
                <Picture picture={frame} />
              </Canvas>
            ))}
        </View>
      )}
      {!loading && revealing && grid && (
        <Canvas
          pointerEvents='none'
          accessible={false}
          importantForAccessibility='no-hide-descendants'
          style={StyleSheet.absoluteFill}
        >
          <Picture picture={frame} />
        </Canvas>
      )}
    </View>
  );
}
const styles = StyleSheet.create({ container: { overflow: 'hidden' } });
