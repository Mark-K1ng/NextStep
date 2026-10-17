/**
 * Profile header component
 * Displays user information
 */

import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { colors, spacing, heading, body } from '../../theme';
import { Card } from '../Card';

interface ProfileHeaderProps {
  email?: string;
  displayName?: string;
}

export function ProfileHeader({ email, displayName }: ProfileHeaderProps) {
  return (
    <Card style={styles.card}>
      <Text style={styles.cardTitle}>Utilizator</Text>
      <Text style={styles.cardText}>{displayName || email || 'nume@exemplu.com'}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.lg,
  },
  cardTitle: {
    ...heading,
    color: colors.dark.textPrimary,
    marginBottom: spacing.md,
  },
  cardText: {
    ...body,
    color: colors.dark.textSecondary,
  },
});
