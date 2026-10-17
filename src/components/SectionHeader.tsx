import React from 'react';
import { View, Text, StyleSheet, ViewStyle, Pressable } from 'react-native';
import { colors, spacing, body, caption } from '../theme';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: string;
  onActionPress?: () => void;
  style?: ViewStyle;
}

export function SectionHeader({ title, subtitle, action, onActionPress, style }: SectionHeaderProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      {action && onActionPress && (
        <Pressable onPress={onActionPress}>
          <Text style={styles.action}>{action}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    ...body,
    color: colors.dark.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...caption,
    color: colors.dark.textSecondary,
  },
  action: {
    ...body,
    color: colors.dark.primary,
    fontWeight: '600',
  },
});
