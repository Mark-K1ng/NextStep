import { memo, useEffect, useId } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Svg, {
  Circle,
  Defs,
  Path,
  RadialGradient,
  Stop,
} from 'react-native-svg';
import Animated, {
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import { scheduleOnRN } from 'react-native-worklets';
import { hslToRgb, rgbToHex, type HSL } from '@/theme/palette';
import { AsciiSkinOverlay } from './ascii-skin';

const WheelFace = memo(function WheelFaceContent({ size }: { size: number }) {
  const gradient = useId().replace(/:/g, '');
  const r = size / 2;
  return (
    <Svg width={size} height={size} accessible={false}>
      <Defs>
        <RadialGradient id={gradient}>
          <Stop offset='0' stopColor='white' stopOpacity='1' />
          <Stop offset='1' stopColor='white' stopOpacity='0' />
        </RadialGradient>
      </Defs>
      {Array.from({ length: 360 }, (_, i) => {
        const a = (i * Math.PI) / 180,
          b = ((i + 1.3) * Math.PI) / 180;
        return (
          <Path
            key={i}
            fill={rgbToHex(hslToRgb([i, 100, 50]))}
            d={`M ${r} ${r} L ${r + r * Math.cos(a)} ${r + r * Math.sin(a)} A ${r} ${r} 0 0 1 ${r + r * Math.cos(b)} ${r + r * Math.sin(b)} Z`}
          />
        );
      })}
      <Circle cx={r} cy={r} r={r} fill={`url(#${gradient})`} />
    </Svg>
  );
});

/** Finger tracking stays on the UI thread; app previews are sampled, never sent per frame. */
export function ColorWheel({
  value,
  onChange,
  size,
  disabled = false,
}: {
  value: HSL;
  onChange(value: HSL): void;
  size: number;
  disabled?: boolean;
}) {
  const h = useSharedValue(value[0]);
  const s = useSharedValue(value[1]);
  const v = useSharedValue(value[2]);
  const dragging = useSharedValue(false);
  const lastPreview = useSharedValue(0);
  useEffect(() => {
    if (!dragging.get()) {
      h.set(value[0]);
      s.set(value[1]);
    }
    v.set(value[2]);
  }, [value, h, s, v, dragging]);
  const radius = size / 2;
  const update = (x: number, y: number) => {
    'worklet';
    const dx = x - radius,
      dy = y - radius;
    h.set(((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360);
    s.set(Math.min(100, (Math.hypot(dx, dy) / radius) * 100));
  };
  useAnimatedReaction(
    () =>
      [
        Math.round(h.get() / 3),
        Math.round(s.get() / 3),
        dragging.get(),
      ] as const,
    (next, prev) => {
      if (!next[2] || (prev && next[0] === prev[0] && next[1] === prev[1])) {
        return;
      }
      const now = Date.now();
      if (now - lastPreview.get() >= 100) {
        lastPreview.set(now);
        scheduleOnRN(onChange, [h.get(), s.get(), v.get()]);
      }
    }
  );
  const gesture = usePanGesture({
    enabled: !disabled,
    minDistance: 0,
    maxPointers: 1,
    shouldCancelWhenOutside: false,
    onActivate: (event) => {
      dragging.set(true);
      update(event.x, event.y);
    },
    onUpdate: (event) => update(event.x, event.y),
    onDeactivate: () => {
      dragging.set(false);
      scheduleOnRN(onChange, [h.get(), s.get(), v.get()]);
    },
  });
  const marker = useAnimatedStyle<ViewStyle>(() => ({
    transform: [
      {
        translateX:
          ((Math.cos((h.get() * Math.PI) / 180) * s.get()) / 100) *
          (radius - 2),
      },
      {
        translateY:
          ((Math.sin((h.get() * Math.PI) / 180) * s.get()) / 100) *
          (radius - 2),
      },
    ] as ViewStyle['transform'],
  }));
  return (
    <GestureDetector gesture={gesture}>
      <View
        accessibilityLabel='Selector circular de culoare'
        accessibilityHint='Trage pentru nuanță și saturație. Pentru valori exacte, folosește câmpurile HEX, RGB sau HSL de mai jos.'
        style={[styles.wheel, { width: size, height: size }]}
      >
        <View style={styles.face} pointerEvents='none'>
          <WheelFace size={size} />
          <View
            style={[
              StyleSheet.absoluteFill,
              styles.shade,
              { opacity: 1 - value[2] / 100 },
            ]}
          />
        </View>
        <Animated.View
          pointerEvents='none'
          style={[
            styles.marker,
            { left: radius - 10, top: radius - 10 },
            marker,
          ]}
        />
        <AsciiSkinOverlay radius={999} />
      </View>
    </GestureDetector>
  );
}
const styles = StyleSheet.create({
  wheel: { alignSelf: 'center' },
  shade: { backgroundColor: 'black' },
  face: { borderRadius: 999, overflow: 'hidden' },
  marker: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: 'white',
    backgroundColor: 'transparent',
    boxShadow: '0 0 0 1px #18171F',
  },
});
