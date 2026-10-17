import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { colors, spacing, radius, body } from '../theme';

interface CheckboxOption {
  id: string;
  label: string;
  checked: boolean;
}

interface CheckboxGroupProps {
  label: string;
  options: CheckboxOption[];
  onToggle: (id: string) => void;
  columns?: number;
}

export function CheckboxGroup({ label, options, onToggle, columns = 2 }: CheckboxGroupProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <ScrollView
        horizontal={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.grid}
      >
        {options.map((option) => (
          <Pressable
            key={option.id}
            style={[styles.checkboxItem, option.checked && styles.checkboxItemChecked]}
            onPress={() => onToggle(option.id)}
          >
            <View style={[styles.checkbox, option.checked && styles.checkboxChecked]} />
            <Text style={[styles.checkboxLabel, option.checked && styles.checkboxLabelChecked]}>
              {option.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  label: {
    ...body,
    color: colors.dark.textSecondary,
    marginBottom: spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  checkboxItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    backgroundColor: colors.dark.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.dark.border,
    flex: 1,
    minWidth: '45%',
    // @ts-ignore - borderCurve is iOS 13+ only
    borderCurve: 'continuous',
  },
  checkboxItemChecked: {
    backgroundColor: colors.dark.surface,
    borderColor: colors.dark.primary,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.dark.border,
    marginRight: spacing.sm,
    // @ts-ignore - borderCurve is iOS 13+ only
    borderCurve: 'continuous',
  },
  checkboxChecked: {
    backgroundColor: colors.dark.primary,
    borderColor: colors.dark.primary,
  },
  checkboxLabel: {
    ...body,
    color: colors.dark.textPrimary,
    flex: 1,
  },
  checkboxLabelChecked: {
    color: colors.dark.primary,
  },
});
