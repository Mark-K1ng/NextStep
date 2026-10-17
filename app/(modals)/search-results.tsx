import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, spacing } from '../../src/theme';
import { SearchBar } from '../../src/components/SearchBar';
import { CategoryPills } from '../../src/components/CategoryPills';
import { ListItem } from '../../src/components/ListItem';
import { SectionHeader } from '../../src/components/SectionHeader';

const CATEGORIES = [
  { id: 'all', label: 'Toate' },
  { id: 'licee', label: 'Licee' },
  { id: 'facultati', label: 'Facultăți' },
  { id: 'cariere', label: 'Cariere' },
  { id: 'cursuri', label: 'Cursuri' },
];

const SEARCH_RESULTS = [
  { id: '1', icon: 'School' as const, title: 'Colegiul Național I.L. Caragiale', description: 'București, profil matematică-informatică', badges: ['Liceu', 'Matematică'] },
  { id: '2', icon: 'School' as const, title: 'Colegiul Național Gheorghe Șincai', description: 'București, profil real', badges: ['Liceu', 'Științe'] },
  { id: '3', icon: 'GraduationCap' as const, title: 'Universitatea București', description: 'Facultatea de Matematică și Informatică', badges: ['Facultate', 'Informatică'] },
  { id: '4', icon: 'GraduationCap' as const, title: 'Universitatea Politehnica', description: 'Facultatea de Automatică și Calculatoare', badges: ['Facultate', 'Inginerie'] },
  { id: '5', icon: 'Briefcase' as const, title: 'Software Engineer', description: 'Dezvoltare software full-stack', badges: ['Carieră', 'IT'] },
  { id: '6', icon: 'Briefcase' as const, title: 'Data Scientist', description: 'Analiză de date și machine learning', badges: ['Carieră', 'Date'] },
];

export default function SearchResultsScreen() {
  const params = useLocalSearchParams();
  const [query, setQuery] = useState((params.query as string) || '');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const handleItemPress = (itemId: string) => {
    router.push('/detail');
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <SearchBar
          placeholder="Caută licee, facultăți, cariere..."
          value={query}
          onChangeText={setQuery}
        />

        <CategoryPills
          categories={CATEGORIES}
          selectedId={selectedCategory}
          onSelect={setSelectedCategory}
        />

        <SectionHeader
          title={`${SEARCH_RESULTS.length} rezultate`}
          style={styles.headerSpacing}
        />

        {SEARCH_RESULTS.map((item) => (
          <ListItem
            key={item.id}
            icon={item.icon as any}
            title={item.title}
            description={item.description}
            badges={item.badges}
            onPress={() => handleItemPress(item.id)}
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
    padding: spacing.xl,
  },
  headerSpacing: {
    marginTop: spacing.lg,
  },
});
