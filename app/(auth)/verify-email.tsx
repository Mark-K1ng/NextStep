import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';
import { colors, spacing, title, body } from '../../src/theme';
import { Button } from '../../src/components';

export default function VerifyEmailScreen() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleResend = async () => {
    try {
      setLoading(true);

      // TODO: Implement actual Supabase email resend
      console.log('Resend verification email');

      setSent(true);
    } catch (err) {
      console.error('Error resending email:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Verifică email-ul</Text>

      <Text style={styles.message}>
        Ți-am trimis un email de verificare. Verifică inbox-ul și urmează instrucțiunile.
      </Text>

      {!sent ? (
        <Button
          title="Trimite din nou"
          onPress={handleResend}
          disabled={loading}
          style={styles.button}
        />
      ) : (
        <Text style={styles.success}>
          Email-ul a fost trimis din nou.
        </Text>
      )}

      <Pressable onPress={() => router.replace('/(auth)/login')}>
        <Text style={styles.link}>M-am întors la conectare</Text>
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
  success: {
    ...body,
    color: colors.dark.success,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
});
