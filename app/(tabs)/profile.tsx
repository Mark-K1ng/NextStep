import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Modal, StatusBar } from 'react-native';
import { router } from 'expo-router';
import { colors, spacing, title, body } from '../../src/theme';
import { Button, ConfirmDialog } from '../../src/components';
import { SettingsItem } from '../../src/components/SettingsItem';
import { SectionHeader } from '../../src/components/SectionHeader';
import { Card } from '../../src/components/Card';
import { Input } from '../../src/components/Input';
import { CheckboxGroup } from '../../src/components/CheckboxGroup';
import { useUserProfile } from '../../src/hooks/useUserProfile';
import { supabase } from '../../src/lib';

const INTERESTS = ['Tehnologie', 'Artă', 'Sport', 'Muzică', 'Știință', 'Business', 'Medicină', 'Drept', 'Educație', 'Inginerie'];
const SUBJECTS = ['Matematică', 'Informatică', 'Fizică', 'Chimie', 'Biologie', 'Geografie', 'Istorie', 'Limba română', 'Limba engleză', 'Economie', 'Psihologie', 'Filozofie'];

export default function ProfileScreen() {
  const { profile, updateProfile } = useUserProfile();
  const [loading, setLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [userName, setUserName] = useState('Utilizator');
  const [userEmail, setUserEmail] = useState('user@example.com');
  const [editName, setEditName] = useState('');
  const [editInterests, setEditInterests] = useState<string[]>([]);
  const [editSubjects, setEditSubjects] = useState<string[]>([]);

  const loadUserProfile = useCallback(async () => {
    if (!supabase) return;

    try {
      const userResult = await supabase.auth.getUser();
      if (!userResult) return;
      
      const user = userResult.data?.user;
      if (user) {
        const displayName = user.user_metadata.display_name ||
                           user.user_metadata.name ||
                           user.user_metadata.full_name ||
                           user.user_metadata.username ||
                           user.email?.split('@')[0] ||
                           'Utilizator';

        setUserName(displayName);
        setUserEmail(user.email || 'user@example.com');
      }

      if (profile) {
        setEditName(profile.display_name || '');
        setEditInterests(profile.interests || []);
        setEditSubjects(profile.favorite_subjects || []);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  }, [profile]);

  const handleEditProfile = () => {
    setEditName(profile?.display_name || '');
    setEditInterests(profile?.interests || []);
    setEditSubjects(profile?.favorite_subjects || []);
    setShowEditDialog(true);
  };

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      const userResult = await supabase?.auth.getUser();
      if (!userResult) return;
      
      const user = userResult.data?.user;
      if (!user || !supabase) return;

      await updateProfile(user.id, {
        display_name: editName,
        interests: editInterests,
        favorite_subjects: editSubjects,
      });

      setShowEditDialog(false);
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Eroare la salvarea profilului');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadUserProfile();
  }, [loadUserProfile]);

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

      const userResult = await supabase.auth.getUser();
      if (!userResult) return;
      
      const user = userResult.data?.user;
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
        onPress={handleEditProfile}
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

      {/* Edit Profile Modal */}
      <Modal
        visible={showEditDialog}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditDialog(false)}
      >
        <View style={styles.editOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Editează profilul</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Nume</Text>
              <Input
                placeholder="Numele tău"
                value={editName}
                onChangeText={setEditName}
              />
            </View>

            <CheckboxGroup
              label="Interese"
              options={INTERESTS.map(interest => ({
                id: interest,
                label: interest,
                checked: editInterests.includes(interest),
              }))}
              onToggle={(interest) => {
                setEditInterests(prev =>
                  prev.includes(interest)
                    ? prev.filter(i => i !== interest)
                    : [...prev, interest]
                );
              }}
              columns={2}
            />

            <CheckboxGroup
              label="Materii preferate"
              options={SUBJECTS.map(subject => ({
                id: subject,
                label: subject,
                checked: editSubjects.includes(subject),
              }))}
              onToggle={(subject) => {
                setEditSubjects(prev =>
                  prev.includes(subject)
                    ? prev.filter(s => s !== subject)
                    : [...prev, subject]
                );
              }}
              columns={2}
            />
          
            <View style={styles.buttons}>
              <Button
                title="Anulează"
                onPress={() => setShowEditDialog(false)}
                variant="secondary"
                style={styles.button}
              />
              <Button
                title="Salvează"
                onPress={handleSaveProfile}
                disabled={loading}
                style={styles.button}
              />
            </View>
          </View>
        </View>
      </Modal>

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
        <View style={styles.passwordOverlay}>
          <View style={styles.passwordModalContainer}>
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
  editOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  passwordOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  passwordModalContainer: {
    backgroundColor: colors.dark.surface,
    borderRadius: 16,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 400,
  },
  modalContainer: {
    backgroundColor: colors.dark.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    // @ts-ignore - borderCurve is iOS 13+ only
    borderCurve: 'continuous',
    padding: spacing.xl,
    maxHeight: '90%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    paddingTop: 0,
  },
  modalTitle: {
    ...title,
    color: colors.dark.textPrimary,
    marginBottom: spacing.lg,
  },
  modalMessage: {
    ...body,
    color: colors.dark.textSecondary,
    marginBottom: spacing.xl,
  },
  inputContainer: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    ...body,
    color: colors.dark.textPrimary,
    marginBottom: spacing.sm,
  },
  passwordInput: {
    marginBottom: spacing.lg,
  },
  buttons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
});
