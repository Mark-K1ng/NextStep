import { View, Text, Image, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Button } from "@/components";
import { useTranslation } from "@/hooks/use-translation";
import { useTheme } from "@/hooks/use-theme";
import { spacing, radius, theme } from "@/theme/tokens";

export default function Onboarding1() {
  const router = useRouter();
  const { t } = useTranslation();
  const currentTheme = useTheme();

  const handleSkip = () => {
    router.replace("/_tabs/home" as any);
  };

  const handleNext = () => {
    router.push("/(auth)/onboarding/2" as any);
  };

  return (
    <View style={styles.container}>
      <Image
        source={require("@/assets/images/logo-glow.png")}
        style={styles.image}
        resizeMode='contain'
      />
      <Text style={styles.title}>{t("onboarding1_title")}</Text>
      <Text style={styles.description}>{t("onboarding1_description")}</Text>
      <View style={styles.buttons}>
        <Button variant='outline' size='md' onPress={handleSkip}>
          {t("common.skip")}
        </Button>
        <Button variant='primary' size='md' onPress={handleNext}>
          {t("common.next")}
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
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: 200,
    height: 200,
    marginBottom: spacing.md,
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
    fontSize: 16,
    textAlign: "center",
    marginBottom: spacing.lg,
  },
  buttons: {
    flexDirection: "row",
    gap: spacing.md,
    width: "100%",
    justifyContent: "center",
  },
});
