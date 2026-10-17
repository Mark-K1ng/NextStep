import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors, spacing, body, caption } from '../../src/theme';
import { SectionHeader } from '../../src/components/SectionHeader';

export default function PrivacyPolicyScreen() {
  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <SectionHeader
          title="Politica de confidențialitate"
          subtitle="Ultima actualizare: 17 Octombrie 2026"
        />

        <Text style={styles.sectionTitle}>1. Colectarea datelor</Text>
        <Text style={styles.text}>
          Colectăm informații pe care ni le oferiți voluntar, inclusiv nume, email, și date de profil educational. Aceste informații sunt folosite pentru a vă oferi o experiență personalizată în NextStep.
        </Text>

        <Text style={styles.sectionTitle}>2. Utilizarea datelor</Text>
        <Text style={styles.text}>
          Datele dumneavoastră sunt folosite pentru:
          {'\n'}• Gestionarea contului dumneavoastră
          {'\n'}• Oferirea de recomandări personalizate
          {'\n'}• Îmbunătățirea experienței în aplicație
          {'\n'}• Comunicarea actualizărilor și noutăților
        </Text>

        <Text style={styles.sectionTitle}>3. Stocarea datelor</Text>
        <Text style={styles.text}>
          Datele sunt stocate în siguranță folosind Supabase și sunt protejate prin măsuri de securitate standard. Nu vindem și nu partajăm datele dumneavoastră cu terțe părți.
        </Text>

        <Text style={styles.sectionTitle}>4. Drepturile dumneavoastră</Text>
        <Text style={styles.text}>
          Aveți dreptul să:
          {'\n'}• Accesați și modificați datele dumneavoastră
          {'\n'}• Ștergeți contul și datele asociate
          {'\n'}• Solicitați exportul datelor dumneavoastră
          {'\n'}• Solicitați șterrea datelor
        </Text>

        <Text style={styles.sectionTitle}>5. Contact</Text>
        <Text style={styles.text}>
          Pentru întrebări legate de confidențialitatea datelor, ne puteți contacta la support@nextstep.ro
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.xl,
  },
  sectionTitle: {
    ...body,
    color: colors.dark.textPrimary,
    fontWeight: '600',
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  text: {
    ...caption,
    color: colors.dark.textSecondary,
    marginBottom: spacing.lg,
  },
});
