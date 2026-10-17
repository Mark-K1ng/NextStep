import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing } from '../../src/theme';
import { EmptyState } from '../../src/components';

export default function RecommendationsScreen() {
  return (
    <View style={styles.container}>
      <EmptyState
        title="Recomandări"
        message="Aici vei putea vedea recomandări personalizate de cursuri bazate pe abilitățile tale."
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
