import { Button } from "@/components";
import { useTheme } from "@/hooks/use-theme";
import { useTranslation } from "@/hooks/use-translation";
import { radius, spacing, theme } from "@/theme/tokens";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function Onboarding3() {
  const router = useRouter();
  const { t } = useTranslation();
  const currentTheme = useTheme();
  const params = useLocalSearchParams<{ gradeLevel?: string }>();
  const gradeLevel = params.gradeLevel || "";

  const [interests, setInterests] = useState<string[]>([]);
  const [favoriteSubjects, setFavoriteSubjects] = useState<string[]>([]);
  const [goal, setGoal] = useState("");

  const handleSkip = () => {
    router.replace("/_tabs/home" as any);
  };

  const handleFinish = () => {
    router.replace("/(auth)/register" as any);
  };

  const interestOptions = [
    { value: "matematica", label: "Matematică" },
    { value: "informatica", label: "Informatică" },
    { value: "fizica", label: "Fizică" },
    { value: "chimie", label: "Chimie" },
    { value: "biologie", label: "Biologie" },
    { value: "istorie", label: "Istorie" },
    { value: "geografie", label: "Geografie" },
    { value: "limbaRomana", label: "Limba română" },
    { value: "limbaEngleza", label: "Limba engleză" },
    { value: "arte", label: "Arte" },
    { value: "muzica", label: "Muzică" },
    { value: "sport", label: "Sport" },
  ];

  const subjectOptions = [
    { value: "matematica", label: "Matematică" },
    { value: "fizica", label: "Fizică" },
    { value: "chimie", label: "Chimie" },
    { value: "biologie", label: "Biologie" },
    { value: "istorie", label: "Istorie" },
    { value: "geografie", label: "Geografie" },
    { value: "limbaRomana", label: "Limba română" },
    { value: "limbaEngleza", label: "Limba engleză" },
    { value: "arte", label: "Arte" },
    { value: "muzica", label: "Muzică" },
  ];

  const goalOptions = [
    { value: "stiiinte", label: "Științe și tehnologie" },
    { value: "arte", label: "Arte și umanități" },
    { value: "afaceri", label: "Afaceri și entreprenoriat" },
    { value: "sanatate", label: "Sănătate și medicină" },
    { value: "educatie", label: "Educație" },
    { value: "adminPublica", label: "Administrație publică" },
    { value: "agricultura", label: "Agricultură" },
    { value: "constructii", label: "Construcții" },
  ];

  return (
    <ScrollView style={styles.container}>
      <Image
        source={require("@/assets/images/logo-glow.png")}
        style={styles.image}
        resizeMode='contain'
      />
      <Text style={styles.title}>{t("onboarding3_title")}</Text>
      <Text style={styles.description}>{t("onboarding3_description")}</Text>

      {/* Interests Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("onboarding.interests")}</Text>
        <View style={styles.optionsContainer}>
          {interestOptions.map((option) => {
            const isSelected = interests.includes(option.value);
            return (
              <Pressable
                key={option.value}
                style={[
                  styles.optionButton,
                  isSelected && styles.optionButtonSelected,
                ]}
                onPress={() => {
                  if (isSelected) {
                    setInterests(interests.filter((i) => i !== option.value));
                  } else {
                    setInterests([...interests, option.value]);
                  }
                }}
              >
                <Text style={styles.optionButtonText}>{option.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Favorite Subjects Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {t("onboarding.favoriteSubjects")}
        </Text>
        <View style={styles.optionsContainer}>
          {subjectOptions.map((option) => {
            const isSelected = favoriteSubjects.includes(option.value);
            return (
              <Pressable
                key={option.value}
                style={[
                  styles.optionButton,
                  isSelected && styles.optionButtonSelected,
                ]}
                onPress={() => {
                  if (isSelected) {
                    setFavoriteSubjects(
                      favoriteSubjects.filter((s) => s !== option.value)
                    );
                  } else {
                    setFavoriteSubjects([...favoriteSubjects, option.value]);
                  }
                }}
              >
                <Text style={styles.optionButtonText}>{option.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Goal Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("onboarding.goal")}</Text>
        <View style={styles.optionsContainer}>
          {goalOptions.map((option) => {
            const isSelected = goal === option.value;
            return (
              <Pressable
                key={option.value}
                style={[
                  styles.optionButton,
                  isSelected && styles.optionButtonSelected,
                ]}
                onPress={() => setGoal(option.value)}
              >
                <Text style={styles.optionButtonText}>{option.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.buttons}>
        <Button variant='outline' size='md' onPress={handleSkip}>
          {t("common.skip")}
        </Button>
        <Button
          variant='primary'
          size='md'
          onPress={handleFinish}
          disabled={
            interests.length === 0 || favoriteSubjects.length === 0 || !goal
          }
        >
          {t("common.done")}
        </Button>
      </View>
    </ScrollView>
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
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    color: theme.textPrimary,
    fontSize: 18,
    fontWeight: "600" as const,
    marginBottom: spacing.md,
  },
  optionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  optionButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: theme.border,
    marginBottom: spacing.xs,
  },
  optionButtonSelected: {
    borderColor: theme.primary,
    backgroundColor: theme.surfaceElevated,
  },
  optionButtonText: {
    color: theme.textPrimary,
    fontSize: 14,
  },
  buttons: {
    flexDirection: "row",
    gap: spacing.md,
    width: "100%",
    marginTop: spacing.lg,
    marginBottom: spacing["3xl"],
  },
});
