import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { colors, spacing, body, caption } from '../theme';
import { Card } from './Card';
import { Button } from './Button';

interface CourseCardProps {
  title: string;
  description: string;
  onStart?: () => void;
}

export function CourseCard({ title, description, onStart }: CourseCardProps) {
  return (
    <Card style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {onStart && <Button title="Începe" onPress={onStart} style={styles.button} />}
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  title: {
    ...body,
    color: colors.dark.textPrimary,
    marginBottom: spacing.sm,
  },
  description: {
    ...caption,
    color: colors.dark.textSecondary,
    marginBottom: spacing.lg,
    flexWrap: 'wrap',
  },
  button: {
    marginTop: spacing.sm,
  },
});
