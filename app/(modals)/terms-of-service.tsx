import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors, spacing, body, caption } from '../../src/theme';
import { SectionHeader } from '../../src/components/SectionHeader';

export default function TermsOfServiceScreen() {
  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <SectionHeader
          title="Termeni și condiții"
          subtitle="Ultima actualizare: 17 Octombrie 2026"
        />

        <Text style={styles.sectionTitle}>1. Acceptarea termenilor</Text>
        <Text style={styles.text}>
          Prin utilizarea aplicației NextStep, acceptați acești termeni și condiții. Vă rugăm să citiți cu atenție documentul înainte de a utiliza aplicația.
        </Text>

        <Text style={styles.sectionTitle}>2. Descrierea serviciului</Text>
        <Text style={styles.text}>
          NextStep este o aplicație educațională care oferă informații despre licee, facultăți, cariere și cursuri. Aplicația oferă recomandări personalizate bazate pe profilul dumneavoastră.
        </Text>

        <Text style={styles.sectionTitle}>3. Responsabilitățile utilizatorului</Text>
        <Text style={styles.text}>
          Sunteți responsabil pentru:
          {'\n'}• Menținerea confidențialității contului dumneavoastră
          {'\n'}• Exactitatea informațiilor furnizate
          {'\n'}• Utilizarea aplicației în conformitate cu legile în vigoare
          {'\n'}• Respectarea drepturilor de autor pentru materialele accesate
        </Text>

        <Text style={styles.sectionTitle}>4. Proprietate intelectuală</Text>
        <Text style={styles.text}>
          Conținutul aplicației, inclusiv text, grafică, logo și design, este proprietatea NextStep și este protejat de legile drepturilor de autor.
        </Text>

        <Text style={styles.sectionTitle}>5. Limitarea responsabilității</Text>
        <Text style={styles.text}>
          NextStep nu este responsabil pentru:
          {'\n'}• Exactitatea sau actualitatea informațiilor despre școli și cariere
          {'\n'}• Deciziile luate pe baza recomandărilor noastre
          {'\n'}• Disponibilitatea continuă a serviciului
          {'\n'}• Daune directe sau indirecte rezultate din utilizarea aplicației
        </Text>

        <Text style={styles.sectionTitle}>6. Modificări</Text>
        <Text style={styles.text}>
          Ne rezervăm dreptul de a modifica acești termeni și condiții în orice moment. Utilizarea continuă a aplicației după modificări constituie acceptarea noilor termeni.
        </Text>

        <Text style={styles.sectionTitle}>7. Contact</Text>
        <Text style={styles.text}>
          Pentru întrebări legate de termenii și condiții, ne puteți contacta la support@nextstep.ro
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
    lineHeight: 24,
    marginBottom: spacing.lg,
  },
});
