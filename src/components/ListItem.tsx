import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, spacing, radius, body, caption } from '../theme';
import { Icon } from './Icon';

interface ListItemProps {
  icon: string;
  title: string;
  description?: string;
  badges?: string[];
  onPress?: () => void;
  showChevron?: boolean;
}

export function ListItem({ icon, title, description, badges, onPress, showChevron = true }: ListItemProps) {
  return (
    <Pressable style={styles.container} onPress={onPress}>
      <View style={styles.icon}><Icon name={icon} size={24} color={colors.dark.primary} /></View>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        {description && <Text style={styles.description}>{description}</Text>}
        {badges && badges.length > 0 && (
          <View style={styles.badges}>
            {badges.map((badge, index) => (
              <View key={index} style={styles.badge}>
                <Text style={styles.badgeText}>{badge}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
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
    borderRadius: radius.lg,
    marginBottom: spacing.sm,
    // @ts-ignore - borderCurve is iOS 13+ only
    borderCurve: 'continuous',
  },
  icon: {
    marginRight: spacing.md,
  },
  content: {
    flex: 1,
  },
  title: {
    ...body,
    color: colors.dark.textPrimary,
    marginBottom: spacing.xs,
    flexWrap: 'wrap',
  },
  description: {
    ...caption,
    color: colors.dark.textSecondary,
    flexWrap: 'wrap',
  },
  badges: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    backgroundColor: colors.dark.surfaceElevated,
    borderRadius: radius.sm,
    // @ts-ignore - borderCurve is iOS 13+ only
    borderCurve: 'continuous',
  },
  badgeText: {
    ...caption,
    color: colors.dark.textSecondary,
  },
});
