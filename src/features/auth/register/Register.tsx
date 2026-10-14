import { View, Text, Image, StyleSheet, Pressable } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Button, Input } from "@/components";
import { useTranslation } from "@/hooks/use-translation";
import { useState } from "react";
import { useSupabase } from "@/hooks/use-supabase";
import { useTheme } from "@/hooks/use-theme";
import { spacing, radius, theme } from "@/theme/tokens";

export default function Register() {
  const router = useRouter();
  const { t } = useTranslation();
  const { supabase } = useSupabase();
  const currentTheme = useTheme();

  const params = useLocalSearchParams<{
    gradeLevel?: string;
    interests?: string;
    favoriteSubjects?: string;
    goal?: string;
  }>();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [processedGradeLevel, setProcessedGradeLevel] = useState(
    params.gradeLevel || ""
  );
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);

    try {
      const {
        data: { user },
        error: signUpError,
      } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: email.split("@")[0],
          },
        },
      });

      if (signUpError) {
        throw signUpError;
      }

      if (user) {
        const { error: profileError } = await supabase.from("profiles").insert({
          id: user.id,
          display_name: email.split("@")[0],
          grade_level: processedGradeLevel,
        });

        if (profileError) {
          throw profileError;
        }
      }

      router.replace("/(auth)/verify-email" as any);
    } catch (error) {
      console.error("Registration error:", error);
      alert("Eroare la înregistrare. Vă rugăm să încercați din nou.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={require("@/assets/images/logo-glow.png")}
        style={styles.logo}
        resizeMode='contain'
      />
      <Text style={styles.title}>{t("auth.register")}</Text>
      <View style={styles.form}>
        <Input
          label={t("auth.email")}
          placeholder={t("auth.email")}
          value={email}
          onChangeText={setEmail}
          autoCapitalize='none'
          keyboardType='email-address'
        />
        <Input
          label={t("auth.password")}
          placeholder={t("auth.password")}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <Input
          label={t("auth.gradeLevel")}
          placeholder={t("auth.gradeLevel")}
          value={processedGradeLevel}
          onChangeText={setProcessedGradeLevel}
        />
        <View style={styles.termsContainer}>
          <Pressable
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
            <Text style={styles.termsText}>{t("auth.acceptTerms")}</Text>
          </Pressable>
        </View>
        <Button
          variant='primary'
          size='lg'
          loading={loading}
          onPress={handleSubmit}
          disabled={
            !(email && password && processedGradeLevel && acceptedTerms)
          }
        >
          {t("auth.register")}
        </Button>
      </View>
      <View style={styles.footer}>
        <Text
          style={styles.footerText}
          onPress={() => router.replace("/(auth)/login" as any)}
        >
          {t("auth.login")}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
    padding: spacing.lg,
    justifyContent: "center",
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: spacing.md,
    alignSelf: "center",
  },
  title: {
    color: theme.textPrimary,
    fontSize: 28,
    fontWeight: "700" as const,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  form: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  termsContainer: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  termsCheckboxContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  termsCheckbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: theme.textSecondary,
    borderRadius: radius.xs,
    marginRight: spacing.xs,
    alignItems: "center",
    justifyContent: "center",
  },
  termsCheckboxChecked: {
    borderColor: theme.primary,
  },
  termsCheckboxMark: {
    width: 10,
    height: 10,
    backgroundColor: theme.primary,
    borderRadius: radius.xs,
  },
  termsText: {
    color: theme.textSecondary,
    fontSize: 14,
  },
  footer: {
    marginTop: spacing.lg,
    alignItems: "center",
  },
  footerText: {
    color: theme.textSecondary,
    fontSize: 16,
  },
});
