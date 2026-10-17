import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { colors, spacing } from '../../src/theme';
import { Timeline } from '../../src/components/Timeline';
import { SectionHeader } from '../../src/components/SectionHeader';

const MILESTONES = [
  { id: '1', label: 'Liceu (Colegiul I.L. Caragiale)', completed: true, current: false },
  { id: '2', label: 'Bacalaureat', completed: true, current: false },
  { id: '3', label: 'Facultate (Politehnica)', completed: false, current: true },
  { id: '4', label: 'Licență', completed: false, current: false },
  { id: '5', label: 'Primul job', completed: false, current: false },
  { id: '6', label: 'Software Engineer Senior', completed: false, current: false },
];

export default function PathScreen() {
  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <SectionHeader
          title="Traseul meu"
          subtitle="Calea ta către Software Engineer"
          action="Vezi diferențele"
          onActionPress={() => router.push('/gap-analysis')}
        />
        <Timeline milestones={MILESTONES} />
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
    padding: spacing.lg,
  },
});
