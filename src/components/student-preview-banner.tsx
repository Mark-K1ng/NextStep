import { DecodingText as Text } from '@/components/decoding-text';
import { useRouter } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { useAccountMode } from '@/providers/account-mode';
import { Button } from '@/components/Button';
import { spacing, typography } from '@/theme/tokens';
import { useTheme } from '@/hooks/use-theme';

export function StudentPreviewBanner() {
  const { isPreview } = useAccountMode();
  return isPreview ? <ActivePreviewBanner /> : null;
}
function ActivePreviewBanner() {
  const { exitPreview } = useAccountMode();
  const router = useRouter();
  const theme = useTheme();
  return (
    <View style={[styles.banner, { backgroundColor: theme.surface }]}>
      <Text style={[typography.label, { color: theme.textSecondary }]}>
        Perspectiva elevului · previzualizare
      </Text>
      <Button
        variant='secondary'
        onPress={() => {
          exitPreview();
          router.replace('/');
        }}
      >
        Înapoi la panoul profesorului
      </Button>
    </View>
  );
}
const styles = StyleSheet.create({
  banner: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
});
