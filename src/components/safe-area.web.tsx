import { View, type ViewProps, type ViewStyle } from 'react-native';

type Edge = 'top' | 'right' | 'bottom' | 'left';

// SDK 58 disables JS safe-area measurement on web during streamed hydration.
// Browser CSS values update without interrupting hydration.
export function SafeAreaView({
  edges = ['top', 'right', 'bottom', 'left'],
  style,
  ...props
}: ViewProps & { edges?: readonly Edge[] }) {
  const padding = Object.fromEntries(
    edges.map((edge) => [
      `padding${edge[0].toUpperCase()}${edge.slice(1)}`,
      `env(safe-area-inset-${edge}, 0px)`,
    ])
  ) as ViewStyle;
  return <View {...props} style={[style, padding]} />;
}
