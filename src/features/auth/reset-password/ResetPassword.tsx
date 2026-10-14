import { View, Text, Image, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Button, Input } from "@/components";
import { useTranslation } from "@/hooks/use-translation";
import { useState, useEffect } from "react";
import { useSupabase } from "@/hooks/use-supabase";
import { useTheme } from "@/hooks/use-theme";
import { spacing, radius, theme } from "@/theme/tokens";

export default function ResetPassword() {
  const router = useRouter();
  const { t } = useTranslation();
  const { supabase } = useSupabase();
  const currentTheme = useTheme();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Token extraction or validation if needed
  }, []);

  const handleSubmit = async () => {
    setLoading(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError) {
        throw userError;
      }

      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        throw error;
      }

      router.replace("/(auth)/login" as any);
    } catch (error) {
      console.error("Reset password error:", error);
      alert("Eroare la resetarea parolei. Vă rugăm să încercați din nou.");
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
      <Text style={styles.title}>{t("auth.resetPassword")}</Text>
      <View style={styles.form}>
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
        <Button
          variant='primary'
          size='lg'
          loading={loading}
          onPress={handleSubmit}
          disabled={
            !(password && confirmPassword && password === confirmPassword)
          }
        >
          {t("auth.resetPassword")}
        </Button>
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
  },
});
