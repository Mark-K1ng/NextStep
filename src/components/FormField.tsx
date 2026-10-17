import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing, caption } from '../theme';

interface FormFieldProps {
  label: string;
  children: React.ReactNode;
  error?: string;
  style?: ViewStyle;
}

export function FormField({ label, children, error, style }: FormFieldProps) {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.label}>{label}</Text>
      {children}
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  label: {
    ...caption,
    color: colors.dark.textSecondary,
    marginBottom: spacing.xs,
  },
  error: {
    ...caption,
    color: colors.dark.danger,
    marginTop: spacing.xs,
  },
});
