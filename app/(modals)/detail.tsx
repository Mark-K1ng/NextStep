import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';
import { colors, spacing, title, heading, body } from '../../src/theme';
import { Button } from '../../src/components/Button';
import { Card } from '../../src/components/Card';
import { Icon } from '../../src/components/Icon';

export default function DetailScreen() {
  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Icon name="ChevronLeft" size={24} color={colors.dark.primary} />
          </Pressable>

          <Text style={styles.title}>Colegiul Național I.L. Caragiale</Text>

          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Despre</Text>
            <Text style={styles.text}>
              Colegiul Național I.L. Caragiale este una dintre cele mai prestigioase instituții de învățământ din București, cunoscută pentru excelența academică și tradiția sa îndelungată.
            </Text>
          </Card>

          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Profil</Text>
            <Text style={styles.text}>Matematică-Informatică</Text>
          </Card>

          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Locație</Text>
            <Text style={styles.text}>București, Sector 1</Text>
          </Card>

          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Cerințe</Text>
            <Text style={styles.text}>
              • Medie de admitere peste 8.50
              {'\n'}• Evaluare la matematică și informatică
              {'\n'}• Interviu cu profesorii
            </Text>
          </Card>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Salvează"
          onPress={() => {}}
          style={styles.button}
        />
      </View>
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
  backButton: {
    marginBottom: spacing.md,
  },
  title: {
    ...title,
    color: colors.dark.textPrimary,
    marginBottom: spacing.lg,
    fontSize: 28,
  },
  card: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...heading,
    color: colors.dark.textPrimary,
    marginBottom: spacing.sm,
  },
  text: {
    ...body,
    color: colors.dark.textSecondary,
    lineHeight: 24,
  },
  footer: {
    padding: spacing.xl,
    backgroundColor: colors.dark.background,
    borderTopWidth: 1,
    borderTopColor: colors.dark.border,
  },
  button: {
    marginBottom: 0,
  },
});
