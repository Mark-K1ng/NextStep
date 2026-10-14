import { View, Text, Image, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Button, Input } from "@/components";
import { useTranslation } from "@/hooks/use-translation";
import { useState } from "react";
import { useSupabase } from "@/hooks/use-supabase";
import { useTheme } from "@/hooks/use-theme";
import { spacing, radius } from "@/theme";
import type { Theme } from "@/theme";

export default function Register() {
  const router = useRouter();
  const { t } = useTranslation();
  const { supabase } = useSupabase();
  const theme = useTheme();
  const styles = getStyles(theme);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (password !== confirmPassword) {
      alert("Parolele nu se potrivesc. Vă rugăm să încercați din nou.");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            grade_level: gradeLevel,
          },
        },
      });

      if (error) {
        throw error;
      }

      // Check if email verification is required
      if (data.user) {
        router.replace("/(auth)/verify-email");
      }
    } catch (error) {
      console.error("Register error:", error);
      alert("Eroare la înregistrare. Vă rugăm să încercați din nou.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={
          /* eslint-disable-next-line @typescript-eslint/no-require-imports */ require("@/assets/images/logo-glow.png")
        }
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
          label={t("auth.confirmPassword")}
          placeholder={t("auth.confirmPassword")}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />
        <Input
          label={t("auth.gradeLevel")}
          placeholder={t("auth.gradeLevel")}
          value={gradeLevel}
          onChangeText={setGradeLevel}
        />
        <Button
          variant='primary'
          size='lg'
          loading={loading}
          onPress={handleSubmit}
          disabled={!(email && password && confirmPassword && gradeLevel)}
        >
          {t("auth.register")}
        </Button>
        <View style={styles.links}>
          <Text
            style={styles.linkText}
            onPress={() => router.push("/(auth)/login")}
          >
            {t("auth.haveAccount")}
          </Text>
        </View>
      </View>
    </View>
  );
}

function getStyles(theme: Theme) {
  return StyleSheet.create({
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
    },
    links: {
      flexDirection: "row",
      justifyContent: "center",
      marginTop: spacing.md,
    },
    linkText: {
      color: theme.textSecondary,
      fontSize: 14,
    },
  });
}
