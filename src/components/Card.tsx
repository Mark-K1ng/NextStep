import React from 'react';
import { View, StyleSheet, ViewStyle, Pressable } from 'react-native';
import { colors, spacing, radius } from '../theme';
import { Icon } from './Icon';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  elevated?: boolean;
  showChevron?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  onPress,
  elevated = false,
  showChevron = false,
}) => {
  const cardStyle = [
    styles.card,
    elevated && styles.cardElevated,
    style,
  ];

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [cardStyle, { opacity: pressed ? 0.8 : 1 }]}>
        {children}
        {showChevron && <View style={styles.chevron}><Icon name="ChevronRight" size={20} color={colors.dark.textSecondary} /></View>}
      </Pressable>
    );
  }

  return <View style={cardStyle}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.dark.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.dark.border,
    // @ts-ignore - borderCurve is iOS 13+ only
    borderCurve: 'continuous',
  },
  cardElevated: {
    backgroundColor: colors.dark.surfaceElevated,
  },
  chevron: {
    position: 'absolute',
    right: spacing.lg,
    top: '50%',
    marginTop: -10,
  },
});
