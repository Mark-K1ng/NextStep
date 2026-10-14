import { View, Text, StyleSheet, FlatList } from "react-native";
import { useRouter } from "expo-router";
import { Button, Chip, Card, EmptyState, Toast } from "@/components";
import { useTranslation } from "@/hooks/use-translation";
import { useState, useEffect } from "react";
import { useSupabase } from "@/hooks/use-supabase";
import { useTheme } from "@/hooks/use-theme";
import { spacing, radius, theme } from "@/theme";
import { analyzeGap } from "@/engine/gapAnalysis";
import { recommendCourses } from "@/engine/recommendationEngine";

export default function Recommendations() {
  const router = useRouter();
  const { t } = useTranslation();
  const { supabase } = useSupabase();
  const currentTheme = useTheme();
  const [gapAnalysis, setGapAnalysis] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      setRefreshing(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/(auth)/login" as any);
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError) {
        throw profileError;
      }

      const { data: goalsData, error: goalsError } = await supabase
        .from("user_goals")
        .select(
          `
          *,
          careers (*)
        `
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (goalsError) {
        throw goalsError;
      }

      const userGoal = goalsData && goalsData.length > 0 ? goalsData[0] : null;

      if (profileData && userGoal?.careers) {
        const userSkills = (profileData.interests || []).map(
          (interest: string, index: number) => ({
            id: String(index + 1),
            name: interest,
            level: 3 as const,
          })
        );

        const careerSkills = [
          {
            id: userGoal.careers.id,
            name: userGoal.careers.name,
            importance: 3 as const,
          },
        ];

        const { data: coursesData, error: coursesError } = await supabase.from(
          "courses"
        ).select(`
            *,
            course_skills (
              *,
              skills (*)
            )
          `);

        if (coursesError) {
          throw coursesError;
        }

        const formattedCourses = (coursesData || []).map((course: any) => ({
          id: course.id,
          title: course.title,
          provider: course.provider,
          url: course.url || "",
          language: course.language || "română",
          is_free: !!course.is_free,
          level: course.level || "începător",
          description: course.description || "",
          source_url: course.source_url || "",
          skills: (course.course_skills || []).map((cs: any) => ({
            id: cs.skills?.id || cs.skill_id || "",
            name: cs.skills?.name || "",
            depth: (cs.depth || 1) as any,
          })),
        }));

        const gapResult = analyzeGap(
          userSkills,
          careerSkills,
          formattedCourses
        );
        setGapAnalysis(gapResult);

        const recs = recommendCourses(gapResult, formattedCourses);
        setRecommendations(recs);
      }
    } catch (err) {
      console.error("Error loading recommendations:", err);
      setToastMessage("Failed to load recommendations. Please try again.");
      setToastVisible(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadRecommendations();
  }, [supabase, router]);

  const handleRefresh = () => {
    loadRecommendations();
  };

  const renderRecommendation = ({ item }: { item: any }) => {
    return (
      <Card style={styles.card} key={item.skill}>
        <View style={styles.cardContent}>
          <View style={styles.skillInfo}>
            <Text style={styles.skillTitle}>{item.skill}</Text>
            <View style={styles.skillLevels}>
              <View style={styles.levelIndicator}>
                <Text style={styles.levelText}>Nivel: 1/3</Text>
              </View>
              <View style={styles.levelIndicator}>
                <Text style={styles.levelText}>Necesar: 3/3</Text>
              </View>
            </View>
            <View style={styles.coursesList}>
              {item.courses.map((course: any, index: number) => (
                <View key={index} style={styles.courseItem}>
                  <Text style={styles.courseTitle}>{course.title}</Text>
                  <View style={styles.courseDetails}>
                    <Text style={styles.detailText}>
                      {course.provider} • {course.language}
                    </Text>
                    <Chip
                      variant={course.is_free ? "secondary" : "outline"}
                      size='sm'
                    >
                      {course.is_free ? t("common.isFree") : t("common.paid")}
                    </Chip>
                    <Chip variant='outline' size='sm'>
                      {course.level}
                    </Chip>
                  </View>
                  <Button
                    variant='outline'
                    size='sm'
                    onPress={() => {
                      router.push(`/course/${course.id}` as any);
                    }}
                  >
                    {t("common.open")}
                  </Button>
                </View>
              ))}
            </View>
          </View>
        </View>
      </Card>
    );
  };

  return (
    <>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{t("recommendations.title")}</Text>
          <Text style={styles.subtitle}>{t("recommendations.subtitle")}</Text>
          <Button variant='outline' size='md' onPress={handleRefresh}>
            {refreshing ? t("common.loading") : t("recommendations.refresh")}
          </Button>
        </View>

        {loading ? (
          <View style={styles.loading}>
            <Text style={styles.loadingText}>{t("common.loading")}</Text>
          </View>
        ) : gapAnalysis ? (
          <View style={styles.sections}>
            {gapAnalysis.covered && gapAnalysis.covered.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  {t("gapAnalysis.covered")} ({gapAnalysis.covered.length})
                </Text>
                <View style={styles.skillsList}>
                  {gapAnalysis.covered.map((skill: any, index: number) => (
                    <View key={index} style={styles.skillTag}>
                      <Text style={styles.skillTagText}>{skill.name}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
            {gapAnalysis.partial && gapAnalysis.partial.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  {t("gapAnalysis.partial")} ({gapAnalysis.partial.length})
                </Text>
                <View style={styles.skillsList}>
                  {gapAnalysis.partial.map((skill: any, index: number) => (
                    <View key={index} style={styles.skillTag}>
                      <Text style={styles.skillTagText}>
                        {skill.name} ({skill.level}/{skill.required})
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
            {gapAnalysis.missing && gapAnalysis.missing.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  {t("gapAnalysis.missing")} ({gapAnalysis.missing.length})
                </Text>
                <View style={styles.skillsList}>
                  {gapAnalysis.missing.map((skill: any, index: number) => (
                    <View key={index} style={styles.skillTag}>
                      <Text style={styles.skillTagText}>
                        {skill.name} ({skill.level}/{skill.required})
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>{t("common.noItems")}</Text>
          </View>
        )}

        {recommendations.length > 0 && (
          <View style={styles.recommendationsSection}>
            <Text style={styles.sectionTitle}>
              {t("recommendations.recommendedCourses")}
            </Text>
            <FlatList
              data={recommendations}
              keyExtractor={(item) => item.skill}
              renderItem={renderRecommendation}
              contentContainerStyle={styles.recommendationsListContainer}
            />
          </View>
        )}

        {recommendations.length === 0 &&
          gapAnalysis &&
          gapAnalysis.missing?.length > 0 && (
            <EmptyState
              title={t("recommendations.noCoursesTitle")}
              subtitle={t("recommendations.noCoursesSubtitle")}
              actionLabel={t("common.refresh")}
              onActionPress={handleRefresh}
            />
          )}
      </View>
      <Toast
        message={toastMessage}
        type='info'
        visible={toastVisible}
        onHide={() => setToastVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    padding: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderColor: theme.border,
  },
  title: {
    color: theme.textPrimary,
    fontSize: 24,
    fontWeight: "600" as const,
  },
  subtitle: {
    color: theme.textSecondary,
    fontSize: 16,
    marginTop: spacing.xs,
  },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: theme.textPrimary,
    fontSize: 18,
  },
  sections: {
    padding: spacing.lg,
  },
  section: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    color: theme.textPrimary,
    fontSize: 20,
    fontWeight: "600" as const,
    marginBottom: spacing.md,
  },
  skillsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  skillTag: {
    backgroundColor: theme.surfaceElevated,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
  },
  skillTagText: {
    color: theme.textPrimary,
    fontSize: 14,
  },
  recommendationsSection: {
    padding: spacing.lg,
    flex: 1,
  },
  recommendationsListContainer: {
    paddingBottom: spacing.lg,
  },
  card: {
    backgroundColor: theme.surface,
    marginBottom: spacing.md,
    borderRadius: radius.md,
    overflow: "hidden",
  },
  cardContent: {
    padding: spacing.md,
  },
  skillInfo: {
    marginBottom: spacing.md,
  },
  skillTitle: {
    color: theme.textPrimary,
    fontSize: 18,
    fontWeight: "600" as const,
  },
  skillLevels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.xs,
  },
  levelIndicator: {
    alignItems: "center",
  },
  levelText: {
    color: theme.textSecondary,
    fontSize: 14,
  },
  coursesList: {
    marginTop: spacing.md,
  },
  courseItem: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderColor: theme.border,
  },
  courseItemLast: {
    borderBottomWidth: 0,
  },
  courseTitle: {
    color: theme.textPrimary,
    fontSize: 16,
    fontWeight: "600" as const,
    marginBottom: spacing.xs,
  },
  courseDetails: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  detailText: {
    color: theme.textPrimary,
    fontSize: 14,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  emptyStateText: {
    color: theme.textSecondary,
    fontSize: 16,
    textAlign: "center",
  },
});
