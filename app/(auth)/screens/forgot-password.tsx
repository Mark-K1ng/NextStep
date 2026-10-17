import React, { useState } from 'react';
import { Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';
import { colors, spacing, title, body, caption } from '../../../src/theme';
import { Button, Input } from '../../../src/components';
import { emailSchema } from '../../../src/lib';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleReset = async () => {
    try {
      setError('');
      setLoading(true);

      // Validate input
      const result = emailSchema.safeParse({ email });

      if (!result.success) {
        setError(result.error.issues[0].message);
        return;
      }

      // TODO: Implement actual Supabase password reset

      setSent(true);
    } catch {
      setError('Nu s-a putut trimite email-ul de resetare');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Ai uitat parola?</Text>

      {!sent ? (
        <>
          <Text style={styles.message}>
            Introdu adresa de email și îți vom trimite instrucțiuni pentru a reseta parola.
          </Text>

          <Input
            label="Email"
            placeholder="nume@exemplu.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button
            title="Trimite email"
            onPress={handleReset}
            disabled={loading}
            style={styles.button}
          />
        </>
      ) : (
        <Text style={styles.success}>
          Email-ul a fost trimis. Verifică inbox-ul pentru instrucțiuni.
        </Text>
      )}

      <Pressable onPress={() => router.push('/(auth)/screens/login')}>
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
  success: {
    ...body,
    color: colors.dark.success,
    marginBottom: spacing.lg,
  },
});
