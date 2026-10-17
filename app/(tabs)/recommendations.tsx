import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Text } from 'react-native';
import { colors, spacing, body } from '../../src/theme';
import { CourseCard } from '../../src/components/CourseCard';
import { SectionHeader } from '../../src/components/SectionHeader';
import { Course } from '../../src/types';
import { supabase } from '../../src/lib';

export default function RecommendationsScreen() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRecommendations = async () => {
    try {
      setLoading(true);

      // Fetch courses from database
      const result = await supabase?.from('courses')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (result) {
        if (result.error) {
          console.error('Error fetching courses:', result.error);
        } else {
          setCourses(result.data || []);
        }
      }
    } catch (error) {
      console.error('Error loading recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadRecommendations();
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Se încarcă...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <SectionHeader
          title="Recomandări"
          subtitle="Cursuri pentru abilitățile tale"
        />
        {courses.length > 0 ? (
          courses.map((course) => (
            <CourseCard
              key={course.id}
              title={course.title}
              description={`${course.provider} • ${course.level || 'Toate nivelele'}`}
              onStart={() => {}}
            />
          ))
        ) : (
          <Text style={styles.noDataText}>
            Nu există cursuri disponibile momentan.
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
