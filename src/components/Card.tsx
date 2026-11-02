import { View, ViewProps, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { radius, spacing } from '@/theme/tokens';

export type CardProps = ViewProps & {
  elevated?: boolean;
  fullBleed?: boolean;
};

export const Card = ({
  elevated = false,
  fullBleed = false,
  style,
  children,
  ...props
}: CardProps) => {
  const theme = useTheme();

  const containerStyles: ViewStyle = {
    backgroundColor: elevated ? theme.surfaceElevated : theme.surface,
    borderRadius: radius.md,
    borderCurve: 'continuous',
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: theme.border,
    overflow: 'hidden',
    ...(elevated && {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    }),
    ...(fullBleed && { borderRadius: 0 }),
  };

  return (
    <View style={[containerStyles, style]} {...props}>
      {children}
    </View>
  );
};
