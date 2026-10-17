import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, spacing, radius, caption } from '../theme';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}

export const Chip: React.FC<ChipProps> = ({
  label,
  selected = false,
  onPress,
}) => {
  const chipStyle = [
    styles.chip,
    selected && styles.chipSelected,
  ];

  const textStyle = [
    styles.text,
    selected && styles.textSelected,
  ];

  const content = (
    <View style={chipStyle}>
      <Text style={textStyle}>{label}</Text>
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress}>
        {content}
      </Pressable>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  chip: {
    backgroundColor: colors.dark.surfaceElevated,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  chipSelected: {
    backgroundColor: colors.dark.primary,
    borderColor: colors.dark.primary,
  },
  text: {
    ...caption,
    color: colors.dark.textSecondary,
  },
  textSelected: {
    color: '#FFFFFF',
  },
});
