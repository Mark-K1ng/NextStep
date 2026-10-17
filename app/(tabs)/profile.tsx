import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { router } from 'expo-router';
import { colors, spacing, title, heading, body, caption } from '../../src/theme';
import { Button, Card } from '../../src/components';
import { supabase } from '../../src/lib';

export default function ProfileScreen() {
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    await supabase?.auth.signOut();
    router.replace('/(auth)/login');
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Șterge contul',
      'Ești sigur că vrei să ștergi contul? Această acțiune este ireversibilă și va șterge toate datele tale.',
      [
        { text: 'Anulează', style: 'cancel' },
        {
          text: 'Șterge',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              
              if (!supabase) {
                Alert.alert('Eroare', 'Supabase nu este configurat');
                return;
              }

              // Call the Supabase Edge Function to delete account
              const { data: { session } } = await supabase.auth.getSession();
              if (!session?.access_token) {
                Alert.alert('Eroare', 'Nu ești conectat');
                return;
              }

              const response = await fetch(
                'https://nuwunxzibsvvtnxjjqzj.supabase.co/functions/v1/delete-account',
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

              // Sign out and redirect to login
              await supabase.auth.signOut();
              router.replace('/(auth)/login');
            } catch (error) {
              console.error('Delete account error:', error);
              Alert.alert('Eroare', 'Nu s-a putut șterge contul. Încearcă din nou.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Profilul meu</Text>

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Utilizator</Text>
        <Text style={styles.cardText}>nume@exemplu.com</Text>
      </Card>

      <Card style={styles.card}>
        <Pressable style={styles.menuItem}>
          <Text style={styles.menuText}>Editează profilul</Text>
        </Pressable>
        <Pressable style={styles.menuItem}>
          <Text style={styles.menuText}>Schimbă parola</Text>
        </Pressable>
        <Pressable style={styles.menuItem}>
          <Text style={styles.menuText}>Exportă datele mele</Text>
        </Pressable>
      </Card>

      <Card style={styles.card}>
        <Pressable style={styles.menuItem}>
          <Text style={styles.menuText}>Politica de confidențialitate</Text>
        </Pressable>
        <Pressable style={styles.menuItem}>
          <Text style={styles.menuText}>Termeni și condiții</Text>
        </Pressable>
      </Card>

      <Card style={{ ...styles.card, borderColor: colors.dark.danger }}>
        <Pressable style={styles.menuItem} onPress={handleDeleteAccount} disabled={loading}>
          <Text style={[styles.menuText, styles.dangerText]}>
            {loading ? 'Se șterge...' : 'Șterge contul'}
          </Text>
        </Pressable>
      </Card>

      <Button
        title="Deconectare"
        onPress={handleLogout}
        variant="outline"
        style={styles.button}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.background,
  },
  content: {
    padding: spacing.xl,
  },
  title: {
    ...title,
    color: colors.dark.textPrimary,
    marginBottom: spacing.xl,
  },
  card: {
    marginBottom: spacing.lg,
  },
  cardTitle: {
    ...heading,
    color: colors.dark.textPrimary,
    marginBottom: spacing.md,
  },
  cardText: {
    ...body,
    color: colors.dark.textSecondary,
  },
  menuItem: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.dark.border,
  },
  menuText: {
    ...body,
    color: colors.dark.textPrimary,
  },
  dangerText: {
    color: colors.dark.danger,
  },
  button: {
    marginBottom: spacing.xl,
  },
});
