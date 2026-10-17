import React, { useState } from 'react';
import { Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, spacing, title, body, caption } from '../../../src/theme';
import { Button, Input } from '../../../src/components';
import { FormField } from '../../../src/components/FormField';
import { registerSchema , supabase } from '../../../src/lib';

export default function RegisterScreen() {
  const { params } = useLocalSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const gradeLevel = (params as any)?.grade || 'IX';
  const county = (params as any)?.county || 'București';
  const subjects = (params as any)?.subjects ? JSON.parse((params as any).subjects as string) : ['informatica'];
  const interests = (params as any)?.interests ? JSON.parse((params as any).interests as string) : ['tehnologie'];

  const handleRegister = async () => {
    try {
      setError('');
      setLoading(true);

      // Validate input
      const result = registerSchema.safeParse({
        email,
        password,
        displayName: name,
        gradeLevel,
        county,
        favoriteSubjects: subjects,
        interests,
      });

      if (!result.success) {
        setError(result.error.issues[0].message);
        return;
      }

      if (!supabase) {
        setError('Supabase nu este configurat');
        return;
      }

      // Sign up with Supabase using email OTP
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: name,
            grade_level: gradeLevel,
            county,
            favorite_subjects: subjects,
            interests,
          },
        },
      });

      if (signUpError) {
        console.error('Sign up error:', signUpError);

        // Use generic error message to prevent account enumeration
        setError('Nu s-a putut crea contul. Verifică datele și încearcă din nou.');
        return;
      }

      // If user was created successfully, navigate to verification
      if (data.user) {
        router.push({ pathname: '/(auth)/screens/verify-email', params: { email } } as any);
      } else {
        setError('Nu s-a putut crea contul. Încearcă din nou.');
      }
    } catch {
      setError('Nu s-a putut crea contul');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Înregistrare</Text>

      <FormField label="Nume">
        <Input
          placeholder="Numele tău"
          value={name}
          onChangeText={setName}
        />
      </FormField>

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
        title="Înregistrare"
        onPress={handleRegister}
        disabled={loading}
        style={styles.button}
      />

      <Pressable onPress={() => router.push('/(auth)/screens/login')}>
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
  },
  error: {
    ...caption,
    color: colors.dark.danger,
    marginBottom: spacing.md,
  },
});
