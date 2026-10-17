import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing, radius, body, caption } from '../theme';
import { Icon } from './Icon';

interface Skill {
  id: string;
  name: string;
  status: 'current' | 'required' | 'missing';
}

interface SkillComparisonProps {
  currentSkills: Skill[];
  requiredSkills: Skill[];
  progress?: number;
  style?: ViewStyle;
}

export function SkillComparison({ currentSkills, requiredSkills, progress = 0, style }: SkillComparisonProps) {
  return (
    <View style={[styles.container, style]}>
      {progress > 0 && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` } as any]} />
          </View>
          <Text style={styles.progressText}>{progress}% completat</Text>
        </View>
      )}

      <View style={styles.columns}>
        <View style={styles.column}>
          <Text style={styles.columnHeader}>Abilități actuale</Text>
          {currentSkills.map((skill) => (
            <View key={skill.id} style={styles.skillItem}>
              <Icon name="Check" size={16} color={colors.dark.success} />
              <Text style={styles.skillText}>{skill.name}</Text>
            </View>
          ))}
        </View>

        <View style={styles.column}>
          <Text style={styles.columnHeader}>Abilități necesare</Text>
          {requiredSkills.map((skill) => (
            <View key={skill.id} style={styles.skillItem}>
              {skill.status === 'current' ? (
                <Icon name="Check" size={16} color={colors.dark.success} />
              ) : skill.status === 'missing' ? (
                <Icon name="X" size={16} color={colors.dark.danger} />
              ) : (
                <View style={styles.dot} />
              )}
              <Text style={styles.skillText}>{skill.name}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
  },
  progressContainer: {
    marginBottom: spacing.lg,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.dark.surface,
    borderRadius: radius.sm,
    overflow: 'hidden',
    marginBottom: spacing.xs,
    // @ts-ignore - borderCurve is iOS 13+ only
    borderCurve: 'continuous',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.dark.primary,
  },
  progressText: {
    ...caption,
    color: colors.dark.textSecondary,
    textAlign: 'center',
  },
  columns: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  column: {
    flex: 1,
  },
  columnHeader: {
    ...body,
    color: colors.dark.textPrimary,
    marginBottom: spacing.md,
    fontWeight: '600',
  },
  skillItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  skillText: {
    ...caption,
    color: colors.dark.textSecondary,
    marginLeft: spacing.sm,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: radius.sm,
    backgroundColor: colors.dark.border,
    // @ts-ignore - borderCurve is iOS 13+ only
    borderCurve: 'continuous',
  },
});
