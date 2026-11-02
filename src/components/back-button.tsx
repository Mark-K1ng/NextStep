import { Platform, StyleSheet } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { MotionPressable } from './motion';
import { useTheme } from '@/hooks/use-theme';
import { ro } from '@/i18n/ro';
import { NavigationSurface } from './navigation-surface';

export function BackButton({ onPress }: { onPress: () => void }) {
  const theme = useTheme();
  return (
    <MotionPressable
      accessibilityRole='button'
      accessibilityLabel={ro.common.back}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor:
            Platform.OS === 'ios' ? 'transparent' : theme.surface,
          borderColor: theme.border,
          opacity: pressed && Platform.OS !== 'ios' ? 0.7 : 1,
        },
      ]}
    >
      {Platform.OS === 'ios' && (
        <NavigationSurface
          pointerEvents='none'
          accessible={false}
          style={[
            StyleSheet.absoluteFill,
            styles.material,
            { backgroundColor: theme.surface },
          ]}
        />
      )}
      <ArrowLeft size={24} color={theme.accentText} />
    </MotionPressable>
  );
}

const styles = StyleSheet.create({
  material: { borderRadius: 24 },
  button: {
    width: 48,
    height: 48,
    minHeight: 48,
    borderRadius: 24,
    borderWidth: 1,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
