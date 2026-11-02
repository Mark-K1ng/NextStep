import { StyleSheet, View } from 'react-native';
import { MotionPressable as Pressable } from '@/components/motion';
import { ChevronRight } from 'lucide-react-native';
import { Copy, Panel, Section } from '@/components/design';
import { useTheme } from '@/hooks/use-theme';
import { spacing as s, radius } from '@/theme/tokens';
import { ro } from '@/i18n/ro';
import {
  admissionAverage,
  admissionVariant,
  currentAdmissions,
  type SchoolAdmission,
} from '@/lib/school-admissions';

export function AdmissionFacts({
  profile,
  expanded = false,
}: {
  profile: SchoolAdmission;
  expanded?: boolean;
}) {
  const theme = useTheme();
  const facts = [
    {
      label: `${ro.admissions.average} ${profile.admission_year || ''}`,
      value: admissionAverage(profile.last_admission_average),
    },
    {
      label: ro.admissions.places,
      value: profile.seats_total == null ? '—' : String(profile.seats_total),
    },
    ...(expanded
      ? [
          {
            label: `${ro.admissions.average} ${profile.admission_year ? profile.admission_year - 1 : ''}`,
            value: admissionAverage(profile.previous_admission_average),
          },
          {
            label: ro.admissions.occupied,
            value:
              profile.seats_occupied == null
                ? '—'
                : String(profile.seats_occupied),
          },
        ]
      : []),
  ];
  return (
    <View style={styles.facts}>
      {facts.map((fact) => (
        <View key={fact.label} style={styles.fact}>
          <Copy kind='label' style={{ color: theme.textSecondary }}>
            {fact.label}
          </Copy>
          <Copy kind='heading'>{fact.value}</Copy>
        </View>
      ))}
    </View>
  );
}

export function SchoolAdmissions({
  profiles,
  onSelect,
}: {
  profiles: SchoolAdmission[];
  onSelect(profile: SchoolAdmission): void;
}) {
  const theme = useTheme();
  const current = currentAdmissions(profiles);
  const year = current[0]?.admission_year;
  return (
    <View style={styles.section}>
      <Section title={`${ro.admissions.title}${year ? ` ${year}` : ''}`} />
      {!current.length ? (
        <Panel>
          <Copy style={{ color: theme.textSecondary }}>
            {ro.admissions.empty}
          </Copy>
        </Panel>
      ) : (
        <>
          <Copy kind='caption' style={{ color: theme.textSecondary }}>
            {ro.admissions.historyNote}
          </Copy>
          {current.map((profile) => (
            <Pressable
              feedback='highlight'
              key={profile.id}
              accessibilityRole='button'
              accessibilityLabel={`${profile.specialization}, ${admissionVariant(profile)}, ${ro.admissions.code} ${profile.admission_code || ''}`}
              onPress={() => onSelect(profile)}
              style={({ pressed }) => [
                styles.card,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <Copy style={styles.title}>{profile.specialization}</Copy>
              <Copy kind='caption' style={{ color: theme.textSecondary }}>
                {[profile.track, admissionVariant(profile)]
                  .filter(Boolean)
                  .join(' · ')}
              </Copy>
              <AdmissionFacts profile={profile} />
              <View style={styles.footer}>
                <Copy
                  kind='label'
                  style={[styles.footerLabel, { color: theme.accentText }]}
                >
                  {ro.admissions.code} {profile.admission_code || '—'} ·{' '}
                  {ro.admissions.viewSubjects}
                </Copy>
                <ChevronRight size={20} color={theme.textSecondary} />
              </View>
            </Pressable>
          ))}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: s.lg },
  card: {
    padding: s.lg,
    borderRadius: radius.md,
    borderCurve: 'continuous',
    borderWidth: 1,
    gap: s.md,
  },
  footer: { flexDirection: 'row', alignItems: 'center', gap: s.sm },
  footerLabel: { flex: 1 },
  title: { fontWeight: '600' },
  facts: { flexDirection: 'row', flexWrap: 'wrap', gap: s.lg },
  fact: { flexGrow: 1, flexBasis: '40%', gap: s.xs },
});
