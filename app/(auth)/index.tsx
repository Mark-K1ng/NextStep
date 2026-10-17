import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import { colors, spacing, display, body } from '../../src/theme';
import { Button } from '../../src/components';
import { supabase } from '../../src/lib';

export default function WelcomeScreen() {
  const handleGetStarted = () => {
    if (supabase) {
      router.push('/(auth)/register');
    } else {
      // Skip auth for development without Supabase
      router.replace('/(tabs)');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>NextStep</Text>
        <Text style={styles.subtitle}>Descoperă următorul tău pas</Text>
      </View>

      <View style={styles.actions}>
        <Button
          title="Începe"
          onPress={handleGetStarted}
          style={styles.button}
        />
        <Pressable onPress={() => supabase && router.push('/(auth)/login')}>
          <Text style={styles.link}>{supabase ? 'Ai deja cont? Conectare' : 'Modul dezvoltare (fără backend)'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.background,
    padding: spacing.xl,
    justifyContent: 'center',
  },
  content: {
    marginBottom: spacing.xxxl,
  },
  title: {
    ...display,
    color: colors.dark.textPrimary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...body,
    color: colors.dark.textSecondary,
  },
  actions: {
    gap: spacing.lg,
  },
  button: {
    marginBottom: spacing.md,
  },
  link: {
    ...body,
    color: colors.dark.primary,
    textAlign: 'center',
    fontWeight: '600',
  },
});
