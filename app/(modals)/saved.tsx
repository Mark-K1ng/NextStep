import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Text } from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { colors, spacing, body, title, caption } from '../../src/theme';
import { ListItem } from '../../src/components/ListItem';
import { SectionHeader } from '../../src/components/SectionHeader';
import { Icon } from '../../src/components/Icon';
import { supabase } from '../../src/lib';
import { fetchSchool } from '../../src/services/schools';
import { fetchUniversity } from '../../src/services/universities';
import { fetchCareer } from '../../src/services/careers';
import { fetchCourse } from '../../src/services/courses';

export default function SavedScreen() {
  const [savedItems, setSavedItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSavedItems = async () => {
    try {
      setLoading(true);
      const authResponse = await supabase?.auth.getUser();
      const user = authResponse?.data?.user;

      if (!user || !supabase) {
        setSavedItems([]);
        setLoading(false);
        return;
      }

      const { data: favorites } = await supabase
        .from('user_favorites')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!favorites || favorites.length === 0) {
        setSavedItems([]);
        setLoading(false);
        return;
      }

      // Fetch details for each saved item
      const items = await Promise.all(
        favorites.map(async (fav) => {
          let item = null;
          let icon = 'School';
          let description = '';

          if (fav.item_type === 'school') {
            const result = await fetchSchool(fav.item_id);
            if (result.data) {
              item = result.data;
              icon = 'School';
              description = `${item.city}, ${item.county}`;
            }
          } else if (fav.item_type === 'university') {
            const result = await fetchUniversity(fav.item_id);
            if (result.data) {
              item = result.data;
              icon = 'GraduationCap';
              description = item.city || '';
            }
          } else if (fav.item_type === 'career') {
            const result = await fetchCareer(fav.item_id);
            if (result.data) {
              item = result.data;
              icon = 'Briefcase';
              description = item.domain || '';
            }
          } else if (fav.item_type === 'course') {
            const result = await fetchCourse(fav.item_id);
            if (result.data) {
              item = result.data;
              icon = 'BookOpen';
              description = item.provider || '';
            }
          }

          return item ? { ...item, icon, description, favoriteId: fav.id } : null;
        })
      );

      setSavedItems(items.filter(Boolean));
    } catch {
      // Error occurred loading saved items
    } finally {
      setLoading(false);
    }
  };

  // Refresh when screen is focused
  useFocusEffect(
    useCallback(() => {
      loadSavedItems();
    }, [])
  );

  const handleRemove = async (favoriteId: string) => {
    try {
      if (!supabase) return;

      await supabase
        .from('user_favorites')
        .delete()
        .eq('id', favoriteId);

      // Reload the list
      loadSavedItems();
    } catch {
      // Error removing item
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Se încarcă...</Text>
      </View>
    );
  }

  if (savedItems.length === 0) {
    return (
      <View style={styles.container}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          <SectionHeader
            title="Salvate"
            subtitle="Elementele salvate pentru comparare"
          />
          <View style={styles.emptyContainer}>
            <Icon name="Bookmark" size={48} color={colors.dark.textSecondary} />
            <Text style={styles.emptyText}>Nu ai elemente salvate</Text>
            <Text style={styles.emptySubtext}>Salvează licee, facultăți sau cariere pentru a le compara</Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <SectionHeader
          title="Salvate"
          subtitle={`Elementele salvate pentru comparare • ${savedItems.length}`}
        />
        {savedItems.map((item) => (
          <View key={item.favoriteId} style={styles.itemContainer}>
            <View style={styles.itemContent}>
              <ListItem
                icon={item.icon as any}
                title={item.name || item.title}
                description={item.description}
                showChevron={true}
                onPress={() => {
                  router.push({
                    pathname: '/detail',
                    params: { id: item.id },
                  } as any);
                }}
              />
            </View>
            <Pressable
              style={styles.removeButton}
              onPress={() => handleRemove(item.favoriteId)}
            >
              <Icon name="Trash2" size={20} color={colors.dark.danger} />
            </Pressable>
          </View>
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
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  itemContent: {
    flex: 1,
  },
  removeButton: {
    padding: spacing.md,
    marginLeft: spacing.sm,
  },
  loadingText: {
    ...body,
    color: colors.dark.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: spacing.xl * 2,
    padding: spacing.xl,
  },
  emptyText: {
    ...title,
    color: colors.dark.textPrimary,
    marginTop: spacing.lg,
  },
  emptySubtext: {
    ...caption,
    color: colors.dark.textSecondary,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});
