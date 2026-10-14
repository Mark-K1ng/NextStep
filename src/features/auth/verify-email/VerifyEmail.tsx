import { View, Text, Image, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Button } from "@/components";
import { useTranslation } from "@/hooks/use-translation";
import { useState, useEffect } from "react";
import { useSupabase } from "@/hooks/use-supabase";
import { useTheme } from "@/hooks/use-theme";
import { spacing, radius, theme } from "@/theme/tokens";

export default function VerifyEmail() {
  const router = useRouter();
  const { t } = useTranslation();
  const { supabase } = useSupabase();
  const currentTheme = useTheme();
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    const checkVerificationStatus = async () => {
      setLoading(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          setVerified(!user.email_confirmed_at);
          if (user.email_confirmed_at) {
            router.replace("/_tabs/home" as any);
          }
        }
      } catch (error) {
        console.error("Error checking verification status:", error);
      } finally {
        setLoading(false);
      }
    };

    checkVerificationStatus();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setVerified(!session.user.email_confirmed_at);
        if (session.user.email_confirmed_at) {
          router.replace("/_tabs/home" as any);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, router]);

  const handleResend = async () => {
    setCooldown(30);
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user?.email) {
        alert("Nu s-a putut determina adresa de email.");
        return;
      }

      const { error } = await supabase.auth.resend({
        type: "signup",
        email: user.email,
      });

      if (error) {
        throw error;
      }

      alert("Linkul de verificare a fost retrimis!");
    } catch (error) {
      console.error("Resend verification error:", error);
      alert(
        "Eroare la retrimiterea linkului de verificare. Vă rugăm să încercați din nou."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  return (
    <View style={styles.container}>
      <Image
        source={require("@/assets/images/logo-glow.png")}
        style={styles.logo}
        resizeMode='contain'
      />
      {verified ? (
        <View style={styles.form}>
          <Text style={styles.description}>{t("auth.verificationSent")}</Text>
          {cooldown > 0 ? (
            <View style={styles.timer}>
              <Text style={styles.timerText}>
                {t("common.resendIn")} {cooldown}s
              </Text>
            </View>
          ) : (
            <Button
              variant='outline'
              size='md'
              onPress={handleResend}
              disabled={loading}
            >
              {loading ? t("common.loading") : t("auth.resendVerification")}
            </Button>
          )}
        </View>
      ) : (
        <View style={styles.success}>
          <Text style={styles.successTitle}>{t("auth.emailVerified")}</Text>
          <Button
            variant='primary'
            size='md'
            onPress={() => router.replace("/_tabs/home" as any)}
          >
            {t("common.continueToApp")}
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
    alignItems: "center",
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: spacing.md,
  },
  success: {
    alignItems: "center",
  },
  successTitle: {
    color: theme.success,
    fontSize: 24,
    fontWeight: "600" as const,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  form: {
    width: "100%",
    alignItems: "center",
  },
  description: {
    color: theme.textSecondary,
    fontSize: 16,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  timer: {
    marginTop: spacing.md,
  },
  timerText: {
    color: theme.textPrimary,
    fontSize: 14,
    textAlign: "center",
  },
});
