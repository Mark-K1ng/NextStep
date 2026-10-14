import { View, Text, Image, StyleSheet, ScrollView } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Button, Input, Chip, Card } from "@/components";
import { useTranslation } from "@/hooks/use-translation";
import { useState, useEffect } from "react";
import { useSupabase } from "@/hooks/use-supabase";
import type { Theme } from "@/theme";
import { useTheme } from "@/hooks/use-theme";
import { spacing, radius } from "@/theme";

export default function ProgramDetail() {
  const router = useRouter();
  const { t } = useTranslation();
  const { supabase } = useSupabase();
  const theme = useTheme();
  const styles = getStyles(theme);
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [program, setProgram] = useState<any>(null);

  useEffect(() => {
    const fetchProgram = async () => {
      if (!id) {
        setError("Invalid program ID");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const { data, error: queryError } = await supabase
          .from("programs")
          .select(
            `
            *,
            universities (*),
            program_skills (
              *,
              skills (*)
            ),
            program_careers (
              *,
              careers (*)
            )
          `
          )
          .eq("id", id)
          .single();

        if (queryError) {
          throw queryError;
        }

        if (data) {
          setProgram(formatProgramData(data));
        } else {
          setError("Program not found");
        }
      } catch (err) {
        console.error("Error fetching program:", err);
        setError("Failed to load program details. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchProgram();
  }, [id, supabase]);

  // Format program data for display
  const formatProgramData = (rawData: any) => {
    return {
      id: rawData.id,
      name: rawData.name,
      university: rawData.universities?.name || "",
      degreeLevel: rawData.degree_level || "",
      duration: `${rawData.duration_years} ani`,
      description: rawData.description || "",
      sourceUrl: rawData.source_url || "",
      skills: rawData.program_skills?.map((ps: any) => ps.skills) || [],
      careers: rawData.program_careers?.map((pc: any) => pc.careers) || [],
    };
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>{t("common.loading")}</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
        <Button variant='outline' size='md' onPress={() => router.back()}>
          {t("common.goBack")}
        </Button>
      </View>
    );
  }

  if (!program) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{t("explore.noResults")}</Text>
        <Button variant='outline' size='md' onPress={() => router.back()}>
          {t("common.goBack")}
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Button variant='outline' size='sm' onPress={() => router.back()}>
          <Text style={styles.backButtonText}>{t("common.back")}</Text>
        </Button>
        <Text style={styles.title}>{program.name}</Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.imageContainer}>
          {/* In a real app, we would display the university's image or logo */}
          <View style={styles.placeholderImage}>
            <Text style={styles.placeholderText}>
              {t("university.imagePlaceholder")}
            </Text>
          </View>
        </View>

        <View style={styles.detailSection}>
          <Text style={styles.sectionTitle}>{t("university.description")}</Text>
          <Text style={styles.detailText}>{program.description}</Text>
        </View>

        <View style={styles.detailSection}>
          <Text style={styles.sectionTitle}>{t("university.name")}</Text>
          <Text style={styles.detailText}>{program.university}</Text>
        </View>

        <View style={styles.detailSection}>
          <Text style={styles.sectionTitle}>{t("university.degreeLevel")}</Text>
          <Text style={styles.detailText}>{program.degreeLevel}</Text>
        </View>

        <View style={styles.detailSection}>
          <Text style={styles.sectionTitle}>{t("university.duration")}</Text>
          <Text style={styles.detailText}>{program.duration}</Text>
        </View>

        <View style={styles.detailSection}>
          <Text style={styles.sectionTitle}>{t("university.description")}</Text>
          <Text style={styles.detailText}>{program.description}</Text>
        </View>

        <View style={styles.detailSection}>
          <Text style={styles.sectionTitle}>{t("university.website")}</Text>
          {/* In a real app, we would get the website from the university data */}
          <Text style={styles.detailText}>{t("common.notAvailable")}</Text>
        </View>

        {program.skills.length > 0 && (
          <View style={styles.detailSection}>
            <Text style={styles.sectionTitle}>{t("program.skills")}</Text>
            <View style={styles.tagsContainer}>
              {program.skills.map((skill: any, index: number) => (
                <View key={index} style={styles.tagContainer}>
                  <Chip variant='secondary' size='sm'>
                    {skill.name}
                  </Chip>
                </View>
              ))}
            </View>
          </View>
        )}

        {program.careers.length > 0 && (
          <View style={styles.detailSection}>
            <Text style={styles.sectionTitle}>{t("program.careers")}</Text>
            <View style={styles.careersList}>
              {program.careers.map((career: any, index: number) => (
                <View key={index} style={styles.careerCard}>
                  <Text style={styles.careerTitle}>{career.name}</Text>
                  <View style={styles.careerDetails}>
                    <Text style={styles.careerDetailText}>{career.domain}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.detailSection}>
          <Text style={styles.sectionTitle}>{t("university.source")}</Text>
          <View style={styles.sourceContainer}>
            <Text style={styles.sourceText}>{program.sourceUrl}</Text>
            <Button
              variant='outline'
              size='sm'
              onPress={() => {
                // In a real app, we would use Linking.openURL(program.sourceUrl)
                console.log("Opening source:", program.sourceUrl);
              }}
            >
              {t("common.visit")}
            </Button>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <Button variant='outline' size='md' onPress={() => router.back()}>
            {t("common.goBack")}
          </Button>
        </View>
      </ScrollView>
    </View>
  );
}

function getStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    loadingText: {
      color: theme.textSecondary,
      fontSize: 16,
      textAlign: "center",
      marginTop: spacing.xl,
    },
    errorText: {
      color: theme.danger,
      fontSize: 16,
      textAlign: "center",
      marginBottom: spacing.md,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      padding: spacing.lg,
      paddingBottom: spacing.md,
      borderBottomWidth: 1,
      borderColor: theme.border,
    },
    backButtonText: {
      color: theme.textPrimary,
      fontSize: 16,
    },
    title: {
      color: theme.textPrimary,
      fontSize: 24,
      fontWeight: 600 as const,
      flex: 1,
    },
    content: {
      flex: 1,
    },
    contentContainer: {
      padding: spacing.lg,
    },
    imageContainer: {
      marginBottom: spacing.lg,
      alignItems: "center",
    },
    placeholderImage: {
      width: 200,
      height: 150,
      backgroundColor: theme.surfaceElevated,
      borderRadius: radius.md,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: spacing.md,
    },
    placeholderText: {
      color: theme.textSecondary,
      fontSize: 16,
      textAlign: "center",
    },
    detailSection: {
      marginBottom: spacing.lg,
    },
    sectionTitle: {
      color: theme.textPrimary,
      fontSize: 20,
      fontWeight: 600 as const,
      marginBottom: spacing.md,
    },
    detailText: {
      color: theme.textSecondary,
      fontSize: 16,
      lineHeight: 22,
      marginBottom: spacing.md,
    },
    tagsContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.xs,
    },
    tagContainer: {
      marginRight: spacing.xs,
    },
    sourceContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: spacing.md,
    },
    sourceText: {
      color: theme.textSecondary,
      fontSize: 14,
    },
    careersList: {
      marginBottom: spacing.lg,
    },
    careerCard: {
      backgroundColor: theme.surfaceElevated,
      borderRadius: radius.md,
      padding: spacing.md,
      marginBottom: spacing.sm,
    },
    careerTitle: {
      color: theme.textPrimary,
      fontSize: 18,
      fontWeight: 600 as const,
      marginBottom: spacing.xs,
    },
    careerDetails: {
      marginBottom: spacing.xs,
    },
    careerDetailText: {
      color: theme.textSecondary,
      fontSize: 14,
    },
    actionButtons: {
      padding: spacing.lg,
      borderTopWidth: 1,
      borderColor: theme.border,
      flexDirection: "row",
      justifyContent: "center",
    },
  });
}
