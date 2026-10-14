import { Button, Chip } from "@/components";
import { useSupabase } from "@/hooks/use-supabase";
import { useTheme } from "@/hooks/use-theme";
import { useTranslation } from "@/hooks/use-translation";
import type { Theme } from "@/theme";
import { radius, spacing } from "@/theme";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

interface CareerDisplay {
  id: string;
  name: string;
  description: string;
  domain: string;
  sourceUrl: string;
  skills: { name: string }[];
  programs: { name: string; university: string }[];
}

interface CareerRaw {
  id: string;
  name: string;
  description: string | null;
  domain: string | null;
  source_url: string | null;
  verified_at: string | null;
  career_skills: {
    id: string;
    importance: number;
    skills: {
      id: string;
      name: string;
    }[];
  }[];
  program_careers: {
    id: string;
    programs: {
      id: string;
      name: string;
      degree_level: string;
      duration_years: number;
      description: string | null;
      source_url: string | null;
      verified_at: string | null;
      universities: {
        id: string;
        name: string;
        city: string;
        website: string | null;
        source_url: string | null;
        verified_at: string | null;
      };
    };
  }[];
}

export default function CareerDetail() {
  const router = useRouter();
  const { t } = useTranslation();
  const { supabase } = useSupabase();
  const theme = useTheme(); // returns full theme object
  const styles = getStyles(theme);
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [career, setCareer] = useState<CareerDisplay | null>(null);

  useEffect(() => {
    const fetchCareer = async () => {
      if (!id) {
        setError("Invalid career ID");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const { data, error: queryError } = await supabase
          .from("careers")
          .select(
            `
            *,
            career_skills (
              *,
              skills (*)
            ),
            program_careers (
              *,
              programs (
                *,
                universities (*)
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
          setCareer(formatCareerData(data));
        } else {
          setError("Career not found");
        }
      } catch (err) {
        console.error("Error fetching career:", err);
        setError("Failed to load career details. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchCareer();
  }, [id, supabase]);

  // Format career data for display
  const formatCareerData = (rawData: CareerRaw): CareerDisplay => {
    return {
      id: rawData.id,
      name: rawData.name,
      description: rawData.description || "",
      domain: rawData.domain || "",
      sourceUrl: rawData.source_url || "",
      skills:
        rawData.career_skills?.flatMap((cs) =>
          cs.skills.map((skill) => ({
            name: skill.name,
          }))
        ) || [],
      programs:
        rawData.program_careers?.map((pc) => ({
          ...pc.programs,
          university: pc.programs?.universities?.name || "",
        })) || [],
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

  if (!career) {
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
        <Text style={styles.title}>{career.name}</Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.imageContainer}>
          {/* In a real app, we would display an image related to the career */}
          <View style={styles.placeholderImage}>
            <Text style={styles.placeholderText}>
              {t("career.imagePlaceholder")}
            </Text>
          </View>
        </View>

        <View style={styles.detailSection}>
          <Text style={styles.sectionTitle}>{t("career.description")}</Text>
          <Text style={styles.detailText}>{career.description}</Text>
        </View>

        <View style={styles.detailSection}>
          <Text style={styles.sectionTitle}>{t("career.domain")}</Text>
          <Text style={styles.detailText}>{career.domain}</Text>
        </View>

        {career.skills.length > 0 && (
          <View style={styles.detailSection}>
            <Text style={styles.sectionTitle}>{t("career.skills")}</Text>
            <View style={styles.tagsContainer}>
              {career.skills.map((skill, index) => (
                <View key={skill.name ?? index} style={styles.tagContainer}>
                  <Chip variant='secondary' size='sm'>
                    {skill.name}
                  </Chip>
                </View>
              ))}
            </View>
          </View>
        )}

        {career.programs.length > 0 && (
          <View style={styles.detailSection}>
            <Text style={styles.sectionTitle}>
              {t("career.relatedPrograms")}
            </Text>
            <View style={styles.programsList}>
              {career.programs.map((program, index) => (
                <View key={program.name ?? index} style={styles.programCard}>
                  <Text style={styles.programTitle}>{program.name}</Text>
                  <View style={styles.programDetails}>
                    <Text style={styles.programDetailText}>
                      {program.university}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.detailSection}>
          <Text style={styles.sectionTitle}>{t("career.source")}</Text>
          <View style={styles.sourceContainer}>
            <Text style={styles.sourceText}>{career.sourceUrl}</Text>
            <Button
              variant='outline'
              size='sm'
              onPress={() => {
                // In a real app, we would use Linking.openURL(career.sourceUrl)
                console.log("Opening source:", career.sourceUrl);
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
    container: { flex: 1, backgroundColor: theme.background },
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
    backButtonText: { color: theme.textPrimary, fontSize: 16 },
    title: {
      color: theme.textPrimary,
      fontSize: 24,
      fontWeight: 600 as const,
      flex: 1,
    },
    content: { flex: 1 },
    contentContainer: { padding: spacing.lg },
    imageContainer: { marginBottom: spacing.lg, alignItems: "center" },
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
    detailSection: { marginBottom: spacing.lg },
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
    tagsContainer: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
    tagContainer: { marginRight: spacing.xs },
    sourceContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: spacing.md,
    },
    sourceText: { color: theme.textSecondary, fontSize: 14 },
    programsList: { marginBottom: spacing.lg },
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
    programDetails: { marginBottom: spacing.xs },
    programDetailText: { color: theme.textSecondary, fontSize: 14 },
    programSkills: { marginTop: spacing.md },
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
    programSkillTag: { marginRight: spacing.xs },
    actionButtons: {
      padding: spacing.lg,
      borderTopWidth: 1,
      borderColor: theme.border,
      flexDirection: "row",
      justifyContent: "center",
    },
  });
}
