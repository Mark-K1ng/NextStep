import {
  View,
  Text,
  Image,
  StyleSheet,
  Switch,
  Pressable,
  Linking,
} from "react-native";
import { useRouter } from "expo-router";
import { Button } from "@/components";
import { useTranslation } from "@/hooks/use-translation";
import { useState, useEffect } from "react";
import { useSupabase } from "@/hooks/use-supabase";
import { useTheme } from "@/hooks/use-theme";
import { spacing, radius, theme } from "@/theme";

export default function Settings() {
  const router = useRouter();
  const { t } = useTranslation();
  const { supabase } = useSupabase();
  const currentTheme = useTheme();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [themeMode, setThemeMode] = useState("system");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [dataExportVisible, setDataExportVisible] = useState(false);
  const [deleteAccountVisible, setDeleteAccountVisible] = useState(false);
  const [exportingData, setExportingData] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

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
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [supabase, router]);

  const handleEditProfile = () => {
    router.push("/_tabs/profile" as any);
  };

  const handleChangeTheme = (value: string) => {
    setThemeMode(value);
  };

  const handleExportData = () => {
    setDataExportVisible(true);
  };

  const handleDeleteAccount = () => {
    setDeleteAccountVisible(true);
  };

  const handleConfirmExport = async () => {
    setExportingData(true);
    setDataExportVisible(false);

    try {
      const { data, error } = await supabase.functions.invoke("export-data");
      if (error) {
        throw error;
      }
      alert(
        t("profile.exportSuccess") || "Datele au fost exportate cu succes!"
      );
    } catch (error) {
      console.error("Error exporting data:", error);
      alert("Eroare la exportul datelor. Vă rugăm să încercați din nou.");
    } finally {
      setExportingData(false);
    }
  };

  const handleConfirmDelete = async () => {
    setDeletingAccount(true);
    setDeleteAccountVisible(false);

    try {
      const { error } = await supabase.functions.invoke("delete-account");
      if (error) {
        throw error;
      }
      await supabase.auth.signOut();
      router.replace("/(auth)/login" as any);
    } catch (error) {
      console.error("Error deleting account:", error);
      alert("Eroare la ștergerea contului. Vă rugăm să încercați din nou.");
    } finally {
      setDeletingAccount(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.replace("/(auth)/login" as any);
    } catch (error) {
      console.error("Error signing out:", error);
      alert("Eroare la delogare. Vă rugăm să încercați din nou.");
    }
  };

  const handleOpenPrivacy = () => {
    Linking.openURL("https://your-app.com/privacy");
  };

  const handleOpenTerms = () => {
    Linking.openURL("https://your-app.com/terms");
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

  const settingsItems = [
    {
      id: "profile",
      title: t("profile.editProfile"),
      icon: "user",
      onPress: handleEditProfile,
    },
    {
      id: "theme",
      title: t("settings.appearance"),
      icon: "palette",
      switch: {
        label: t("settings.darkMode"),
        value: themeMode === "dark",
        onChange: (value: boolean) =>
          handleChangeTheme(value ? "dark" : "light"),
      },
    },
    {
      id: "notifications",
      title: t("settings.notifications"),
      icon: "bell",
      switch: {
        label: t("settings.enableNotifications"),
        value: notificationsEnabled,
        onChange: setNotificationsEnabled,
      },
    },
    {
      id: "privacy",
      title: t("profile.privacyPolicy"),
      icon: "lock",
      onPress: handleOpenPrivacy,
    },
    {
      id: "terms",
      title: t("profile.terms"),
      icon: "file-text",
      onPress: handleOpenTerms,
    },
    {
      id: "export",
      title: t("profile.exportData"),
      icon: "download",
      onPress: handleExportData,
    },
    {
      id: "delete",
      title: t("profile.deleteAccount"),
      icon: "trash-2",
      onPress: handleDeleteAccount,
    },
    {
      id: "logout",
      title: t("auth.signOut") || "Deconectare",
      icon: "log-out",
      onPress: handleLogout,
    },
  ];

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
          <Text style={styles.email}>{profile.email || ""}</Text>
        </View>
      </View>

      <View style={styles.settingsList}>
        {settingsItems.map((item, index) => (
          <View key={item.id} style={styles.settingsItem}>
            <Pressable
              style={styles.settingsItemContent}
              onPress={item.onPress}
            >
              <View style={styles.settingsItemLeft}>
                <Text style={styles.settingsItemTitle}>{item.title}</Text>
              </View>
              {item.switch ? (
                <View style={styles.settingsItemSwitch}>
                  <Text style={styles.settingsItemSwitchLabel}>
                    {item.switch.label}
                  </Text>
                  <Switch
                    trackColor={{ false: theme.border, true: theme.primary }}
                    thumbColor={
                      item.switch.value ? theme.background : theme.background
                    }
                    ios_backgroundColor='#3E3E3E'
                    value={item.switch.value}
                    onValueChange={item.switch.onChange}
                  />
                </View>
              ) : (
                <Text style={styles.arrowText}>›</Text>
              )}
            </Pressable>
            {index < settingsItems.length - 1 && (
              <View style={styles.divider} />
            )}
          </View>
        ))}
      </View>

      {/* Modals */}
      {dataExportVisible && (
        <View style={styles.modalBackground}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t("profile.exportData")}</Text>
            <Text style={styles.modalText}>
              {exportingData
                ? t("common.exporting")
                : t("profile.exportSuccess")}
            </Text>
            <View style={styles.modalActions}>
              <Button
                variant='outline'
                size='md'
                onPress={() => setDataExportVisible(false)}
                disabled={exportingData}
              >
                {t("common.cancel")}
              </Button>
              <Button
                variant='primary'
                size='md'
                onPress={handleConfirmExport}
                disabled={exportingData}
              >
                {t("common.confirm")}
              </Button>
            </View>
          </View>
        </View>
      )}

      {deleteAccountVisible && (
        <View style={styles.modalBackground}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t("profile.deleteAccount")}</Text>
            <Text style={styles.modalText}>
              {deletingAccount
                ? t("common.deleting")
                : t("profile.confirmDelete")}
            </Text>
            <View style={styles.modalActions}>
              <Button
                variant='outline'
                size='md'
                onPress={() => setDeleteAccountVisible(false)}
                disabled={deletingAccount}
              >
                {t("common.cancel")}
              </Button>
              <Button
                variant='primary'
                size='md'
                onPress={handleConfirmDelete}
                disabled={deletingAccount}
              >
                {t("common.delete")}
              </Button>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderColor: theme.border,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: radius.lg,
    marginRight: spacing.md,
  },
  info: {
    flex: 1,
  },
  name: {
    color: theme.textPrimary,
    fontSize: 20,
    fontWeight: "600" as const,
  },
  email: {
    color: theme.textSecondary,
    fontSize: 16,
  },
  settingsList: {
    flex: 1,
  },
  settingsItem: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderColor: theme.border,
  },
  settingsItemContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  settingsItemLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  settingsItemTitle: {
    color: theme.textPrimary,
    fontSize: 16,
  },
  settingsItemSwitch: {
    flexDirection: "row",
    alignItems: "center",
  },
  settingsItemSwitchLabel: {
    color: theme.textSecondary,
    fontSize: 14,
    marginRight: spacing.xs,
  },
  arrowText: {
    color: theme.textSecondary,
    fontSize: 20,
  },
  divider: {
    height: 1,
    backgroundColor: theme.border,
    marginTop: spacing.sm,
  },
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: theme.surface,
    padding: spacing.lg,
    borderRadius: radius.md,
    width: "80%",
    maxWidth: 400,
  },
  modalTitle: {
    color: theme.textPrimary,
    fontSize: 20,
    fontWeight: "600" as const,
    marginBottom: spacing.md,
  },
  modalText: {
    color: theme.textSecondary,
    fontSize: 16,
    marginBottom: spacing.md,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.md,
  },
  loadingText: {
    color: theme.textPrimary,
    fontSize: 18,
    textAlign: "center",
    marginTop: spacing.xl,
  },
  errorText: {
    color: theme.danger,
    fontSize: 18,
    textAlign: "center",
    marginTop: spacing.xl,
  },
});
