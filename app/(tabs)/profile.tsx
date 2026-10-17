import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';
import { colors, spacing, title, heading, body } from '../../src/theme';
import { Button, Card } from '../../src/components';

export default function ProfileScreen() {
  const handleLogout = () => {
    // TODO: Implement actual logout
    router.replace('/(auth)/login');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Profilul meu</Text>

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Utilizator</Text>
        <Text style={styles.cardText}>nume@exemplu.com</Text>
      </Card>

      <Card style={styles.card}>
        <Pressable style={styles.menuItem}>
          <Text style={styles.menuText}>Editează profilul</Text>
        </Pressable>
        <Pressable style={styles.menuItem}>
          <Text style={styles.menuText}>Schimbă parola</Text>
        </Pressable>
        <Pressable style={styles.menuItem}>
          <Text style={styles.menuText}>Exportă datele mele</Text>
        </Pressable>
      </Card>

      <Card style={styles.card}>
        <Pressable style={styles.menuItem}>
          <Text style={styles.menuText}>Politica de confidențialitate</Text>
        </Pressable>
        <Pressable style={styles.menuItem}>
          <Text style={styles.menuText}>Termeni și condiții</Text>
        </Pressable>
      </Card>

      <Card style={{ ...styles.card, borderColor: colors.dark.danger }}>
        <Pressable style={styles.menuItem} onPress={() => {}}>
          <Text style={[styles.menuText, styles.dangerText]}>Șterge contul</Text>
        </Pressable>
      </Card>

      <Button
        title="Deconectare"
        onPress={handleLogout}
        variant="outline"
        style={styles.button}
      />
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
  title: {
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
    marginBottom: spacing.md,
  },
  cardText: {
    ...body,
    color: colors.dark.textSecondary,
  },
  menuItem: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.dark.border,
  },
  menuText: {
    ...body,
    color: colors.dark.textPrimary,
  },
  dangerText: {
    color: colors.dark.danger,
  },
  button: {
    marginBottom: spacing.xl,
  },
});
