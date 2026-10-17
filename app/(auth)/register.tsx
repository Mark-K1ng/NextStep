import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';
import { colors, spacing, title, body, caption } from '../../src/theme';
import { Button, Input } from '../../src/components';
import { registerSchema } from '../../src/lib';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    try {
      setError('');
      setLoading(true);

      // Validate input
      const result = registerSchema.safeParse({
        email,
        password,
        displayName,
        gradeLevel: 'IX',
        county: 'București',
        favoriteSubjects: ['informatica'],
        interests: ['tehnologie'],
      });

      if (!result.success) {
        setError(result.error.issues[0].message);
        return;
      }

      // TODO: Implement actual Supabase registration
      console.log('Register:', { email, displayName });

      // For now, just navigate to verify email
      router.push('/(auth)/verify-email');
    } catch (err) {
      setError('Nu s-a putut crea contul');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Înregistrare</Text>

      <Input
        label="Nume"
        placeholder="Numele tău"
        value={displayName}
        onChangeText={setDisplayName}
      />

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
        title="Înregistrare"
        onPress={handleRegister}
        disabled={loading}
        style={styles.button}
      />

      <Pressable onPress={() => router.push('/(auth)/login')}>
        <Text style={styles.link}>Ai deja cont? Conectare</Text>
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
  },
  error: {
    ...caption,
    color: colors.dark.danger,
    marginBottom: spacing.md,
  },
});
