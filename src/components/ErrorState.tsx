import { DecodingText as Text } from './decoding-text';
import { useTheme } from '@/hooks/use-theme';
import { View, ViewProps, StyleSheet } from 'react-native';
import { Button } from './Button';
import { spacing, theme } from '@/theme/tokens';

export type ErrorStateProps = ViewProps & {
  title?: string;
  subtitle?: string;
  error?: string;
  actionLabel?: string;
  onActionPress?: () => void;
};

export const ErrorState = ({
  title = 'Something went wrong',
  subtitle,
  error,
  actionLabel,
  onActionPress,
  style,
  ...props
}: ErrorStateProps) => {
  const currentTheme = useTheme();

  return (
    <AsciiElement>
      <View style={[styles.container, style]} {...props}>
        <Text style={[styles.title, { color: currentTheme.textPrimary }]}>
          {title}
        </Text>
        {subtitle && (
          <Text
            style={[styles.subtitle, { color: currentTheme.textSecondary }]}
          >
            {subtitle}
          </Text>
        )}
        {error && (
          <Text style={[styles.error, { color: currentTheme.danger }]}>
            {error}
          </Text>
        )}
        {actionLabel && onActionPress && (
          <Button variant='primary' size='md' onPress={onActionPress}>
            {actionLabel}
          </Button>
        )}
      </View>
    </AsciiElement>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  title: {
    color: theme.textPrimary,
    fontSize: 20,
    fontWeight: '600' as const,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    color: theme.textSecondary,
    fontSize: 16,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  error: {
    color: theme.dangerText,
    fontSize: 14,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
});
import { AsciiElement } from './ascii-skin';
