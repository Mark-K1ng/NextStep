import { View, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Button } from "@/components";
import { useTranslation } from "@/hooks/use-translation";
import { useEffect } from "react";
import { useTheme } from "@/hooks/use-theme";
import { spacing } from "@/theme";
import type { Theme } from "@/theme";

export default function Welcome() {
  const router = useRouter();
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = getStyles(theme);

  useEffect(() => {
    // Auto-redirect to login after a brief welcome
    const timer = setTimeout(() => {
      router.replace("/(auth)/login");
    }, 1500);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t("auth.welcome")}</Text>
      <Text style={styles.description}>{t("auth.welcomeDescription")}</Text>
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
    },
  });
}
