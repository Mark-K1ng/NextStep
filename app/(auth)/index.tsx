import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import { colors, spacing, title, body, heading } from '../../src/theme';
import { Button } from '../../src/components';
import { supabase } from '../../src/lib';

export default function WelcomeScreen() {
  const handleGetStarted = () => {
    if (supabase) {
      router.push('/(auth)/screens/personalization');
    } else {
      // Skip auth for development without Supabase
      router.replace('/(tabs)');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.topContent}>
        <Text style={styles.logo}>NextStep</Text>
        <Text style={styles.subtitle}>Descoperă următorul tău pas</Text>
      </View>

      <View style={styles.bottomContent}>
        <Button
          title="Începe"
          onPress={handleGetStarted}
          style={styles.button}
        />
        <Pressable onPress={() => supabase && router.push('/(auth)/screens/login')}>
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
    paddingHorizontal: spacing.xl,
    justifyContent: 'space-between',
    paddingTop: spacing.xxxl,
    paddingBottom: spacing.xxxl,
  },
  topContent: {
    alignItems: 'center',
  },
  logo: {
    ...title,
    color: colors.dark.primary,
    fontSize: 56,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.lg,
    letterSpacing: -0.5,
  },
  subtitle: {
    ...heading,
    color: colors.dark.textSecondary,
    textAlign: 'center',
    fontSize: 18,
    lineHeight: 28,
    fontWeight: '400',
  },
  bottomContent: {
    alignItems: 'center',
    gap: spacing.lg,
  },
  button: {
    width: '100%',
  },
  link: {
    ...body,
    color: colors.dark.primary,
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 16,
  },
});
