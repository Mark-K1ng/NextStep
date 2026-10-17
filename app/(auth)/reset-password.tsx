import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, spacing, title, body, caption } from '../../src/theme';
import { Button, Input } from '../../src/components';
import { passwordSchema } from '../../src/lib';

export default function ResetPasswordScreen() {
  const { token } = useLocalSearchParams<{ token?: string }>();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleReset = async () => {
    try {
      setError('');
      setLoading(true);

      // Validate input
      const result = passwordSchema.safeParse({ password });

      if (!result.success) {
        setError(result.error.issues[0].message);
        return;
      }

      // TODO: Implement actual Supabase password reset with token
      console.log('Reset password with token:', token);

      // Navigate to login
      router.replace('/(auth)/login');
    } catch (err) {
      setError('Nu s-a putut reseta parola');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Resetează parola</Text>

      <Text style={styles.message}>
        Introdu noua ta parolă.
      </Text>

      <Input
        label="Noua parolă"
        placeholder="Noua parolă"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button
        title="Resetează parola"
        onPress={handleReset}
        disabled={loading}
        style={styles.button}
      />

      <Pressable onPress={() => router.replace('/(auth)/login')}>
        <Text style={styles.link}>Înapoi la conectare</Text>
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
    marginBottom: spacing.lg,
  },
  message: {
    ...body,
    color: colors.dark.textSecondary,
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
  },
  error: {
    ...caption,
    color: colors.dark.danger,
    marginBottom: spacing.md,
  },
});
