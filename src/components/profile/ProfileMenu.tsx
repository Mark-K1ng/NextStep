/**
 * Profile menu component
 * Displays menu items for profile actions
 */

import React from 'react';
import { Text, StyleSheet, Pressable } from 'react-native';
import { colors, spacing, body } from '../../theme';
import { Card } from '../Card';

interface MenuItem {
  label: string;
  onPress: () => void;
}

interface ProfileMenuProps {
  items: MenuItem[];
}

export function ProfileMenu({ items }: ProfileMenuProps) {
  return (
    <Card style={styles.card}>
      {items.map((item, index) => (
        <Pressable
          key={index}
          style={[
            styles.menuItem,
            index < items.length - 1 && styles.menuItemBorder,
          ]}
          onPress={item.onPress}
        >
          <Text style={styles.menuText}>{item.label}</Text>
        </Pressable>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.lg,
  },
  menuItem: {
    paddingVertical: spacing.md,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.dark.border,
  },
  menuText: {
    ...body,
    color: colors.dark.textPrimary,
  },
});
