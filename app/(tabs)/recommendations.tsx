import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { colors, spacing } from '../../src/theme';
import { CourseCard } from '../../src/components/CourseCard';
import { SectionHeader } from '../../src/components/SectionHeader';

const COURSES = [
  {
    id: '1',
    title: 'JavaScript pentru începători',
    description: 'Învață bazele JavaScript și începe să construiești aplicații web interactive.',
  },
  {
    id: '2',
    title: 'React Native - De la zero la expert',
    description: 'Construiește aplicații mobile pentru iOS și Android folosind React Native.',
  },
  {
    id: '3',
    title: 'Algoritmi și structuri de date',
    description: 'Îmbunătățește-ți abilitățile de programare cu algoritmi fundamentali.',
  },
  {
    id: '4',
    title: 'TypeScript pentru JavaScript',
    description: 'Adaugă tipuri statice codului tău JavaScript pentru o mai bună calitate.',
  },
];

export default function RecommendationsScreen() {
  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <SectionHeader
          title="Recomandări"
          subtitle="Cursuri pentru abilitățile tale"
        />
        {COURSES.map((course) => (
          <CourseCard
            key={course.id}
            title={course.title}
            description={course.description}
            onStart={() => {}}
          />
        ))}
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
