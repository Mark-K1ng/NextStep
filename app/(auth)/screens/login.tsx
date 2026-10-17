import React, { useState } from 'react';
import { Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';
import { colors, spacing, title, body, caption } from '../../../src/theme';
import { Button, Input } from '../../../src/components';
import { FormField } from '../../../src/components/FormField';
import { loginSchema , supabase } from '../../../src/lib';

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
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      // Navigate to tabs on success
      router.replace('/(tabs)');
    } catch {
      setError('Email-ul sau parola sunt incorecte');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Conectare</Text>

      <FormField label="Email" error={error}>
        <Input
          placeholder="nume@exemplu.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </FormField>

      <FormField label="Parolă">
        <Input
          placeholder="Parola ta"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
      </FormField>

      <Button
        title="Autentificare"
        onPress={handleLogin}
        disabled={loading}
        style={styles.button}
      />

      <Pressable onPress={() => router.push('/(auth)/screens/forgot-password')}>
        <Text style={styles.link}>Ai uitat parola?</Text>
      </Pressable>

      <Pressable onPress={() => router.push('/(auth)/screens/personalization')}>
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
    fontSize: 32,
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
