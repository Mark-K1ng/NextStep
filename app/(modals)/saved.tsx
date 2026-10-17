import React from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { colors, spacing } from '../../src/theme';
import { ListItem } from '../../src/components/ListItem';
import { SectionHeader } from '../../src/components/SectionHeader';
import { Icon } from '../../src/components/Icon';

const SAVED_ITEMS = [
  { id: '1', icon: 'School' as const, title: 'Colegiul Național I.L. Caragiale', description: 'București' },
  { id: '2', icon: 'GraduationCap' as const, title: 'Universitatea Politehnica', description: 'Facultatea de Automatică' },
  { id: '3', icon: 'Briefcase' as const, title: 'Software Engineer', description: 'Carieră dorită' },
];

export default function SavedScreen() {
  const handleRemove = (id: string) => {
    // Remove item from saved
    // TODO: Implement actual removal logic
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <SectionHeader
          title="Salvate"
          subtitle="Elementele salvate pentru comparare"
        />
        {SAVED_ITEMS.map((item) => (
          <View key={item.id} style={styles.itemContainer}>
            <View style={styles.itemContent}>
              <ListItem
                icon={item.icon as any}
                title={item.title}
                description={item.description}
                showChevron={false}
              />
            </View>
            <Pressable
              style={styles.removeButton}
              onPress={() => handleRemove(item.id)}
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
});
