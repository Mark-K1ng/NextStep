import { View, Text, Image, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Input } from '@/components';
import { useTranslation } from '@/hooks/use-translation';
import { useState } from 'react';
import { useSupabase } from '@/hooks/use-supabase';
import { spacing, theme } from '@/theme/tokens';
import logoGlow from '@/assets/images/logo-glow.png';

export default function Login() {
  const router = useRouter();
  const { t } = useTranslation();
  const { supabase } = useSupabase();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      // Check if email is verified using the user from the signIn response
      if (!data.user?.email_confirmed_at) {
        router.replace('/(auth)/verify-email');
      } else {
        router.replace('/_tabs/home');
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Email sau parolă incorectă. Vă rugăm să încercați din nou.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Image source={logoGlow} style={styles.logo} resizeMode='contain' />
      <Text style={styles.title}>{t('auth.login')}</Text>
      <View style={styles.form}>
        <Input
          label={t('auth.email')}
          placeholder={t('auth.email')}
          value={email}
          onChangeText={setEmail}
          autoCapitalize='none'
          keyboardType='email-address'
        />
        <Input
          label={t('auth.password')}
          placeholder={t('auth.password')}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <Button
          variant='primary'
          size='lg'
          loading={loading}
          onPress={handleSubmit}
          disabled={!(email && password)}
        >
          {t('auth.login')}
        </Button>
        <View style={styles.links}>
          <Text
            style={styles.linkText}
            onPress={() => router.push('/(auth)/forgot-password')}
          >
            {t('auth.forgotPassword')}
          </Text>
          <Text
            style={styles.linkText}
            onPress={() => router.push('/(auth)/register')}
          >
            {t('auth.register')}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: spacing.md,
    alignSelf: 'center',
  },
  title: {
    color: theme.textPrimary,
    fontSize: 28,
    fontWeight: '700' as const,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  form: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  links: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  linkText: {
    color: theme.textSecondary,
    fontSize: 14,
  },
});
