import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { colors, spacing } from '../../src/theme';
import { SkillComparison } from '../../src/components/SkillComparison';
import { SectionHeader } from '../../src/components/SectionHeader';

const CURRENT_SKILLS = [
  { id: '1', name: 'JavaScript', status: 'current' as const },
  { id: '2', name: 'HTML/CSS', status: 'current' as const },
  { id: '3', name: 'React', status: 'current' as const },
  { id: '4', name: 'TypeScript', status: 'current' as const },
];

const REQUIRED_SKILLS = [
  { id: '1', name: 'JavaScript', status: 'current' as const },
  { id: '2', name: 'HTML/CSS', status: 'current' as const },
  { id: '3', name: 'React', status: 'current' as const },
  { id: '4', name: 'TypeScript', status: 'current' as const },
  { id: '5', name: 'Node.js', status: 'missing' as const },
  { id: '6', name: 'Python', status: 'missing' as const },
  { id: '7', name: 'SQL', status: 'missing' as const },
  { id: '8', name: 'Git', status: 'current' as const },
];

export default function GapAnalysisScreen() {
  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <SectionHeader
          title="Analiză de lacune"
          subtitle="Software Engineer"
        />
        <SkillComparison
          currentSkills={CURRENT_SKILLS}
          requiredSkills={REQUIRED_SKILLS}
          progress={50}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.xl,
  },
});
