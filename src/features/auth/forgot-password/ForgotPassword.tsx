import { View, Text, Image, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Button, Input } from "@/components";
import { useTranslation } from "@/hooks/use-translation";
import { useState } from "react";
import { useSupabase } from "@/hooks/use-supabase";
import { useTheme } from "@/hooks/use-theme";
import { spacing, radius, theme } from "@/theme/tokens";

export default function ForgotPassword() {
  const router = useRouter();
  const { t } = useTranslation();
  const { supabase } = useSupabase();
  const currentTheme = useTheme();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);

      if (error) {
        throw error;
      }

      setSent(true);
    } catch (error: unknown) {
      console.error("Forgot password error:", error);
      const msg = error instanceof Error ? error.message : String(error);
      if (msg.includes("User not found")) {
        alert(
          "Dacă există un cont cu această adresă de e-mail, veți primi un link pentru resetarea parolei."
        );
      } else {
        alert(
          "Eroare la trimiterea linkului de resetare. Vă rugăm să încercați din nou."
        );
      }
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
      <Text style={styles.title}>{t("auth.forgotPassword")}</Text>
      {!sent ? (
        <View style={styles.form}>
          <Input
            label={t("auth.email")}
            placeholder={t("auth.email")}
            value={email}
            onChangeText={setEmail}
            autoCapitalize='none'
            keyboardType='email-address'
          />
          <Button
            variant='primary'
            size='lg'
            loading={loading}
            onPress={handleSubmit}
            disabled={!email}
          >
            {t("auth.sendResetLink")}
          </Button>
        </View>
      ) : (
        <View style={styles.success}>
          <Text style={styles.successText}>{t("auth.verificationSent")}</Text>
          <Button
            variant='outline'
            size='md'
            onPress={() => router.replace("/(auth)/login")}
          >
            {t("common.done")}
          </Button>
        </View>
      )}
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
  success: {
    alignItems: "center",
    gap: spacing.md,
  },
  successText: {
    color: theme.textPrimary,
    fontSize: 18,
    textAlign: "center",
    marginBottom: spacing.md,
  },
});
