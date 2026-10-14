import { View, Text, Image, StyleSheet, ScrollView } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Button, Input, Chip, Card } from "@/components";
import { useTranslation } from "@/hooks/use-translation";
import { useState, useEffect } from "react";
import { useSupabase } from "@/hooks/use-supabase";
import { useTheme } from "@/hooks/use-theme";
import { spacing, radius } from "@/theme";
import type { Theme } from "@/theme";
export default function SchoolDetail() {
  const router = useRouter();
  const { t } = useTranslation();
  const { supabase } = useSupabase();
  const theme = useTheme();
  const styles = getStyles(theme);
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [school, setSchool] = useState<any>(null);

  useEffect(() => {
    const fetchSchool = async () => {
      if (!id) {
        setError("Invalid school ID");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const { data, error: queryError } = await supabase
          .from("schools")
          .select(
            `
            *,
            school_profiles (
              *,
              school_profile_programs (
                *,
                programs (
                  *,
                  program_skills (
                    *,
                    skills (*)
                  ),
                  program_careers (
                    *,
                    careers (*)
                  )
                )
              )
            )
          `
          )
          .eq("id", id)
          .single();

        if (queryError) {
          throw queryError;
        }

        if (data) {
          setSchool(formatSchoolData(data));
        } else {
          setError("School not found");
        }
      } catch (err) {
        console.error("Error fetching school:", err);
        setError("Failed to load school details. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchSchool();
  }, [id, supabase]);

  // Format school data for display
  const formatSchoolData = (rawData: any) => {
    return {
      id: rawData.id,
      name: rawData.name,
      city: rawData.city,
      county: rawData.county,
      website: rawData.website,
      description: rawData.description,
      sourceUrl: rawData.source_url,
      specialization: rawData.school_profiles?.[0]?.specialization || "",
      keySubjects: rawData.school_profiles?.[0]?.key_subjects || [],
      admissionNotes: rawData.school_profiles?.[0]?.admission_notes || "",
      programs:
        rawData.school_profiles?.[0]?.school_profile_programs?.map(
          (spp: any) => ({
            ...spp.programs,
            skills:
              spp.programs?.program_skills?.map((ps: any) => ps.skills) || [],
            careers:
              spp.programs?.program_careers?.map((pc: any) => pc.careers) || [],
          })
        ) || [],
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

  if (!school) {
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
        <Text style={styles.title}>{school.name}</Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.imageContainer}>
          {/* In a real app, we would display the school's image or logo */}
          <View style={styles.placeholderImage}>
            <Text style={styles.placeholderText}>
              {t("school.imagePlaceholder")}
            </Text>
          </View>
        </View>

        <View style={styles.detailSection}>
          <Text style={styles.sectionTitle}>{t("school.description")}</Text>
          <Text style={styles.detailText}>{school.description}</Text>
        </View>

        <View style={styles.detailSection}>
          <Text style={styles.sectionTitle}>{t("school.specialization")}</Text>
          <Text style={styles.detailText}>{school.specialization}</Text>
        </View>

        <View style={styles.detailSection}>
          <Text style={styles.sectionTitle}>{t("school.keySubjects")}</Text>
          <View style={styles.tagsContainer}>
            {school.keySubjects.map((subject: string, index: number) => (
              <View key={index} style={styles.tagContainer}>
                <Chip variant='secondary' size='sm'>
                  {subject}
                </Chip>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.detailSection}>
          <Text style={styles.sectionTitle}>{t("school.admissionNotes")}</Text>
          <Text style={styles.detailText}>
            {school.admissionNotes || t("common.notAvailable")}
          </Text>
        </View>

        <View style={styles.detailSection}>
          <Text style={styles.sectionTitle}>{t("school.website")}</Text>
          <View style={styles.websiteContainer}>
            <Text style={styles.websiteText}>{school.website}</Text>
            <Button
              variant='outline'
              size='sm'
              onPress={() => {
                // In a real app, we would use Linking.openURL(school.website)
                console.log("Opening website:", school.website);
              }}
            >
              {t("common.visit")}
            </Button>
          </View>
        </View>

        <View style={styles.detailSection}>
          <Text style={styles.sectionTitle}>{t("school.source")}</Text>
          <View style={styles.sourceContainer}>
            <Text style={styles.sourceText}>{school.sourceUrl}</Text>
            <Button
              variant='outline'
              size='sm'
              onPress={() => {
                // In a real app, we would use Linking.openURL(school.sourceUrl)
                console.log("Opening source:", school.sourceUrl);
              }}
            >
              {t("common.visit")}
            </Button>
          </View>
        </View>

        {school.programs.length > 0 && (
          <View style={styles.detailSection}>
            <Text style={styles.sectionTitle}>
              {t("school.relatedPrograms")}
            </Text>
            <View style={styles.programsList}>
              {school.programs.map((program: any, index: number) => (
                <View key={index} style={styles.programCard}>
                  <Text style={styles.programTitle}>{program.name}</Text>
                  <View style={styles.programDetails}>
                    <Text style={styles.programDetailText}>
                      {program.degree_level} • {program.duration_years} ani
                    </Text>
                  </View>
                  {program.skills && program.skills.length > 0 && (
                    <View style={styles.programSkills}>
                      <Text style={styles.programSkillsLabel}>
                        {t("common.skills")}:
                      </Text>
                      <View style={styles.programSkillsTags}>
                        {program.skills.map(
                          (skill: any, skillIndex: number) => (
                            <View
                              key={skillIndex}
                              style={styles.programSkillTag}
                            >
                              <Chip variant='outline' size='xs'>
                                {skill.name}
                              </Chip>
                            </View>
                          )
                        )}
                      </View>
                    </View>
                  )}
                  {program.careers && program.careers.length > 0 && (
                    <View style={styles.programCareers}>
                      <Text style={styles.programSkillsLabel}>
                        {t("common.careers")}:
                      </Text>
                      <View style={styles.programCareersTags}>
                        {program.careers.map(
                          (career: any, careerIndex: number) => (
                            <View
                              key={careerIndex}
                              style={styles.programCareerTag}
                            >
                              <Chip variant='outline' size='xs'>
                                {career.name}
                              </Chip>
                            </View>
                          )
                        )}
                      </View>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

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
    websiteContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: spacing.md,
    },
    websiteText: {
      color: theme.textSecondary,
      fontSize: 14,
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
    programsList: {
      marginBottom: spacing.lg,
    },
    programCard: {
      backgroundColor: theme.surfaceElevated,
      borderRadius: radius.md,
      padding: spacing.md,
      marginBottom: spacing.sm,
    },
    programTitle: {
      color: theme.textPrimary,
      fontSize: 18,
      fontWeight: 600 as const,
      marginBottom: spacing.xs,
    },
    programDetails: {
      marginBottom: spacing.xs,
    },
    programDetailText: {
      color: theme.textSecondary,
      fontSize: 14,
    },
    programSkills: {
      marginTop: spacing.md,
    },
    programSkillsLabel: {
      color: theme.textSecondary,
      fontSize: 14,
      marginBottom: spacing.xs,
    },
    programSkillsTags: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.xs,
    },
    programSkillTag: {
      marginRight: spacing.xs,
    },
    programCareers: {
      marginTop: spacing.md,
    },
    programCareersLabel: {
      color: theme.textSecondary,
      fontSize: 14,
      marginBottom: spacing.xs,
    },
    programCareersTags: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.xs,
    },
    programCareerTag: {
      marginRight: spacing.xs,
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
