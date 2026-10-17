import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, radius, body } from '../theme';

type ToastVariant = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  message: string;
  variant?: ToastVariant;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  variant = 'info',
}) => {
  const getBackgroundColor = () => {
    switch (variant) {
      case 'success':
        return colors.dark.success;
      case 'error':
        return colors.dark.danger;
      case 'warning':
        return colors.dark.warning;
      default:
        return colors.dark.primary;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: getBackgroundColor() }]}>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  message: {
    ...body,
    color: '#FFFFFF',
    fontWeight: '500',
  },
});
