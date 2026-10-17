import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Text } from 'react-native';
import { colors, spacing, body } from '../../src/theme';
import { SkillComparison } from '../../src/components/SkillComparison';
import { SectionHeader } from '../../src/components/SectionHeader';
import { useUserProfile } from '../../src/hooks/useUserProfile';
import { supabase } from '../../src/lib';

interface Skill {
  id: string;
  name: string;
  status: 'current' | 'missing';
}

export default function GapAnalysisScreen() {
  const { profile } = useUserProfile();
  const [currentSkills, setCurrentSkills] = useState<Skill[]>([]);
  const [requiredSkills, setRequiredSkills] = useState<Skill[]>([]);
  const [careerName, setCareerName] = useState('');
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  const suggestCareer = (interests: string[], subjects: string[]): string => {
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
    return 'Specialist';
  };

  const loadGapAnalysis = useCallback(async () => {
    try {
      setLoading(true);
      if (!profile) {
        setLoading(false);
        return;
      }

      // Determine career based on interests/subjects
      const career = suggestCareer(profile.interests, profile.favorite_subjects);
      setCareerName(career);

      // Fetch career skills from database
      const careerResult = await supabase?.from('careers')
        .select('id')
        .ilike('name', `%${career}%`)
        .single();

      if (careerResult?.data && supabase) {
        const { data: careerSkills } = await supabase
          .from('career_skills')
          .select('skill_id, importance')
          .eq('career_id', careerResult.data.id);

        if (careerSkills) {
          const skillIds = careerSkills.map(cs => cs.skill_id);
          const { data: skills } = await supabase
            .from('skills')
            .select('id, name')
            .in('id', skillIds);

          if (skills) {
            // Fetch user's current skills
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              const { data: userSkills } = await supabase
                .from('user_skills')
                .select('skill_id')
                .eq('user_id', user.id);

              const userSkillIds = userSkills?.map(us => us.skill_id) || [];

              // Build required skills list
              const required: Skill[] = skills.map(skill => ({
                id: skill.id,
                name: skill.name,
                status: userSkillIds.includes(skill.id) ? 'current' : 'missing',
              }));

              // Build current skills list
              const current: Skill[] = skills
                .filter(skill => userSkillIds.includes(skill.id))
                .map(skill => ({
                  id: skill.id,
                  name: skill.name,
                  status: 'current',
                }));

              setRequiredSkills(required);
              setCurrentSkills(current);

              // Calculate progress
              const percentage = Math.round((current.length / required.length) * 100);
              setProgress(percentage);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error loading gap analysis:', error);
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadGapAnalysis();
  }, [loadGapAnalysis]);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Se încarcă...</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.container}>
        <Text style={styles.noDataText}>
          Pentru a vedea analiza de lacune, completează profilul cu interesele și materiile tale.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <SectionHeader
          title="Analiză de lacune"
          subtitle={careerName}
        />
        {requiredSkills.length > 0 ? (
          <SkillComparison
            currentSkills={currentSkills}
            requiredSkills={requiredSkills}
            progress={progress}
          />
        ) : (
          <Text style={styles.noDataText}>
            Nu există date disponibile pentru această carieră.
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
    padding: spacing.xl,
  },
  loadingText: {
    ...body,
    color: colors.dark.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  noDataText: {
    ...body,
    color: colors.dark.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
