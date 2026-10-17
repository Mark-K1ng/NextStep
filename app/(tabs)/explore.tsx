import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { colors, spacing } from '../../src/theme';
import { SearchBar } from '../../src/components/SearchBar';
import { CategoryPills } from '../../src/components/CategoryPills';
import { ListItem } from '../../src/components/ListItem';

const CATEGORIES = [
  { id: 'all', label: 'Toate' },
  { id: 'licee', label: 'Licee' },
  { id: 'facultati', label: 'Facultăți' },
  { id: 'cariere', label: 'Cariere' },
  { id: 'cursuri', label: 'Cursuri' },
];

const SAMPLE_ITEMS = [
  { id: '1', icon: 'School' as const, title: 'Colegiul Național I.L. Caragiale', description: 'București, profil matematică-informatică', badges: ['Liceu'] },
  { id: '2', icon: 'GraduationCap' as const, title: 'Universitatea Politehnica', description: 'Facultatea de Automatică și Calculatoare', badges: ['Facultate'] },
  { id: '3', icon: 'Briefcase' as const, title: 'Software Engineer', description: 'Dezvoltare software full-stack', badges: ['Carieră'] },
  { id: '4', icon: 'BookOpen' as const, title: 'JavaScript pentru începători', description: 'Curs introductiv de programare', badges: ['Curs'] },
];

export default function ExploreScreen() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push({
        pathname: '/search-results',
        params: { query: searchQuery },
      } as any);
    }
  };

  const handleItemPress = (itemId: string) => {
    router.push('/detail');
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <SearchBar
            placeholder="Caută licee, facultăți, cariere..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
          />

          <CategoryPills
            categories={CATEGORIES}
            selectedId={selectedCategory}
            onSelect={setSelectedCategory}
          />

          {SAMPLE_ITEMS.map((item) => (
            <ListItem
              key={item.id}
              icon={item.icon as any}
              title={item.title}
              description={item.description}
              badges={item.badges}
              onPress={() => handleItemPress(item.id)}
            />
          ))}
        </View>
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
