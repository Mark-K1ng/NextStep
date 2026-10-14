import { View, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Button } from "@/components";
import type { Theme } from "@/theme";
import { useTranslation } from "@/hooks/use-translation";
import { useState, useEffect } from "react";
import { useTheme } from "@/hooks/use-theme";
import { useSupabase } from "@/hooks/use-supabase";
import { spacing, radius } from "@/theme";

import { analyzeGap } from "@/engine/gapAnalysis";
import type { GapAnalysisResult } from "@/engine/gapAnalysis";
import { recommendCourses } from "@/engine/recommendationEngine";

export default function HomeTab() {
  const router = useRouter();
  const { t } = useTranslation();
  const { supabase } = useSupabase();
  const theme = useTheme();
  const styles = getStyles(theme);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [gapAnalysis, setGapAnalysis] = useState<GapAnalysisResult | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfileAndData = async () => {
      try {
        setLoading(true);

        // Fetch profile
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          router.replace("/(auth)/login");
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

        // Fetch user goals
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

        const userGoal =
          goalsData && goalsData.length > 0 ? goalsData[0] : null;

        if (profileData) {
          setProfile(profileData);
          setGoal(userGoal?.careers || null);
        }

        // If we have both profile and goal, calculate gap analysis and recommendations
        if (profileData && userGoal?.careers) {
          try {
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

            const mockCourses = [
              {
                id: "1",
                title: "Introducere în programare cu Python",
                provider: "Coursera",
                url: "https://www.coursera.org/learn/python",
                language: "engleză",
                is_free: true,
                level: "începător",
                skills: [
                  {
                    id: userGoal.careers.id,
                    name: userGoal.careers.name,
                    depth: 3 as const,
                  },
                ],
              },
            ];

            const gapResult = analyzeGap(userSkills, careerSkills, mockCourses);
            setGapAnalysis(gapResult);

            // We compute recommendations but do not store them for now
            recommendCourses(gapResult, mockCourses);
          } catch (engineError) {
            console.error(
              "Error calculating gap analysis or generating recommendations:",
              engineError
            );
          }
        }
      } catch (error) {
        console.error("Error fetching home tab data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileAndData();
  }, [supabase, router]);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>{t("common.loading")}</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{t("errors.serverError")}</Text>
      </View>
    );
  }

  const missingList = gapAnalysis?.missing || [];

  return (
    <View style={styles.container}>
      <View style={styles.greeting}>
        <Text style={styles.greetingText}>
          {t("home.greeting", { name: profile.display_name || "" })}
        </Text>
      </View>

      {goal && (
        <View style={styles.goalCard}>
          <Text style={styles.goalTitle}>{t("home.currentGoal")}</Text>
          <Text style={styles.goalText}>{goal.name}</Text>
        </View>
      )}

      {gapAnalysis && (
        <View style={styles.nextStepCard}>
          <Text style={styles.stepTitle}>{t("home.nextStep")}</Text>
          {missingList.length > 0 ? (
            <View>
              {missingList.map((skill) => {
                const step = gapAnalysis.steps.find(
                  (s) => s.skill === skill.name
                );
                const courses = step?.courses || [];
                return (
                  <View key={skill.id} style={styles.skillItem}>
                    <Text style={styles.skillText}>{skill.name}</Text>
                    {courses.length > 0 && (
                      <View style={styles.courseList}>
                        {courses.map((course) => (
                          <View key={course.id} style={styles.courseItem}>
                            <Text style={styles.courseText}>
                              {course.title} ({course.provider})
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          ) : (
            <Text style={styles.stepText}>{t("home.noMissingSkills")}</Text>
          )}
        </View>
      )}

      <View style={styles.quickActions}>
        <Button
          variant='primary'
          size='md'
          onPress={() => router.push("/_tabs/explore")}
        >
          {t("home.explore")}
        </Button>
        <Button
          variant='secondary'
          size='md'
          onPress={() => router.push("/_tabs/path")}
        >
          {t("home.myPath")}
        </Button>
      </View>
    </View>
  );
}

function getStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
      padding: spacing.lg,
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
      marginTop: spacing.xl,
    },
    greeting: {
      marginBottom: spacing.md,
    },
    greetingText: {
      color: theme.textPrimary,
      fontSize: 20,
      fontWeight: "600" as const,
    },
    goalCard: {
      backgroundColor: theme.surfaceElevated,
      padding: spacing.md,
      borderRadius: radius.md,
      marginBottom: spacing.md,
    },
    goalTitle: {
      color: theme.textSecondary,
      fontSize: 16,
      marginBottom: spacing.xs,
    },
    goalText: {
      color: theme.textPrimary,
      fontSize: 18,
      fontWeight: "600" as const,
    },
    nextStepCard: {
      backgroundColor: theme.surface,
      padding: spacing.md,
      borderRadius: radius.md,
      marginBottom: spacing.lg,
    },
    stepTitle: {
      color: theme.textSecondary,
      fontSize: 16,
      marginBottom: spacing.xs,
    },
    stepText: {
      color: theme.textPrimary,
      fontSize: 18,
    },
    skillItem: {
      marginBottom: spacing.xs,
    },
    skillText: {
      color: theme.textSecondary,
      fontSize: 16,
    },
    courseList: {
      marginTop: spacing.xs,
    },
    courseItem: {
      marginBottom: spacing.xs,
    },
    courseText: {
      color: theme.textPrimary,
      fontSize: 14,
    },
    quickActions: {
      flexDirection: "row",
      gap: spacing.md,
    },
  });
}

interface Profile {
  id: string;
  display_name: string;
  grade_level: string;
  county: string;
  interests: string[];
  favorite_subjects: string[];
  created_at: string;
  updated_at: string;
}

interface Goal {
  id: string;
  name: string;
  description?: string;
  domain?: string;
  source_url?: string;
  verified_at?: string;
}
