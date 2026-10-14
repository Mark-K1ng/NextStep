import { View, Text, Image, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Button, Input } from "@/components";
import { useTranslation } from "@/hooks/use-translation";
import { useState, useEffect } from "react";
import { useSupabase } from "@/hooks/use-supabase";
import { useTheme } from "@/hooks/use-theme";
import { spacing, radius, theme } from "@/theme";

export default function Profile() {
  const router = useRouter();
  const { t } = useTranslation();
  const { supabase } = useSupabase();
  const currentTheme = useTheme();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [county, setCounty] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [favoriteSubjects, setFavoriteSubjects] = useState<string[]>([]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.replace("/(auth)/login" as any);
          return;
        }

        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error) {
          throw error;
        }

        if (data) {
          setProfile(data);
          setDisplayName(data.display_name || "");
          setGradeLevel(data.grade_level || "");
          setCounty(data.county || "");
          setInterests(data.interests || []);
          setFavoriteSubjects(data.favorite_subjects || []);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [supabase, router]);

  const handleEdit = () => {
    setEditMode(true);
  };

  const handleSave = async () => {
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/(auth)/login" as any);
        return;
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: displayName || null,
          grade_level: gradeLevel || null,
          county: county || null,
          interests: interests.length > 0 ? interests : null,
          favorite_subjects:
            favoriteSubjects.length > 0 ? favoriteSubjects : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) {
        throw error;
      }

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (data) {
        setProfile(data);
      }

      setEditMode(false);
      alert("Profilul a fost actualizat cu succes!");
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Eroare la salvarea profilului. Vă rugăm să încercați din nou.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setDisplayName(profile?.display_name || "");
    setGradeLevel(profile?.grade_level || "");
    setCounty(profile?.county || "");
    setInterests(profile?.interests || []);
    setFavoriteSubjects(profile?.favorite_subjects || []);
    setEditMode(false);
  };

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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image
          source={require("@/assets/images/logo-glow.png")}
          style={styles.avatar}
          resizeMode='contain'
        />
        <View style={styles.info}>
          <Text style={styles.name}>{profile.display_name || ""}</Text>
          <Text style={styles.detail}>
            {t("profile.gradeLevel")}: {profile.grade_level || ""}
          </Text>
          <Text style={styles.detail}>
            {t("profile.county")}: {profile.county || ""}
          </Text>
        </View>
      </View>

      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>{t("common.interests")}</Text>
          <Text style={styles.statValue}>{profile.interests?.length || 0}</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>{t("common.favoriteSubjects")}</Text>
          <Text style={styles.statValue}>
            {profile.favorite_subjects?.length || 0}
          </Text>
        </View>
      </View>

      {editMode ? (
        <View style={styles.form}>
          <Input
            label={t("profile.displayName")}
            placeholder={t("profile.displayName")}
            value={displayName}
            onChangeText={setDisplayName}
          />
          <Input
            label={t("profile.gradeLevel")}
            placeholder={t("profile.gradeLevel")}
            value={gradeLevel}
            onChangeText={setGradeLevel}
          />
          <Input
            label={t("profile.county")}
            placeholder={t("profile.county")}
            value={county}
            onChangeText={setCounty}
          />
          <View style={styles.formActions}>
            <Button variant='outline' size='md' onPress={handleCancel}>
              {t("common.cancel")}
            </Button>
            <Button variant='primary' size='md' onPress={handleSave}>
              {t("common.save")}
            </Button>
          </View>
        </View>
      ) : (
        <View style={styles.profileSections}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {t("profile.favoriteSubjects")}
            </Text>
            <View style={styles.tags}>
              {profile.favorite_subjects &&
              profile.favorite_subjects.length > 0 ? (
                profile.favorite_subjects.map(
                  (subject: string, index: number) => (
                    <View key={index} style={styles.tag}>
                      <Text style={styles.tagText}>{subject}</Text>
                    </View>
                  )
                )
              ) : (
                <Text style={styles.noItems}>{t("common.noItems")}</Text>
              )}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t("common.interests")}</Text>
            <View style={styles.tags}>
              {profile.interests && profile.interests.length > 0 ? (
                profile.interests.map((interest: string, index: number) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>{interest}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.noItems}>{t("common.noItems")}</Text>
              )}
            </View>
          </View>
        </View>
      )}

      <View style={styles.actionButtons}>
        <Button variant='secondary' size='md' onPress={handleEdit}>
          {t("profile.editProfile")}
        </Button>
        <View style={styles.divider} />
        <Button
          variant='outline'
          size='md'
          onPress={() => router.push("/(settings)" as any)}
        >
          {t("common.settings")}
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
  header: {
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
  },
  info: {
    alignItems: "center",
  },
  name: {
    color: theme.textPrimary,
    fontSize: 20,
    fontWeight: "600" as const,
  },
  detail: {
    color: theme.textSecondary,
    fontSize: 16,
    marginBottom: spacing.xs,
  },
  stats: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: spacing.lg,
    padding: spacing.md,
    backgroundColor: theme.surfaceElevated,
    borderRadius: radius.md,
  },
  stat: {
    alignItems: "center",
  },
  statLabel: {
    color: theme.textSecondary,
    fontSize: 14,
  },
  statValue: {
    color: theme.textPrimary,
    fontSize: 18,
    fontWeight: "600" as const,
  },
  profileSections: {
    marginBottom: spacing.lg,
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
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  tag: {
    backgroundColor: theme.surfaceElevated,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
  },
  tagText: {
    color: theme.textPrimary,
    fontSize: 14,
  },
  noItems: {
    color: theme.textSecondary,
    fontSize: 14,
    fontStyle: "italic",
  },
  form: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  formActions: {
    flexDirection: "row",
    gap: spacing.md,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  divider: {
    width: 1,
    backgroundColor: theme.border,
    height: 40,
  },
  loadingText: {
    color: theme.textPrimary,
    fontSize: 18,
    textAlign: "center",
  },
  errorText: {
    color: theme.danger,
    fontSize: 18,
    textAlign: "center",
  },
});
