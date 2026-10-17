import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing } from '../../src/theme';
import { EmptyState } from '../../src/components';

export default function PathScreen() {
  return (
    <View style={styles.container}>
      <EmptyState
        title="Traseul meu"
        message="Aici vei putea vedea calea ta educațională și profesională către obiectivul tău."
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
