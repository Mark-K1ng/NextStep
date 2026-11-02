import { StyleSheet } from 'react-native';
import { Canvas, RoundedRect } from '@shopify/react-native-skia';
import type { NavigationPillProps } from './navigation-pill';

/** Draw position directly, without a Fabric view-transform commit per frame. */
export function NavigationPill({
  x,
  top,
  width,
  height,
  color,
}: NavigationPillProps) {
  return (
    <Canvas
      pointerEvents='none'
      accessible={false}
      importantForAccessibility='no-hide-descendants'
      style={StyleSheet.absoluteFill}
    >
      <RoundedRect
        x={x}
        y={top}
        width={width}
        height={height}
        r={height / 2}
        color={color}
      />
    </Canvas>
  );
}
