import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Text } from 'react-native';
import { router } from 'expo-router';
import { colors, spacing, body } from '../../src/theme';
import { Timeline } from '../../src/components/Timeline';
import { SectionHeader } from '../../src/components/SectionHeader';
import { useUserProfile } from '../../src/hooks/useUserProfile';

export default function PathScreen() {
  const { profile } = useUserProfile();
  const [milestones, setMilestones] = useState<any[]>([]);
  const [careerGoal, setCareerGoal] = useState<string>('');

  const suggestCareer = (interests: string[], subjects: string[]): string => {
    // Simple rule-based career suggestion
    if (interests.includes('Tehnologie') || subjects.includes('Informatică')) {
      return 'Software Engineer';
    }
    if (interests.includes('Medicină') || subjects.includes('Biologie')) {
      return 'Doctor';
    }
    if (interests.includes('Drept') || subjects.includes('Istorie')) {
      return 'Avocat';
    }
    if (interests.includes('Business') || subjects.includes('Economie')) {
      return 'Manager de Proiect';
    }
    if (interests.includes('Artă') || subjects.includes('Geografie')) {
      return 'Arhitect';
    }
    return 'Specialist în domeniul ales';
  };

  const generatePath = useCallback(() => {
    if (!profile) return;

    const currentGrade = profile.grade_level;
    const interests = profile.interests;
    const subjects = profile.favorite_subjects;

    // Generate milestones based on current grade
    const newMilestones: any[] = [];

    // Current status
    if (currentGrade === 'student') {
      newMilestones.push({
        id: '1',
        label: 'Universitate',
        completed: true,
        current: true,
      });
    } else if (currentGrade === 'XII') {
      newMilestones.push({
        id: '1',
        label: 'Clasa a XII-a',
        completed: true,
        current: true,
      });
      newMilestones.push({
        id: '2',
        label: 'Bacalaureat',
        completed: false,
        current: false,
      });
    } else {
      // V - XI
      newMilestones.push({
        id: '1',
        label: `Clasa ${currentGrade}`,
        completed: true,
        current: true,
      });
      newMilestones.push({
        id: '2',
        label: 'Admitere la liceu',
        completed: false,
        current: false,
      });
      newMilestones.push({
        id: '3',
        label: 'Bacalaureat',
        completed: false,
        current: false,
      });
    }

    // University
    newMilestones.push({
      id: '4',
      label: 'Facultate',
      completed: false,
      current: false,
    });

    // Career
    const suggestedCareer = suggestCareer(interests, subjects);
    setCareerGoal(suggestedCareer);
    newMilestones.push({
      id: '5',
      label: suggestedCareer,
      completed: false,
      current: false,
    });

    setMilestones(newMilestones);
  }, [profile]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    generatePath();
  }, [generatePath]);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <SectionHeader
          title="Traseul meu"
          subtitle={careerGoal ? `Calea ta către ${careerGoal}` : 'Calea ta către cariera dorită'}
          action="Vezi diferențele"
          onActionPress={() => router.push('/gap-analysis')}
        />
        {milestones.length > 0 ? (
          <Timeline milestones={milestones} />
        ) : (
          <Text style={styles.noDataText}>
            Pentru a vedea traseul tău, completează profilul cu clasa și interesele tale.
          </Text>
        )}
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
  noDataText: {
    ...body,
    color: colors.dark.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
