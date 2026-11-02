import { DecodingText as Text } from './decoding-text';
import { useTheme } from '@/hooks/use-theme';
import { View, ViewProps, Image, ImageProps, StyleSheet } from 'react-native';
import { Button } from './Button';
import { AsciiSkinOverlay, AsciiElement } from './ascii-skin';
import { spacing, theme } from '@/theme/tokens';

export type EmptyStateProps = ViewProps & {
  title: string;
  subtitle?: string;
  imageSource?: ImageProps['source'];
  actionLabel?: string;
  onActionPress?: () => void;
};

export const EmptyState = ({
  title,
  subtitle,
  imageSource,
  actionLabel,
  onActionPress,
  style,
  ...props
}: EmptyStateProps) => {
  const currentTheme = useTheme();

  return (
    <AsciiElement>
      <View style={[styles.container, style]} {...props}>
        {imageSource && (
          <View style={styles.image}>
            <Image
              source={imageSource}
              style={StyleSheet.absoluteFill}
              resizeMode='contain'
            />
            <AsciiSkinOverlay />
          </View>
        )}
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
        {actionLabel && onActionPress && (
          <Button variant='outline' size='md' onPress={onActionPress}>
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
  image: {
    width: 100,
    height: 100,
    marginBottom: spacing.md,
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
});
