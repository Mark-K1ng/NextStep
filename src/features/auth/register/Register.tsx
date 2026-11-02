import { DecodingText as Text } from '@/components/decoding-text';
import { createURL } from 'expo-linking';
import { z } from 'zod';
import {
  completeRegistration,
  parseStringArray,
} from '@/services/registration';
import { useTheme } from '@/hooks/use-theme';
import type { Theme } from '@/theme';
import { showMessage } from '@/lib/show-message';
import { View, StyleSheet } from 'react-native';
import { MotionPressable as Pressable } from '@/components/motion';
import { useLocalSearchParams } from 'expo-router';
import { useAppRouter as useRouter } from '@/hooks/use-app-router';
import { Button, Input } from '@/components';
import { useTranslation } from '@/hooks/use-translation';
import { useState } from 'react';
import { useSupabase } from '@/hooks/use-supabase';
import { spacing, radius } from '@/theme/tokens';
import { Brand, Copy, Screen } from '@/components/design';
import { ro } from '@/i18n/ro';
import { SocialSignIn } from '@/components/social-sign-in';
import { GradeSelect, CountySelect } from '@/components/profile-selectors';
import { EDUCATION_ROUTES_ENABLED } from '@/constants/education-rollout';
import { readGuestIntake } from '@/services/education';
import {
  registrationSchema,
  emailSchema,
  passwordSchema,
} from '@/lib/validators';
import {
  AccountKindChoice,
  type AccountKindIntent,
} from '../account-kind-choice';

const teacherRegistrationSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    displayName: z.string().trim().min(2, 'Completează numele tău.').max(100),
    acceptedTerms: z.boolean().refine((value) => value, ro.auth.acceptTerms),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ['confirmPassword'],
    message: ro.validation.passwordsDoNotMatch,
  });

export default function Register() {
  const router = useRouter();
  const theme = useTheme();
  const styles = getStyles(theme);
  const { t } = useTranslation();
  const { supabase } = useSupabase();

  const params = useLocalSearchParams<{
    gradeLevel?: string;
    interests?: string;
    favoriteSubjects?: string;
    goal?: string;
    county?: string;
    sector?: string;
    accountKind?: string;
    intakeId?: string;
    skipIntake?: string;
  }>();

  const [email, setEmail] = useState('');
  const [accountKind, setAccountKind] = useState<AccountKindIntent>(
    params.accountKind === 'teacher' ? 'teacher' : 'student'
  );
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [county, setCounty] = useState(params.county || '');
  const [sector, setSector] = useState<number | null>(
    params.sector ? Number(params.sector) : null
  );
  const [processedGradeLevel, setProcessedGradeLevel] = useState(
    params.gradeLevel || ''
  );
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async () => {
    const validation = (
      accountKind === 'teacher' ? teacherRegistrationSchema : registrationSchema
    ).safeParse({
      email,
      password,
      confirmPassword,
      county,
      sector,
      gradeLevel: processedGradeLevel,
      acceptedTerms,
      displayName,
    });
    if (!validation.success) {
      setErrors(
        Object.fromEntries(
          validation.error.issues.map((issue) => [issue.path[0], issue.message])
        )
      );
      return;
    }
    setErrors({});
    setLoading(true);

    try {
      const intake =
        EDUCATION_ROUTES_ENABLED && accountKind === 'student' && params.intakeId
          ? await readGuestIntake()
          : null;
      if (
        EDUCATION_ROUTES_ENABLED &&
        params.intakeId &&
        accountKind === 'student' &&
        (!intake || intake.id !== params.intakeId)
      ) {
        throw new Error(
          'Intake unavailable. Return to onboarding before signup.'
        );
      }
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: createURL('/auth-callback'),
          data: {
            account_kind: accountKind,
            ...(intake ? { nextstep_guest_intake: intake.id } : {}),
            nextstep_profile_pending:
              accountKind === 'teacher'
                ? {
                    display_name: displayName.trim(),
                  }
                : {
                    display_name: email.trim().split('@')[0],
                    grade_level: processedGradeLevel,
                    county: county.trim(),
                    sector,
                    interests: parseStringArray(params.interests),
                    favorite_subjects: parseStringArray(
                      params.favoriteSubjects
                    ),
                  },
          },
        },
      });

      if (signUpError) {
        throw signUpError;
      }

      if (data.session && data.user) {
        try {
          await completeRegistration(data.user);
        } catch {
          // The account exists. Startup owns profile completion and its retry UI.
          router.replace('/');
          return;
        }
        router.replace('/');
      } else {
        router.replace({
          pathname: '/(auth)/verify-email',
          params: { email: email.trim(), accountKind },
        });
      }
    } catch {
      console.error('Registration failed');
      showMessage(ro.feedback.registerFailed);
    } finally {
      setLoading(false);
    }
  };

  if (
    EDUCATION_ROUTES_ENABLED &&
    accountKind === 'student' &&
    !params.intakeId &&
    params.skipIntake !== 'true'
  ) {
    return (
      <Screen auth>
        <Brand />
        <Copy kind='title'>Începe cu interesele tale</Copy>
        <Copy>
          Răspunde la trei întrebări opționale și vezi primele direcții înainte
          de a introduce e-mailul.
        </Copy>
        <AccountKindChoice
          value={accountKind}
          onChange={setAccountKind}
          disabled={loading}
        />
        <Button onPress={() => router.replace('/(auth)/onboarding/2')}>
          Descoperă primele direcții
        </Button>
        <Button
          variant='secondary'
          onPress={() =>
            router.replace({
              pathname: '/(auth)/register',
              params: { ...params, skipIntake: 'true' },
            })
          }
        >
          Continuă direct la cont
        </Button>
      </Screen>
    );
  }
  return (
    <Screen auth>
      <Brand />
      <Copy kind='title'>{ro.visual.registerTitle}</Copy>
      <Copy style={{ color: theme.textSecondary }}>
        {accountKind === 'teacher'
          ? 'Creează contul de profesor și continuă cu cererea de verificare. Nu ai nevoie de un profil de elev.'
          : ro.visual.registerHint}
      </Copy>
      <AccountKindChoice
        value={accountKind}
        onChange={(kind) => {
          setAccountKind(kind);
          setErrors({});
        }}
        disabled={loading}
      />
      <View style={styles.form}>
        {accountKind === 'teacher' && (
          <Input
            label='Nume și prenume'
            value={displayName}
            onChangeText={setDisplayName}
            error={errors.displayName}
            autoCapitalize='words'
            maxLength={100}
          />
        )}
        <Input
          label={t('auth.email')}
          error={errors.email}
          onBlur={() => {
            const result = emailSchema.safeParse(email);
            setErrors((current) => ({
              ...current,
              email: result.success ? '' : result.error.issues[0].message,
            }));
          }}
          placeholder={t('auth.email')}
          value={email}
          onChangeText={setEmail}
          autoCapitalize='none'
          keyboardType='email-address'
        />
        <Input
          label={t('auth.password')}
          error={errors.password}
          onBlur={() => {
            const result = passwordSchema.safeParse(password);
            setErrors((current) => ({
              ...current,
              password: result.success ? '' : result.error.issues[0].message,
            }));
          }}
          placeholder={t('auth.password')}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <Input
          label={t('auth.confirmPassword')}
          error={errors.confirmPassword}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />
        {accountKind === 'student' && (
          <CountySelect
            error={errors.county}
            county={county}
            sector={sector}
            onChange={(value, district) => {
              setCounty(value);
              setSector(district);
            }}
          />
        )}
        {accountKind === 'student' && !params.gradeLevel && (
          <GradeSelect
            error={errors.gradeLevel}
            value={processedGradeLevel}
            onChange={setProcessedGradeLevel}
          />
        )}
        <View style={styles.termsContainer}>
          <Pressable
            accessibilityRole='checkbox'
            accessibilityLabel={t('auth.acceptTerms')}
            accessibilityState={{ checked: acceptedTerms }}
            aria-checked={acceptedTerms}
            style={styles.termsCheckboxContainer}
            onPress={() => setAcceptedTerms(!acceptedTerms)}
          >
            <View
              style={[
                styles.termsCheckbox,
                acceptedTerms && styles.termsCheckboxChecked,
              ]}
            >
              {acceptedTerms && <View style={styles.termsCheckboxMark} />}
            </View>
            <Text style={styles.termsText}>{t('auth.acceptTerms')}</Text>
          </Pressable>
          <Pressable
            accessibilityRole='link'
            accessibilityLabel={ro.profile.terms}
            style={styles.policyLink}
            onPress={() => router.push('/terms')}
          >
            <Copy kind='caption' style={styles.policyLinkText}>
              {ro.profile.terms}
            </Copy>
          </Pressable>
          <Pressable
            accessibilityRole='link'
            accessibilityLabel={ro.profile.privacyPolicy}
            style={styles.policyLink}
            onPress={() => router.push('/privacy')}
          >
            <Copy kind='caption' style={styles.policyLinkText}>
              {ro.profile.privacyPolicy}
            </Copy>
          </Pressable>
        </View>
        <Button
          variant='primary'
          size='lg'
          loading={loading}
          onPress={handleSubmit}
        >
          {ro.visual.registerAction}
        </Button>
      </View>
      {errors.acceptedTerms && (
        <Copy kind='caption' style={{ color: theme.dangerText }}>
          {errors.acceptedTerms}
        </Copy>
      )}
      {accountKind === 'student' ? (
        <SocialSignIn />
      ) : (
        <Copy kind='caption' style={{ color: theme.textSecondary }}>
          Conturile noi de profesor se creează momentan prin e-mail. Activarea
          funcțiilor de predare necesită verificarea echipei NextStep.
        </Copy>
      )}
      <View style={styles.footer}>
        <Text
          style={styles.footerText}
          onPress={() =>
            router.replace({
              pathname: '/(auth)/login',
              params: { accountKind },
            })
          }
        >
          {t('auth.login')}
        </Text>
      </View>
    </Screen>
  );
}

function getStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      flexGrow: 1,
      width: '100%',
      maxWidth: 560,
      alignSelf: 'center',
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
    termsContainer: {
      borderWidth: 1,
      borderColor: theme.border,
      borderCurve: 'continuous',
      borderRadius: radius.md,
      padding: spacing.md,
    },
    termsCheckboxContainer: {
      minHeight: 48,
      flexDirection: 'row',
      alignItems: 'center',
    },
    termsCheckbox: {
      flexShrink: 0,
      width: 20,
      height: 20,
      borderWidth: 2,
      borderColor: theme.textSecondary,
      borderCurve: 'continuous',
      borderRadius: radius.xs,
      marginRight: spacing.xs,
      alignItems: 'center',
      justifyContent: 'center',
    },
    termsCheckboxChecked: {
      borderColor: theme.primary,
    },
    termsCheckboxMark: {
      width: 10,
      height: 10,
      backgroundColor: theme.primary,
      borderCurve: 'continuous',
      borderRadius: radius.xs,
    },
    termsText: {
      flex: 1,
      color: theme.textSecondary,
      fontSize: 14,
    },
    policyLink: {
      minHeight: 48,
      justifyContent: 'center',
    },
    policyLinkText: {
      color: theme.primary,
      textDecorationLine: 'underline',
    },
    footer: {
      marginTop: spacing.lg,
      alignItems: 'center',
    },
    footerText: {
      color: theme.textSecondary,
      fontSize: 16,
    },
  });
}
