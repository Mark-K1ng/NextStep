import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing } from '../../src/theme';
import { EmptyState } from '../../src/components';

export default function ExploreScreen() {
  return (
    <View style={styles.container}>
      <EmptyState
        title="Explorează"
        message="Aici vei putea explora licee, facultăți, cariere și cursuri."
        actionLabel="Înapoi la acasă"
        onAction={() => {}}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.background,
  },
});
