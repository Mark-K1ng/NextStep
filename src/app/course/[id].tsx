import { Button, Chip } from "@/components";
import { useSupabase } from "@/hooks/use-supabase";
import { useTheme } from "@/hooks/use-theme";
import { useTranslation } from "@/hooks/use-translation";
import type { Theme } from "@/theme";
import { radius, spacing } from "@/theme";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

interface CourseRaw {
  id: string;
  title: string;
  provider: string;
  url: string;
  language: string;
  is_free: boolean;
  level: string;
  description: string | null;
  source_url: string | null;
  course_skills: {
    id: string;
    skills: {
      id: string;
      name: string;
      depth: number;
    }[];
  }[];
}

interface CourseDisplay {
  id: string;
  title: string;
  provider: string;
  url: string;
  language: string;
  isFree: boolean;
  level: string;
  description: string;
  sourceUrl: string;
  skills: string[];
}

export default function CourseDetail() {
  const router = useRouter();
  const { t } = useTranslation();
  const { supabase } = useSupabase();
  const theme = useTheme();
  const styles = getStyles(theme);
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [course, setCourse] = useState<CourseDisplay | null>(null);

  useEffect(() => {
    const fetchCourse = async () => {
      if (!id) {
        setError("Invalid course ID");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const { data, error: queryError } = await supabase
          .from("courses")
          .select(
            `
            *,
            course_skills (
              *,
              skills (*)
            )
          `
          )
          .eq("id", id)
          .single<CourseRaw>();

        if (queryError) {
          throw queryError;
        }

        if (data) {
          setCourse(formatCourseData(data));
        } else {
          setError("Course not found");
        }
      } catch (err) {
        console.error("Error fetching course:", err);
        setError("Failed to load course details. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [id, supabase]);

  // Format course data for display
  const formatCourseData = (rawData: CourseRaw): CourseDisplay => {
    return {
      id: rawData.id,
      title: rawData.title || "",
      provider: rawData.provider || "",
      url: rawData.url || "",
      language: rawData.language || "română",
      isFree: rawData.is_free ?? false,
      level: rawData.level || "începător",
      description: rawData.description || "",
      sourceUrl: rawData.source_url || "",
      skills:
        rawData.course_skills?.flatMap((cs) =>
          cs.skills.map((skill) => skill.name)
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

  if (!course) {
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
        <Text style={styles.title}>{course.title}</Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.imageContainer}>
          {/* In a real app, we would display an image related to the course */}
          <View style={styles.placeholderImage}>
            <Text style={styles.placeholderText}>
              {t("course.imagePlaceholder")}
            </Text>
          </View>
        </View>

        <View style={styles.detailSection}>
          <Text style={styles.sectionTitle}>{t("course.description")}</Text>
          <Text style={styles.detailText}>{course.description}</Text>
        </View>

        <View style={styles.detailSection}>
          <Text style={styles.sectionTitle}>{t("course.provider")}</Text>
          <Text style={styles.detailText}>{course.provider}</Text>
        </View>

        <View style={styles.detailSection}>
          <Text style={styles.sectionTitle}>{t("course.language")}</Text>
          <Text style={styles.detailText}>{course.language}</Text>
        </View>

        <View style={styles.detailSection}>
          <Text style={styles.sectionTitle}>{t("course.level")}</Text>
          <Text style={styles.detailText}>{course.level}</Text>
        </View>

        <View style={styles.detailSection}>
          <Text style={styles.sectionTitle}>{t("course.isFree")}</Text>
          <Text style={styles.detailText}>
            {course.isFree ? t("common.isFree") : t("common.paid")}
          </Text>
        </View>

        {course.skills.length > 0 && (
          <View style={styles.detailSection}>
            <Text style={styles.sectionTitle}>{t("course.skills")}</Text>
            <View style={styles.tagsContainer}>
              {course.skills.map((skill, index) => (
                <View key={skill} style={styles.tagContainer}>
                  <Chip variant='secondary' size='sm'>
                    {skill}
                  </Chip>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.detailSection}>
          <Text style={styles.sectionTitle}>{t("course.url")}</Text>
          <View style={styles.urlContainer}>
            <Text style={styles.urlText}>{course.url}</Text>
            <Button
              variant='outline'
              size='sm'
              onPress={() => {
                // In a real app, we would use Linking.openURL(course.url)
                console.log("Opening URL:", course.url);
              }}
            >
              {t("common.visit")}
            </Button>
          </View>
        </View>

        <View style={styles.detailSection}>
          <Text style={styles.sectionTitle}>{t("course.source")}</Text>
          <View style={styles.sourceContainer}>
            <Text style={styles.sourceText}>{course.sourceUrl}</Text>
            <Button
              variant='outline'
              size='sm'
              onPress={() => {
                // In a real app, we would use Linking.openURL(course.sourceUrl)
                console.log("Opening source:", course.sourceUrl);
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
    urlContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: spacing.md,
    },
    urlText: {
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
    actionButtons: {
      padding: spacing.lg,
      borderTopWidth: 1,
      borderColor: theme.border,
      flexDirection: "row",
      justifyContent: "center",
    },
  });
}
