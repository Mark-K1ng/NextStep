import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';
import { colors, spacing, title, body, caption } from '../../src/theme';
import { Button, Input } from '../../src/components';
import { registerSchema } from '../../src/lib';
import { supabase } from '../../src/lib';

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
            display_name: displayName,
          },
        },
      });

      if (signUpError) {
        console.error('Sign up error:', signUpError);
        
        // Check if user already exists
        if (signUpError.message.includes('already registered') || signUpError.message.includes('User already registered')) {
          setError('Există deja un cont cu acest email. Conectează-te.');
          return;
        }
        
        // If it's a database error, the user might still be created despite trigger failure
        // Try to sign in to check
        if (signUpError.message.includes('Database error')) {
          console.log('Trying to sign in to check if user was created...');
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          
          if (signInData.user) {
            console.log('User was created, proceeding to verification');
            // Create profile manually
            try {
              const { error: profileError } = await supabase
                .from('profiles')
                .insert({
                  id: signInData.user.id,
                  display_name: displayName,
                  grade_level: 'IX',
                  county: 'București',
                  interests: ['tehnologie'],
                  favorite_subjects: ['informatica'],
                });
              if (profileError) {
                console.error('Profile creation error:', profileError);
              }
            } catch (err) {
              console.error('Profile creation failed:', err);
            }
            router.push({ pathname: '/(auth)/verify-email', params: { email } } as any);
            return;
          }
        }
        
        setError(signUpError.message);
        return;
      }

      // If user was created successfully, create profile manually
      if (data.user) {
        try {
          // Create profile manually to avoid trigger issues
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              display_name: displayName,
              grade_level: 'IX',
              county: 'București',
              interests: ['tehnologie'],
              favorite_subjects: ['informatica'],
            });

          if (profileError) {
            console.error('Profile creation error:', profileError);
            // Continue anyway - profile can be created later
          }
        } catch (err) {
          console.error('Profile creation failed:', err);
          // Continue anyway
        }

        router.push({ pathname: '/(auth)/verify-email', params: { email } } as any);
      } else {
        setError('Nu s-a putut crea contul. Încearcă din nou.');
      }
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
