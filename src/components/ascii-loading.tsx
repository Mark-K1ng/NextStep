import {
  AsciiProvider,
  AsciiSkeleton,
  type AsciiSkeletonProps,
} from '@nextstep/ascii-reveal-native';
import { StyleSheet, View } from 'react-native';
import type { PropsWithChildren } from 'react';
import { useTheme } from '@/hooks/use-theme';
import { useMotionPreference } from '@/providers/motion';
import { ro } from '@/i18n/ro';

export function AsciiLoadingProvider({ children }: PropsWithChildren) {
  const theme = useTheme();
  const reducedMotion = useMotionPreference();
  return (
    <AsciiProvider
      reducedMotion={reducedMotion}
      theme={{
        foreground: theme.textSecondary,
        accent: theme.accentText,
        background: theme.surface,
      }}
    >
      {children}
    </AsciiProvider>
  );
}
export function AsciiLoading({
  compact = false,
  color,
  decorative = false,
  layout = 'lines',
  width,
  height,
}: {
  compact?: boolean;
  color?: string;
  decorative?: boolean;
  layout?: 'lines' | 'card';
  width?: AsciiSkeletonProps['width'];
  height?: number;
}) {
  if (!compact && layout === 'card') {
    return <AsciiCardPlaceholder color={color} decorative={decorative} />;
  }
  return (
    <AsciiSkeleton
      variant='dither'
      lines={compact ? 1 : 3}
      width={width ?? (compact ? 64 : '100%')}
      height={height ?? (compact ? 16 : 64)}
      rows={height ? Math.ceil(height / 10) : undefined}
      fontSize={10}
      color={color}
      accessibilityLabel={ro.common.loading}
      decorative={decorative}
    />
  );
}

/** Content geometry uses the same dense blocks and thin bars as the reference. */
export function AsciiCardPlaceholder({
  color,
  decorative = false,
}: {
  color?: string;
  decorative?: boolean;
}) {
  const sk = (props: React.ComponentProps<typeof AsciiSkeleton>) => (
    <AsciiSkeleton
      variant='dither'
      fontSize={10}
      decorative
      color={color}
      {...props}
    />
  );
  return (
    <View
      accessible={!decorative}
      accessibilityRole={decorative ? undefined : 'progressbar'}
      accessibilityLabel={decorative ? undefined : ro.common.loading}
      accessibilityState={decorative ? undefined : { busy: true }}
      importantForAccessibility={decorative ? 'no-hide-descendants' : 'yes'}
      style={styles.card}
    >
      <View style={styles.header}>
        {sk({ circle: true, rows: 5, width: 48, height: 48, seed: 41 })}
        <View style={styles.identity}>
          {sk({ lines: 2, widths: [0.66, 0.86], seed: 4 })}
        </View>
      </View>
      {sk({ rows: 12, height: 120, seed: 71 })}
      {sk({ lines: 2, widths: [0.94, 0.64], seed: 12 })}
      <View style={styles.footer}>
        {sk({ rows: 3, width: '45%', height: 30, seed: 5 })}
        {sk({ rows: 3, width: '45%', height: 30, seed: 8 })}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  card: { gap: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  identity: { flex: 1 },
  footer: { flexDirection: 'row', justifyContent: 'space-between' },
});
