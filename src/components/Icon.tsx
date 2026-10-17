import React from 'react';
import { View, StyleSheet } from 'react-native';
import * as LucideIcons from 'lucide-react-native';
import { colors } from '../theme';

interface IconProps {
  name: keyof typeof LucideIcons;
  size?: number;
  color?: string;
}

export const Icon: React.FC<IconProps> = ({
  name,
  size = 24,
  color = colors.dark.textPrimary,
}) => {
  const LucideIcon = LucideIcons[name];

  if (!LucideIcon) {
    return null;
  }

  return (
    <View style={styles.container}>
      <LucideIcon size={size} color={color} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
