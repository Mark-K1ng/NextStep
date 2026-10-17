import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, spacing, radius, body } from '../theme';
import { Icon } from './Icon';

interface SettingsItemProps {
  icon: 'Settings' | 'User' | 'LogOut' | 'Trash2';
  label: string;
  onPress?: () => void;
  showChevron?: boolean;
  iconColor?: string;
  backgroundColor?: string;
  textColor?: string;
  squircle?: boolean;
  lastItem?: boolean;
}

export function SettingsItem({
  icon,
  label,
  onPress,
  showChevron = true,
  iconColor,
  backgroundColor,
  textColor,
  squircle = false,
  lastItem = false,
}: SettingsItemProps) {
  const containerStyle = [
    styles.container,
    backgroundColor && { backgroundColor },
    squircle && styles.squircle,
    (squircle || lastItem) && styles.noBorder,
  ];

  const labelStyle = [
    styles.label,
    textColor && { color: textColor },
  ];

  return (
    <Pressable style={containerStyle} onPress={onPress}>
      <View style={styles.icon}><Icon name={icon} size={24} color={iconColor || colors.dark.primary} /></View>
      <Text style={labelStyle}>{label}</Text>
      {showChevron && <Icon name="ChevronRight" size={20} color={colors.dark.textSecondary} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.dark.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.dark.border,
    // @ts-ignore - borderCurve is iOS 13+ only
    borderCurve: 'continuous',
  },
  squircle: {
    borderRadius: radius.md,
    marginBottom: spacing.sm,
  },
  noBorder: {
    borderBottomWidth: 0,
  },
  icon: {
    marginRight: spacing.md,
  },
  label: {
    ...body,
    color: colors.dark.textPrimary,
    flex: 1,
  },
});
