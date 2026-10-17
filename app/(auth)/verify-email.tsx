import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, spacing, title, body, caption } from '../../src/theme';
import { Button, Input } from '../../src/components';
import { supabase } from '../../src/lib';

export default function VerifyEmailScreen() {
  const params = useLocalSearchParams();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleVerify = async () => {
    try {
      setError('');
      setLoading(true);

      if (!supabase) {
        setError('Supabase nu este configurat');
        return;
      }

      // Verify OTP with Supabase
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email: (params.email as string) || '',
        token: otp,
        type: 'signup',
      });

      if (verifyError) {
        setError(verifyError.message);
        return;
      }

      // Navigate to home screen on success
      router.replace('/(tabs)');
    } catch (err) {
      setError('Nu s-a putut verifica codul');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      setLoading(true);

      if (!supabase) {
        setError('Supabase nu este configurat');
        return;
      }

      // Resend OTP email
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: (params.email as string) || '',
      });

      if (resendError) {
        setError(resendError.message);
        return;
      }

      setSent(true);
    } catch (err) {
      setError('Nu s-a putut trimite email-ul');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Verifică email-ul</Text>

      <Text style={styles.message}>
        Ți-am trimis un cod de 6 cifre pe email. Introdu codul de mai jos pentru a-ți verifica contul.
      </Text>

      <Input
        label="Cod de verificare"
        placeholder="123456"
        value={otp}
        onChangeText={setOtp}
        keyboardType="number-pad"
        maxLength={6}
        textAlign="center"
      />

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Button
        title="Verifică"
        onPress={handleVerify}
        disabled={loading || otp.length !== 6}
        style={styles.button}
      />

      {!sent ? (
        <Button
          title="Trimite din nou"
          onPress={handleResend}
          disabled={loading}
          variant="outline"
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
  errorText: {
    ...caption,
    color: colors.dark.danger,
    marginBottom: spacing.md,
  },
});
