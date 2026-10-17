import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, body } from '../theme';

interface Milestone {
  id: string;
  label: string;
  completed: boolean;
  current?: boolean;
}

interface TimelineProps {
  milestones: Milestone[];
}

export function Timeline({ milestones }: TimelineProps) {
  return (
    <View style={styles.container}>
      {milestones.map((milestone, index) => (
        <View key={milestone.id} style={styles.milestone}>
          <View style={styles.markerContainer}>
            <View
              style={[
                styles.marker,
                milestone.completed && styles.markerCompleted,
                milestone.current && styles.markerCurrent,
              ]}
            />
            {index < milestones.length - 1 && <View style={styles.line} />}
          </View>
          <View style={styles.labelContainer}>
            <Text
              style={[
                styles.label,
                milestone.completed && styles.labelCompleted,
                milestone.current && styles.labelCurrent,
              ]}
            >
              {milestone.label}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 0,
  },
  milestone: {
    flexDirection: 'row',
    marginBottom: spacing.xl,
  },
  markerContainer: {
    alignItems: 'center',
    marginRight: spacing.md,
  },
  marker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.dark.surface,
    borderWidth: 2,
    borderColor: colors.dark.border,
    // @ts-ignore - borderCurve is iOS 13+ only
    borderCurve: 'continuous',
  },
  markerCompleted: {
    backgroundColor: colors.dark.success,
    borderColor: colors.dark.success,
  },
  markerCurrent: {
    backgroundColor: colors.dark.primary,
    borderColor: colors.dark.primary,
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: colors.dark.border,
    marginTop: spacing.sm,
  },
  labelContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  label: {
    ...body,
    color: colors.dark.textSecondary,
  },
  labelCompleted: {
    color: colors.dark.success,
  },
  labelCurrent: {
    color: colors.dark.primary,
  },
});
