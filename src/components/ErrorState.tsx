import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, heading, body } from '../theme';

interface ErrorStateProps {
  title: string;
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title,
  message,
  onRetry,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {message && <Text style={styles.message}>{message}</Text>}
      {onRetry && (
        <Text style={styles.retry} onPress={onRetry}>
          Încearcă din nou
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  title: {
    ...heading,
    color: colors.dark.danger,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  message: {
    ...body,
    color: colors.dark.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  retry: {
    ...body,
    color: colors.dark.primary,
    fontWeight: '600',
  },
});
