import { View, Text, Image, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Button, Input } from "@/components";
import { useTranslation } from "@/hooks/use-translation";
import { useState } from "react";
import { useSupabase } from "@/hooks/use-supabase";
import { useTheme } from "@/hooks/use-theme";
import { spacing, radius, theme } from "@/theme/tokens";

export default function Login() {
  const router = useRouter();
  const { t } = useTranslation();
  const { supabase } = useSupabase();
  const currentTheme = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

      // Check if email is verified
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user?.email_confirmed_at) {
        router.replace("/(auth)/verify-email");
      } else {
        router.replace("/_tabs/home");
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("Email sau parolă incorectă. Vă rugăm să încercați din nou.");
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
      <Text style={styles.title}>{t("auth.login")}</Text>
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
        <Button
          variant='primary'
          size='lg'
          loading={loading}
          onPress={handleSubmit}
          disabled={!(email && password)}
        >
          {t("auth.login")}
        </Button>
        <View style={styles.links}>
          <Text
            style={styles.linkText}
            onPress={() => router.push("/(auth)/forgot-password")}
          >
            {t("auth.forgotPassword")}
          </Text>
          <Text
            style={styles.linkText}
            onPress={() => router.push("/(auth)/register")}
          >
            {t("auth.register")}
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
  links: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.md,
  },
  linkText: {
    color: theme.textSecondary,
    fontSize: 14,
  },
});
