import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Modal, StatusBar } from 'react-native';
import { router } from 'expo-router';
import { colors, spacing, title, body } from '../../src/theme';
import { Button, ConfirmDialog } from '../../src/components';
import { SettingsItem } from '../../src/components/SettingsItem';
import { SectionHeader } from '../../src/components/SectionHeader';
import { Card } from '../../src/components/Card';
import { Input } from '../../src/components/Input';
import { supabase } from '../../src/lib';

export default function ProfileScreen() {
  const [loading, setLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [userName, setUserName] = useState('Utilizator');
  const [userEmail, setUserEmail] = useState('user@example.com');

  useEffect(() => {
    const loadUserProfile = async () => {
      if (!supabase) return;

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Try multiple metadata fields for the name
          const displayName = user.user_metadata.display_name ||
                             user.user_metadata.name ||
                             user.user_metadata.full_name ||
                             user.user_metadata.username ||
                             user.email?.split('@')[0] ||
                             'Utilizator';

          setUserName(displayName);
          setUserEmail(user.email || 'user@example.com');
        }
      } catch (error) {
        console.error('Error loading user profile:', error);
      }
    };

    loadUserProfile();
  }, []);

  const handleLogout = async () => {
    await supabase?.auth.signOut();
    router.replace('/(auth)/screens/login');
  };

  const handleDeleteAccount = async () => {
    setShowDeleteDialog(false);
    setShowPasswordDialog(true);
  };

  const handleDeleteWithPassword = async () => {
    try {
      setLoading(true);
      setShowPasswordDialog(false);

      if (!supabase) {
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        return;
      }

      // Verify password by signing in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: deletePassword,
      });

      if (signInError) {
        alert('Parola incorectă');
        setDeletePassword('');
        return;
      }

      // Call Edge Function to delete account
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        alert('Eroare la obținerea sesiunii');
        return;
      }

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/delete-account`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      // Sign out after successful deletion
      await supabase.auth.signOut();
      router.replace('/(auth)/screens/login');
    } catch (error) {
      console.error('Delete account error:', error);
      alert('Eroare la ștergerea contului');
    } finally {
      setLoading(false);
      setDeletePassword('');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <SectionHeader
        title="Profilul meu"
        subtitle="Gestionează contul tău"
      />

      <Card style={styles.userCard}>
        <Text style={styles.userName}>{userName}</Text>
        <Text style={styles.userEmail}>{userEmail}</Text>
      </Card>

      <SettingsItem
        icon="User"
        label="Editează profilul"
        onPress={() => {}}
        squircle
      />
      <SettingsItem
        icon="Settings"
        label="Schimbă parola"
        onPress={() => {}}
        squircle
      />
      <SettingsItem
        icon="Settings"
        label="Exportă datele mele"
        onPress={() => {}}
        squircle
        lastItem
      />

      <View style={styles.section}>
        <SettingsItem
          icon="Settings"
          label="Politica de confidențialitate"
          onPress={() => router.push('/privacy-policy')}
          squircle
        />
        <SettingsItem
          icon="Settings"
          label="Termeni și condiții"
          onPress={() => router.push('/terms-of-service')}
          squircle
          lastItem
        />
      </View>

      <SettingsItem
        icon="Trash2"
        label="Șterge contul"
        onPress={() => setShowDeleteDialog(true)}
        showChevron={false}
        iconColor={colors.dark.danger}
        backgroundColor="rgba(239, 68, 68, 0.1)"
        textColor={colors.dark.danger}
        squircle
      />

      <Button
        title="Deconectare"
        onPress={handleLogout}
        variant="outline"
        style={styles.button}
      />

      <ConfirmDialog
        visible={showDeleteDialog}
        title="Șterge contul"
        message="Ești sigur că vrei să ștergi contul? Această acțiune este ireversibilă și va șterge toate datele tale."
        confirmText="Șterge"
        cancelText="Anulează"
        onConfirm={handleDeleteAccount}
        onCancel={() => setShowDeleteDialog(false)}
        isDestructive
      />

      <Modal
        visible={showPasswordDialog}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPasswordDialog(false)}
        statusBarTranslucent
      >
        <StatusBar barStyle="light-content" backgroundColor="rgba(0, 0, 0, 0.7)" />
        <View style={styles.overlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Confirmă parola</Text>
            <Text style={styles.modalMessage}>Introdu parola pentru a confirma ștergerea contului.</Text>
            
            <Input
              placeholder="Parola"
              value={deletePassword}
              onChangeText={setDeletePassword}
              secureTextEntry
              style={styles.passwordInput}
            />
          
            <View style={styles.buttons}>
              <Button
                title="Anulează"
                onPress={() => {
                  setShowPasswordDialog(false);
                  setDeletePassword('');
                }}
                variant="secondary"
                style={styles.button}
              />
              <Button
                title="Șterge"
                onPress={handleDeleteWithPassword}
                variant="danger"
                disabled={loading}
                style={styles.button}
              />
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.background,
  },
  content: {
    padding: spacing.lg,
  },
  userCard: {
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  userName: {
    ...title,
    color: colors.dark.textPrimary,
    marginBottom: spacing.xs,
  },
  userEmail: {
    color: colors.dark.textSecondary,
  },
  section: {
    marginBottom: spacing.sm,
  },
  button: {
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    paddingTop: 0,
  },
  modalContainer: {
    backgroundColor: colors.dark.surface,
    borderRadius: 16,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    ...title,
    color: colors.dark.textPrimary,
    marginBottom: spacing.md,
  },
  modalMessage: {
    ...body,
    color: colors.dark.textSecondary,
    marginBottom: spacing.xl,
  },
  passwordInput: {
    marginBottom: spacing.lg,
  },
  buttons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
});
