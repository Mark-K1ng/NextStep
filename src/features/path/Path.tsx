import { View, Text, Image, StyleSheet, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Button } from "@/components";
import { useTranslation } from "@/hooks/use-translation";
import { useState, useEffect } from "react";
import { useSupabase } from "@/hooks/use-supabase";
import { useTheme } from "@/hooks/use-theme";
import { spacing, radius, theme } from "@/theme/tokens";

export default function Path() {
  const router = useRouter();
  const { t } = useTranslation();
  const { supabase } = useSupabase();
  const currentTheme = useTheme();
  const [goal, setGoal] = useState<any>(null);
  const [pathSteps, setPathSteps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPathData = async () => {
      try {
        setLoading(true);
        setError(null);

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

        const userGoal =
          goalsData && goalsData.length > 0 ? goalsData[0] : null;
        if (userGoal) {
          setGoal(userGoal.careers);
        }

        const { data: progressData, error: progressError } = await supabase
          .from("user_progress")
          .select("*")
          .eq("user_id", user.id);

        if (progressError) {
          throw progressError;
        }

        const steps = buildPathSteps(
          profileData,
          userGoal?.careers,
          progressData || []
        );
        setPathSteps(steps);
      } catch (err) {
        console.error("Error fetching path data:", err);
        setError("Failed to load path data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchPathData();
  }, [supabase, router]);

  const buildPathSteps = (
    profile: any,
    goalData: any,
    progress: any[]
  ): any[] => {
    const steps: any[] = [];
    const completedStepIds = new Set(progress.map((p: any) => p.ref_id));

    if (profile?.grade_level) {
      steps.push({
        id: `school_${profile.grade_level}`,
        type: "school",
        name: getSchoolNameByGrade(profile.grade_level),
        specialization: getSpecializationByGrade(profile.grade_level),
        status: completedStepIds.has(`school_${profile.grade_level}`)
          ? "completed"
          : "in_progress",
        description: `Studii la nivelul ${profile.grade_level}`,
      });
    }

    if (goalData) {
      steps.push({
        id: `career_${goalData.id}`,
        type: "career",
        name: goalData.name,
        domain: goalData.domain || "",
        description: goalData.description || "",
        status: completedStepIds.has(`career_${goalData.id}`)
          ? "completed"
          : "not_started",
      });
    }

    if (profile?.interests && profile.interests.length > 0) {
      profile.interests.forEach((interest: string, index: number) => {
        steps.push({
          id: `skill_${index}`,
          type: "skill",
          name: interest,
          level: 3,
          description: `Abilitate în ${interest}`,
          status: completedStepIds.has(`skill_${index}`)
            ? "completed"
            : "not_started",
        });
      });
    }

    return steps.sort((a, b) => {
      const typeOrder: Record<string, number> = {
        school: 1,
        skill: 2,
        career: 3,
      };
      return (typeOrder[a.type] || 0) - (typeOrder[b.type] || 0);
    });
  };

  const getSchoolNameByGrade = (grade: string): string => {
    const schoolNames: Record<string, string> = {
      V: "Liceul cu Programa Sportivă",
      VI: "Liceul Teoretic",
      VII: "Liceul Teoretic",
      VIII: "Liceul Teoretic",
      IX: "Liceul Teoretic",
      X: "Liceul Teoretic",
      XI: "Liceul Teoretic",
      XII: "Liceul Teoretic",
    };
    return schoolNames[grade] || "Liceul Teoretic";
  };

  const getSpecializationByGrade = (grade: string): string => {
    const specializations: Record<string, string> = {
      V: "Educație primară",
      VI: "Studii generale",
      VII: "Studii generale",
      VIII: "Studii generale",
      IX: "Profil uman sau real",
      X: "Profil uman sau real",
      XI: "Profil specializat",
      XII: "Profil specializat",
    };
    return specializations[grade] || "Studii generale";
  };

  const renderStep = ({ item }: { item: any }) => {
    const statusColors: Record<string, string> = {
      not_started: theme.textSecondary,
      in_progress: theme.primary,
      completed: theme.success,
    };

    const statusLabels: Record<string, string> = {
      not_started: t("myPath.status.notStarted"),
      in_progress: t("myPath.status.inProgress"),
      completed: t("myPath.status.completed"),
    };

    return (
      <View
        key={item.id}
        style={[
          styles.stepContainer,
          item.status === "completed" && styles.stepCompleted,
        ]}
      >
        <View style={styles.stepCircle}>
          <View
            style={[
              styles.stepCircleInner,
              {
                backgroundColor:
                  statusColors[item.status] || theme.textSecondary,
                width: item.status === "completed" ? 12 : 8,
                height: item.status === "completed" ? 12 : 8,
              },
            ]}
          />
        </View>
        <View style={styles.stepContent}>
          <View style={styles.stepHeader}>
            <Text style={styles.stepTitle}>
              {item.type === "school"
                ? item.name
                : item.type === "program"
                  ? item.name
                  : item.type === "course"
                    ? item.title
                    : item.type === "skill"
                      ? item.name
                      : ""}
            </Text>
            <Text style={styles.stepSubtitle}>
              {item.type === "school"
                ? item.specialization
                : item.type === "program"
                  ? `${item.degreeLevel} • ${item.duration}`
                  : item.type === "course"
                    ? `${item.provider} • ${item.language}`
                    : item.type === "skill"
                      ? `Nivel ${item.level}`
                      : ""}
            </Text>
          </View>
          <Text style={styles.stepDescription}>{item.description}</Text>
          <View style={styles.stepStatus}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>
              {statusLabels[item.status] || item.status}
            </Text>
          </View>
        </View>
        {item.status !== "completed" &&
          item.id !== pathSteps[pathSteps.length - 1]?.id && (
            <View style={styles.stepConnector}>
              <View style={styles.connectorLine} />
            </View>
          )}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.goalInfo}>
          <Image
            source={require("@/assets/images/logo-glow.png")}
            style={styles.goalIcon}
            resizeMode='contain'
          />
          <View style={styles.goalDetails}>
            <Text style={styles.goalTitle}>{t("myPath.goalCareer")}</Text>
            <Text style={styles.goalName}>{goal?.name || ""}</Text>
            <Text style={styles.goalDescription}>
              {goal?.description || ""}
            </Text>
          </View>
        </View>
        <Button
          variant='outline'
          size='md'
          onPress={() => {
            router.push("/_tabs/profile" as any);
          }}
        >
          {t("myPath.edit")}
        </Button>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.pathContainer}>
        {loading ? (
          <View style={styles.loading}>
            <Text style={styles.loadingText}>{t("common.loading")}</Text>
          </View>
        ) : (
          <View style={styles.steps}>
            {pathSteps.map((step, index) => (
              <View key={step.id || index}>
                {renderStep({ item: step })}
                {index < pathSteps.length - 1 && (
                  <View style={styles.pathDivider}>
                    <View style={styles.dividerLine} />
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={styles.actionButtons}>
        <Button
          variant='primary'
          size='md'
          onPress={() => {
            router.push("/_tabs/explore" as any);
          }}
        >
          {t("myPath.analyzeGap")}
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  goalInfo: {
    flex: 1,
  },
  goalIcon: {
    width: 60,
    height: 60,
    borderRadius: radius.lg,
    marginRight: spacing.md,
  },
  goalDetails: {
    flex: 1,
  },
  goalTitle: {
    color: theme.textSecondary,
    fontSize: 16,
    marginBottom: spacing.xs,
  },
  goalName: {
    color: theme.textPrimary,
    fontSize: 20,
    fontWeight: "600" as const,
  },
  goalDescription: {
    color: theme.textSecondary,
    fontSize: 14,
  },
  pathContainer: {
    flex: 1,
  },
  steps: {
    paddingVertical: spacing.lg,
  },
  stepContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: spacing.md,
  },
  stepCompleted: {},
  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: radius.lg,
    backgroundColor: theme.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  stepCircleInner: {
    width: 16,
    height: 16,
    borderRadius: radius.md,
    backgroundColor: theme.primary,
  },
  stepContent: {
    flex: 1,
  },
  stepHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  stepTitle: {
    color: theme.textPrimary,
    fontSize: 18,
    fontWeight: "600" as const,
  },
  stepSubtitle: {
    color: theme.textSecondary,
    fontSize: 14,
  },
  stepDescription: {
    color: theme.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  stepStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: radius.xs,
    backgroundColor: theme.primary,
  },
  statusText: {
    color: theme.textPrimary,
    fontSize: 12,
  },
  stepConnector: {
    width: 24,
    alignItems: "center",
  },
  connectorLine: {
    width: 2,
    height: "100%",
    backgroundColor: theme.border,
  },
  pathDivider: {
    paddingVertical: spacing.lg,
  },
  dividerLine: {
    width: 2,
    backgroundColor: theme.border,
    alignSelf: "center",
  },
  errorContainer: {
    padding: spacing.lg,
    marginVertical: spacing.md,
    alignItems: "center",
  },
  errorText: {
    color: theme.danger,
    fontSize: 16,
    textAlign: "center",
  },
  actionButtons: {
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
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
});
