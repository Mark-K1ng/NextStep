import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors, spacing, title, heading, body } from '../../src/theme';
import { Card, Button } from '../../src/components';

export default function HomeScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.greeting}>Salut, Utilizator!</Text>

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Obiectivul tău</Text>
        <Text style={styles.cardText}>
          Nu ai setat încă un obiectiv de carieră.
        </Text>
        <Button
          title="Setează un obiectiv"
          onPress={() => {}}
          style={styles.cardButton}
        />
      </Card>

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Pasul următor</Text>
        <Text style={styles.cardText}>
          Explorează liceele și facultățile pentru a începe să-ți planifici viitorul.
        </Text>
        <Button
          title="Explorează"
          onPress={() => {}}
          variant="outline"
          style={styles.cardButton}
        />
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
    padding: spacing.xl,
  },
  greeting: {
    ...title,
    color: colors.dark.textPrimary,
    marginBottom: spacing.xl,
  },
  card: {
    marginBottom: spacing.lg,
  },
  cardTitle: {
    ...heading,
    color: colors.dark.textPrimary,
    marginBottom: spacing.sm,
  },
  cardText: {
    ...body,
    color: colors.dark.textSecondary,
    marginBottom: spacing.lg,
  },
  cardButton: {
    marginBottom: 0,
  },
});
