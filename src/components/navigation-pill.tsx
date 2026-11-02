import { StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';

export type NavigationPillProps = {
  x: SharedValue<number>;
  top: number;
  width: number;
  height: number;
  color: string;
};

export function NavigationPill({
  x,
  top,
  width,
  height,
  color,
}: NavigationPillProps) {
  const position = useAnimatedStyle(() => ({
    transform: [{ translateX: x.get() }],
  }));
  return (
    <Animated.View
      pointerEvents='none'
      accessible={false}
      importantForAccessibility='no-hide-descendants'
      style={[
        styles.pill,
        {
          top,
          width,
          height,
          borderRadius: height / 2,
          backgroundColor: color,
        },
        position,
      ]}
    />
  );
}
const styles = StyleSheet.create({ pill: { position: 'absolute', left: 0 } });
