import { forwardRef, type ComponentRef } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import {
  SafeAreaView as NativeSafeAreaView,
  useSafeAreaInsets,
  type Edge,
  type EdgeMode,
  type EdgeRecord,
  type SafeAreaViewProps,
} from 'react-native-safe-area-context';

const allEdges: EdgeRecord = {
  top: 'additive',
  right: 'additive',
  bottom: 'additive',
  left: 'additive',
};
const sides = ['top', 'right', 'bottom', 'left'] as const;
const applyInset = (base: number, inset: number, mode?: EdgeMode) =>
  mode === 'maximum'
    ? Math.max(base, inset)
    : mode === 'additive'
      ? base + inset
      : base;

// Native SafeAreaView briefly drops its padding when a native tab reattaches.
// The hook already has the correct inset then; apply it in the first React layout.
const IosSafeAreaView = forwardRef<
  ComponentRef<typeof View>,
  SafeAreaViewProps
>(function IosSafeAreaContent(
  { style, edges, mode = 'padding', ...props },
  ref
) {
  const insets = useSafeAreaInsets();
  const selected: EdgeRecord =
    edges == null
      ? allEdges
      : Array.isArray(edges)
        ? Object.fromEntries(edges.map((edge: Edge) => [edge, 'additive']))
        : (edges as EdgeRecord);
  const flat = (StyleSheet.flatten(style) || {}) as Record<string, number>;
  const insetStyle = Object.fromEntries(
    sides.map((side) => {
      const property = `${mode}${side[0].toUpperCase()}${side.slice(1)}`;
      const axis =
        side === 'top' || side === 'bottom' ? 'Vertical' : 'Horizontal';
      const base = flat[property] ?? flat[`${mode}${axis}`] ?? flat[mode] ?? 0;
      return [property, applyInset(base, insets[side], selected[side])];
    })
  );
  return <View {...props} ref={ref} style={[style, insetStyle]} />;
});

export const SafeAreaView = forwardRef<
  ComponentRef<typeof View>,
  SafeAreaViewProps
>(function SafeAreaContainer(props, ref) {
  return Platform.OS === 'ios' ? (
    <IosSafeAreaView {...props} ref={ref} />
  ) : (
    <NativeSafeAreaView {...props} ref={ref} />
  );
});
