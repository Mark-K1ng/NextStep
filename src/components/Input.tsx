import React from 'react';
import { TextInput, View, Text, StyleSheet, TextInputProps, ViewStyle } from 'react-native';
import { colors, spacing, radius, label, body, caption } from '../theme';

type InputVariant = 'default' | 'error';

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  variant?: InputVariant;
  style?: ViewStyle;
  textAlign?: 'left' | 'center' | 'right';
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  variant = 'default',
  style,
  textAlign,
  ...props
}) => {
  const getBorderColor = () => {
    if (variant === 'error' || error) return colors.dark.danger;
    return colors.dark.border;
  };

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[
          styles.input,
          {
            borderColor: getBorderColor(),
            textAlign: textAlign || 'left',
          },
        ]}
        placeholderTextColor={colors.dark.textSecondary}
        {...props}
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    ...label,
    color: colors.dark.textSecondary,
    marginBottom: spacing.xs,
  },
  input: {
    ...body,
    backgroundColor: colors.dark.surface,
    color: colors.dark.textPrimary,
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 44,
    textAlign: 'left' as const,
  },
  error: {
    ...caption,
    color: colors.dark.danger,
    marginTop: spacing.xs,
  },
});
