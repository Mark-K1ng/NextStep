import { View, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Button } from "@/components";
import { useTranslation } from "@/hooks/use-translation";
import { useEffect, useState } from "react";
import { useSupabase } from "@/hooks/use-supabase";
import { useTheme } from "@/hooks/use-theme";
import { spacing } from "@/theme";
import type { Theme } from "@/theme";

export default function VerifyEmail() {
  const router = useRouter();
  const { t } = useTranslation();
  const { supabase } = useSupabase();
  const theme = useTheme();
  const styles = getStyles(theme);
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    const checkVerificationStatus = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user?.email_confirmed_at) {
          setVerified(true);
          // Redirect to home after a short delay
          setTimeout(() => {
            router.replace("/_tabs/home");
          }, 1500);
        }
      } catch (error) {
        console.error("Error checking verification status:", error);
      } finally {
        setLoading(false);
      }
    };

    checkVerificationStatus();
  }, [supabase, router]);

  const handleResend = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabase.auth.resend({ type: "signup", email: user.email });
        // Show a toast or temporary message in a real app
        alert("Email de verificare a fost trimis din nou");
      }
    } catch (error) {
      console.error("Resend verification error:", error);
      alert(
        "Eroare la trimiterea emailului de verificare. Vă rugăm să încercați din nou."
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>{t("common.loading")}</Text>
      </View>
    );
  }

  if (verified) {
    return (
      <View style={styles.container}>
        <Text style={styles.verifiedText}>{t("auth.verified")}</Text>
        <Button
          variant='outline'
          size='md'
          onPress={() => router.replace("/_tabs/home")}
        >
          {t("common.continue")}
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t("auth.verifyEmail")}</Text>
      <Text style={styles.description}>{t("auth.verifyEmailDescription")}</Text>
      <View style={styles.actions}>
        <Button variant='outline' size='md' onPress={handleResend}>
          {t("auth.resendLink")}
        </Button>
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
      alignItems: "center",
    },
    title: {
      color: theme.textPrimary,
      fontSize: 24,
      fontWeight: "600" as const,
      textAlign: "center",
      marginBottom: spacing.md,
    },
    description: {
      color: theme.textSecondary,
      textAlign: "center",
      marginBottom: spacing.lg,
    },
    loadingText: {
      color: theme.textSecondary,
      fontSize: 16,
    },
    verifiedText: {
      color: theme.textPrimary,
      fontSize: 20,
      textAlign: "center",
      marginBottom: spacing.lg,
    },
    actions: {
      marginTop: spacing.lg,
    },
  });
}
