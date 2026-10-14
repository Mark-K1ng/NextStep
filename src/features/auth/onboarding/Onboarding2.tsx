import { View, Text, Image, StyleSheet, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Button } from "@/components";
import { useTranslation } from "@/hooks/use-translation";
import { useTheme } from "@/hooks/use-theme";
import { useState } from "react";
import { spacing, radius, theme } from "@/theme/tokens";

export default function Onboarding2() {
  const router = useRouter();
  const { t } = useTranslation();
  const currentTheme = useTheme();
  const [gradeLevel, setGradeLevel] = useState("");

  const handleSkip = () => {
    router.replace("/_tabs/home" as any);
  };

  const handleNext = () => {
    router.push({
      pathname: "/(auth)/onboarding/3" as any,
      params: { gradeLevel },
    });
  };

  const gradeOptions = [
    { value: "V", label: "Clasa a V-a" },
    { value: "VI", label: "Clasa a VI-a" },
    { value: "VII", label: "Clasa a VII-a" },
    { value: "VIII", label: "Clasa a VIII-a" },
    { value: "IX", label: "Clasa a IX-a" },
    { value: "X", label: "Clasa a X-a" },
    { value: "XI", label: "Clasa a XI-a" },
    { value: "XII", label: "Clasa a XII-a" },
  ];

  return (
    <View style={styles.container}>
      <Image
        source={require("@/assets/images/logo-glow.png")}
        style={styles.image}
        resizeMode='contain'
      />
      <Text style={styles.title}>{t("onboarding2_title")}</Text>
      <Text style={styles.description}>{t("onboarding2_description")}</Text>
      <View style={styles.gradeSelector}>
        <Text style={styles.gradeLabel}>{t("onboarding.gradeLevel")}</Text>
        {gradeOptions.map((option) => (
          <Pressable
            key={option.value}
            style={[
              styles.gradeOption,
              gradeLevel === option.value && styles.gradeOptionSelected,
            ]}
            onPress={() => setGradeLevel(option.value)}
          >
            <Text style={styles.gradeOptionText}>{option.label}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.buttons}>
        <Button variant='outline' size='md' onPress={handleSkip}>
          {t("common.skip")}
        </Button>
        <Button
          variant='primary'
          size='md'
          onPress={handleNext}
          disabled={!gradeLevel}
        >
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
  },
  image: {
    width: 120,
    height: 120,
    marginBottom: spacing.md,
    alignSelf: "center",
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
  gradeSelector: {
    marginVertical: spacing.md,
  },
  gradeLabel: {
    color: theme.textPrimary,
    fontSize: 16,
    marginBottom: spacing.xs,
  },
  gradeOption: {
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: radius.sm,
    marginBottom: spacing.xs,
  },
  gradeOptionSelected: {
    borderColor: theme.primary,
    backgroundColor: theme.surfaceElevated,
  },
  gradeOptionText: {
    color: theme.textPrimary,
    fontSize: 14,
  },
  buttons: {
    flexDirection: "row",
    gap: spacing.md,
    width: "100%",
    marginTop: spacing.lg,
  },
});
