import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, StyleSheet, ScrollView, Text } from 'react-native';
import { router } from 'expo-router';
import { colors, spacing, body, caption } from '../../src/theme';
import { SearchBar } from '../../src/components/SearchBar';
import { CategoryPills } from '../../src/components/CategoryPills';
import { ListItem } from '../../src/components/ListItem';
import { fetchSchools } from '../../src/services/schools';
import { fetchUniversities } from '../../src/services/universities';
import { fetchCareers } from '../../src/services/careers';
import { fetchCourses } from '../../src/services/courses';
import { useUserProfile } from '../../src/hooks/useUserProfile';

const CATEGORIES = [
  { id: 'all', label: 'Toate' },
  { id: 'licee', label: 'Licee' },
  { id: 'facultati', label: 'Facultăți' },
  { id: 'cariere', label: 'Cariere' },
  { id: 'cursuri', label: 'Cursuri' },
];

export default function ExploreScreen() {
  useUserProfile();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [noDataForCounty, setNoDataForCounty] = useState(false);

  const loadItems = useCallback(async () => {
    try {
      setLoading(true);

      if (selectedCategory === 'all' || selectedCategory === 'licee') {
        const result = await fetchSchools();
        if (result.error) {
          console.error('Error fetching schools:', result.error);
          setItems([]);
        } else {
          setItems(result.data || []);
          setNoDataForCounty(!result.data || result.data.length === 0);
        }
      } else if (selectedCategory === 'facultati') {
        const result = await fetchUniversities();
        if (result.error) {
          console.error('Error fetching universities:', result.error);
          setItems([]);
        } else {
          setItems(result.data || []);
          setNoDataForCounty(!result.data || result.data.length === 0);
        }
      } else if (selectedCategory === 'cariere') {
        const result = await fetchCareers();
        if (result.error) {
          console.error('Error fetching careers:', result.error);
          setItems([]);
        } else {
          setItems(result.data || []);
          setNoDataForCounty(!result.data || result.data.length === 0);
        }
      } else if (selectedCategory === 'cursuri') {
        const result = await fetchCourses();
        if (result.error) {
          console.error('Error fetching courses:', result.error);
          setItems([]);
        } else {
          setItems(result.data || []);
          setNoDataForCounty(!result.data || result.data.length === 0);
        }
      }
    } catch (error) {
      console.error('Error loading items:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadItems();
  }, [loadItems]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      const name = (item.name || item.title || '').toLowerCase();
      const description = (item.description || '').toLowerCase();
      const city = (item.city || '').toLowerCase();
      const domain = (item.domain || '').toLowerCase();
      const provider = (item.provider || '').toLowerCase();
      
      return (
        name.includes(query) ||
        description.includes(query) ||
        city.includes(query) ||
        domain.includes(query) ||
        provider.includes(query)
      );
    });
  }, [items, searchQuery]);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push({
        pathname: '/search-results',
        params: { query: searchQuery },
      } as any);
    }
  };

  const handleItemPress = (itemId: string) => {
    router.push({
      pathname: '/detail',
      params: { id: itemId },
    } as any);
  };

  const getItemIcon = (category: string) => {
    switch (category) {
      case 'all':
      case 'licee':
        return 'School';
      case 'facultati':
        return 'GraduationCap';
      case 'cariere':
        return 'Briefcase';
      case 'cursuri':
        return 'BookOpen';
      default:
        return 'School';
    }
  };

  const getItemBadge = (category: string) => {
    switch (category) {
      case 'all':
      case 'licee':
        return 'Liceu';
      case 'facultati':
        return 'Facultate';
      case 'cariere':
        return 'Carieră';
      case 'cursuri':
        return 'Curs';
      default:
        return 'Liceu';
    }
  };

  const renderItem = (item: any) => {
    const icon = getItemIcon(selectedCategory);
    const badge = getItemBadge(selectedCategory);
    
    let description = '';
    if (item.description) {
      description = item.description;
    } else if (item.city) {
      description = `${item.city}${item.county ? ', ' + item.county : ''}`;
    } else if (item.provider) {
      description = item.provider;
    } else if (item.domain) {
      description = item.domain;
    }
    
    return (
      <ListItem
        key={item.id}
        icon={icon}
        title={item.name || item.title}
        description={description}
        badges={[badge]}
        onPress={() => handleItemPress(item.id)}
      />
    );
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

          {loading ? (
            <Text style={styles.loadingText}>Se încarcă...</Text>
          ) : noDataForCounty ? (
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataTitle}>Nicio dată disponibilă</Text>
              <Text style={styles.noDataText}>
                În acest moment, nu există date pentru această categorie. Vei fi notificat când datele vor fi disponibile.
              </Text>
            </View>
          ) : filteredItems.length === 0 ? (
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataTitle}>Niciun rezultat</Text>
              <Text style={styles.noDataText}>
                Nu s-au găsit rezultate pentru căutarea &quot;{searchQuery}&quot;.
              </Text>
            </View>
          ) : (
            filteredItems.map((item) => renderItem(item))
          )}
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
  loadingText: {
    ...body,
    color: colors.dark.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  noDataContainer: {
    padding: spacing.xl,
    backgroundColor: colors.dark.surface,
    borderRadius: 16,
    // @ts-ignore - borderCurve is iOS 13+ only
    borderCurve: 'continuous',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  noDataTitle: {
    ...body,
    color: colors.dark.textPrimary,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  noDataText: {
    ...caption,
    color: colors.dark.textSecondary,
    textAlign: 'center',
  },
});
