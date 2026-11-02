import type { PropsWithChildren, ReactNode } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Copy } from '@/components/design';
import { useTheme } from '@/hooks/use-theme';
import { spacing, typography } from '@/theme/tokens';

// All seven Explore detail categories follow the approved Licee summary.
export function DetailHeading({
  title,
  subtitle,
  leading,
  children,
}: PropsWithChildren<{
  title: string;
  subtitle?: string;
  leading?: ReactNode;
}>) {
  const theme = useTheme();
  return (
    <View style={styles.summary}>
      {leading}
      <Copy
        kind='title'
        style={Platform.OS === 'android' && styles.androidTitle}
      >
        {title}
      </Copy>
      {!!subtitle && (
        <Copy style={{ color: theme.textSecondary }}>{subtitle}</Copy>
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  summary: { gap: spacing.sm },
  androidTitle: {
    fontSize: typography.heading.fontSize,
    lineHeight: typography.heading.lineHeight,
  },
});
