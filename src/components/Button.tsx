import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors, spacing, radius, body } from '../theme';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  style?: ViewStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  style,
}) => {
  const getBackgroundColor = () => {
    if (disabled) return colors.dark.border;
    if (variant === 'primary') return colors.dark.primary;
    if (variant === 'secondary') return colors.dark.surfaceElevated;
    if (variant === 'danger') return 'transparent';
    return 'transparent';
  };

  const getTextColor = () => {
    if (disabled) return colors.dark.textSecondary;
    if (variant === 'primary') return '#FFFFFF';
    if (variant === 'danger') return colors.dark.danger;
    return colors.dark.textPrimary;
  };

  const getBorderColor = () => {
    if (variant === 'outline') return colors.dark.border;
    if (variant === 'danger') return colors.dark.danger;
    return 'transparent';
  };

  const getBorderWidth = () => {
    if (variant === 'outline' || variant === 'danger') return 1;
    return 0;
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
          borderWidth: getBorderWidth(),
          opacity: pressed && !disabled ? 0.8 : 1,
        },
        style,
      ]}
    >
      <Text style={[styles.text, { color: getTextColor() }]}>{title}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.md,
    borderWidth: 1,
    minHeight: 44,
  },
  text: {
    ...body,
    fontWeight: '600',
  },
});
