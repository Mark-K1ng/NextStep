import { useEffect, useState } from 'react';
import {
  AccessibilityInfo,
  View,
  StyleSheet,
  type ViewProps,
} from 'react-native';
import {
  GlassView,
  isLiquidGlassAvailable,
  isGlassEffectAPIAvailable,
} from 'expo-glass-effect';
import { useTheme } from '@/hooks/use-theme';

export function NavigationSurface(props: ViewProps) {
  const theme = useTheme();
  const [reduceTransparency, setReduceTransparency] = useState(true);
  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceTransparencyEnabled()
      .then((enabled) => {
        if (mounted) {
          setReduceTransparency(enabled);
        }
      })
      .catch(() => {});
    const subscription = AccessibilityInfo.addEventListener(
      'reduceTransparencyChanged',
      setReduceTransparency
    );
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);
  return !reduceTransparency &&
    isGlassEffectAPIAvailable() &&
    isLiquidGlassAvailable() ? (
    <GlassView
      {...props}
      style={[props.style, styles.glass]}
      glassEffectStyle='regular'
      colorScheme={theme.isDark ? 'dark' : 'light'}
    />
  ) : (
    <View {...props} />
  );
}
const styles = StyleSheet.create({ glass: { backgroundColor: 'transparent' } });
