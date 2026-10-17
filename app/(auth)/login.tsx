import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';
import { colors, spacing, title, body, caption } from '../../src/theme';
import { Button, Input } from '../../src/components';
import { loginSchema } from '../../src/lib';
import { supabase } from '../../src/lib';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    try {
      setError('');
      setLoading(true);

      // Validate input
      const result = loginSchema.safeParse({ email, password });

      if (!result.success) {
        setError(result.error.issues[0].message);
        return;
      }

      if (!supabase) {
        setError('Supabase nu este configurat');
        return;
      }

      // Sign in with Supabase
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      // Navigate to tabs on success
      router.replace('/(tabs)');
    } catch (err) {
      setError('Email-ul sau parola sunt incorecte');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Conectare</Text>

      <Input
        label="Email"
        placeholder="nume@exemplu.com"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <Input
        label="Parolă"
        placeholder="Parola ta"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button
        title="Conectare"
        onPress={handleLogin}
        disabled={loading}
        style={styles.button}
      />

      <Pressable onPress={() => router.push('/(auth)/forgot-password')}>
        <Text style={styles.link}>Ai uitat parola?</Text>
      </Pressable>

      <Pressable onPress={() => router.push('/(auth)/register')}>
        <Text style={styles.link}>Nu ai cont? Înregistrare</Text>
      </Pressable>
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
    justifyContent: 'center',
    minHeight: '100%',
  },
  title: {
    ...title,
    color: colors.dark.textPrimary,
    marginBottom: spacing.xl,
  },
  button: {
    marginBottom: spacing.lg,
  },
  link: {
    ...body,
    color: colors.dark.primary,
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  error: {
    ...caption,
    color: colors.dark.danger,
    marginBottom: spacing.md,
  },
});
