import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { colors, spacing, heading, body } from '../../src/theme';
import { Card, Button } from '../../src/components';
import { SectionHeader } from '../../src/components/SectionHeader';

export default function HomeScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <SectionHeader
        title="Salut, Utilizator!"
        subtitle="Bine ai revenit"
      />

      <View style={styles.quickActions}>
        <Card style={styles.actionCard} onPress={() => router.push('/explore')}>
          <Text style={styles.actionCardTitle}>Explorează</Text>
          <Text style={styles.actionCardText}>Licee, facultăți, cariere</Text>
        </Card>

        <Card style={styles.actionCard} onPress={() => router.push('/path')}>
          <Text style={styles.actionCardTitle}>Traseul meu</Text>
          <Text style={styles.actionCardText}>Vezi calea ta</Text>
        </Card>

        <Card style={styles.actionCard} onPress={() => router.push('/recommendations')}>
          <Text style={styles.actionCardTitle}>Recomandări</Text>
          <Text style={styles.actionCardText}>Cursuri pentru tine</Text>
        </Card>
      </View>

      <SectionHeader
        title="Continuă de unde ai rămas"
        style={styles.sectionSpacing}
      />

      <Card style={styles.continueCard}>
        <Text style={styles.continueTitle}>Obiectivul tău</Text>
        <Text style={styles.continueText}>
          Nu ai setat încă un obiectiv de carieră.
        </Text>
        <Button
          title="Setează un obiectiv"
          onPress={() => {}}
          style={styles.continueButton}
        />
      </Card>

      <SectionHeader
        title="Salvate"
        style={styles.sectionSpacing}
      />

      <Card style={styles.savedCard} onPress={() => router.push('/saved')}>
        <Text style={styles.savedTitle}>Vezi elementele salvate</Text>
        <Text style={styles.savedText}>3 elemente salvate pentru comparare</Text>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.background,
  },
  content: {
    padding: spacing.lg,
  },
  quickActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  actionCard: {
    flex: 1,
    padding: spacing.md,
  },
  actionCardTitle: {
    ...heading,
    color: colors.dark.textPrimary,
    marginBottom: spacing.xs,
  },
  actionCardText: {
    ...body,
    color: colors.dark.textSecondary,
    fontSize: 12,
  },
  sectionSpacing: {
    marginTop: spacing.xl,
  },
  continueCard: {
    marginBottom: spacing.lg,
  },
  continueTitle: {
    ...heading,
    color: colors.dark.textPrimary,
    marginBottom: spacing.sm,
  },
  continueText: {
    ...body,
    color: colors.dark.textSecondary,
    marginBottom: spacing.lg,
  },
  continueButton: {
    marginBottom: 0,
  },
  savedCard: {
    marginBottom: spacing.lg,
  },
  savedTitle: {
    ...heading,
    color: colors.dark.textPrimary,
    marginBottom: spacing.sm,
  },
  savedText: {
    ...body,
    color: colors.dark.textSecondary,
  },
});
