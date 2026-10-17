import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { colors, spacing, radius, body } from '../theme';
import { Icon } from './Icon';

interface SearchBarProps {
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  onSubmitEditing?: () => void;
}

export function SearchBar({ placeholder = 'Caută...', value, onChangeText, onSubmitEditing }: SearchBarProps) {
  return (
    <View style={styles.container}>
      <View style={styles.icon}><Icon name="Search" size={20} color={colors.dark.textSecondary} /></View>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={colors.dark.textSecondary}
        value={value}
        onChangeText={onChangeText}
        returnKeyType="search"
        onSubmitEditing={onSubmitEditing}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dark.surface,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.lg,
    // @ts-ignore - borderCurve is iOS 13+ only
    borderCurve: 'continuous',
  },
  icon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    ...body,
    color: colors.dark.textPrimary,
  },
});
