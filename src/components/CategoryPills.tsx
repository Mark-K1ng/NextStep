import React from 'react';
import { Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { colors, spacing, caption } from '../theme';

interface Category {
  id: string;
  label: string;
}

interface CategoryPillsProps {
  categories: Category[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export function CategoryPills({ categories, selectedId, onSelect }: CategoryPillsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {categories.map((category) => (
        <Pressable
          key={category.id}
          style={[styles.pill, selectedId === category.id && styles.pillSelected]}
          onPress={() => onSelect(category.id)}
        >
          <Text style={[styles.pillLabel, selectedId === category.id && styles.pillLabelSelected]}>
            {category.label}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 0,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  pill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.dark.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.dark.border,
    // @ts-ignore - borderCurve is iOS 13+ only
    borderCurve: 'continuous',
  },
  pillSelected: {
    backgroundColor: colors.dark.primary,
    borderColor: colors.dark.primary,
  },
  pillLabel: {
    ...caption,
    color: colors.dark.textSecondary,
  },
  pillLabelSelected: {
    color: '#FFFFFF',
  },
});
