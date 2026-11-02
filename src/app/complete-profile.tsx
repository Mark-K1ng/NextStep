import { useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { useAppRouter as useRouter } from '@/hooks/use-app-router';
import { useQueryClient } from '@tanstack/react-query';
import { Brand, Screen, Copy, Choice, design } from '@/components/design';
import { Button, Input } from '@/components';
import { useSession } from '@/providers/auth';
import { supabase } from '@/lib/supabase';
import { gradeSchema, locationSchema } from '@/lib/validators';
import { GradeSelect, CountySelect } from '@/components/profile-selectors';
import { ro } from '@/i18n/ro';
import { useTheme } from '@/hooks/use-theme';
import { spacing as s } from '@/theme/tokens';
export default function CompleteProfile() {
  const { session } = useSession();
  const router = useRouter();
  const theme = useTheme();
  const queryClient = useQueryClient();
  const [name, setName] = useState(
    typeof session?.user.user_metadata?.full_name === 'string'
      ? session.user.user_metadata.full_name
      : ''
  );
  const [county, setCounty] = useState('');
  const [sector, setSector] = useState<number | null>(null);
  const [grade, setGrade] = useState('');
  const [subjects, setSubjects] = useState<string[]>([]);
  const [accepted, setAccepted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const save = async () => {
    if (
      !session ||
      !name.trim() ||
      !locationSchema.safeParse({ county, sector }).success ||
      !gradeSchema.safeParse(grade).success ||
      !accepted
    ) {
      setError(ro.visual.completeRequired);
      return;
    }
    setSaving(true);
    setError('');
    try {
      const profile = await supabase
        .from('profiles')
        .upsert({
          id: session.user.id,
          display_name: name.trim(),
          county: county.trim(),
          sector,
          grade_level: grade,
          favorite_subjects: subjects,
          updated_at: new Date().toISOString(),
        })
        .select('id')
        .single();
      if (profile.error) {
        throw profile.error;
      }
      const consent = await supabase.from('consents').upsert({
        user_id: session.user.id,
        kind: 'data_processing',
        granted_at: new Date().toISOString(),
        version: '1.0',
      });
      if (consent.error) {
        throw consent.error;
      }
      const updated = await supabase.auth.updateUser({
        data: { nextstep_profile_complete: true },
      });
      if (updated.error) {
        throw updated.error;
      }
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['student'] });
      await queryClient.invalidateQueries({
        queryKey: ['personalization', session.user.id],
      });
      router.replace('/');
    } catch {
      setError(ro.errors.serverError);
    } finally {
      setSaving(false);
    }
  };
  return (
    <Screen auth>
      <Brand />
      <Copy kind='title'>{ro.visual.completeProfile}</Copy>
      <Copy style={{ color: theme.textSecondary }}>
        {ro.visual.completeHint}
      </Copy>
      <Input
        label={ro.profile.displayName}
        value={name}
        onChangeText={setName}
        autoCapitalize='words'
      />
      <CountySelect
        county={county}
        sector={sector}
        onChange={(value, district) => {
          setCounty(value);
          setSector(district);
        }}
      />
      <GradeSelect value={grade} onChange={setGrade} />
      <Copy kind='heading'>{ro.profile.favoriteSubjects}</Copy>
      <View style={design.wrap}>
        {ro.visual.personalize.subjects.map((value) => (
          <Choice
            key={value}
            selected={subjects.includes(value)}
            onPress={() =>
              setSubjects((current) =>
                current.includes(value)
                  ? current.filter((item) => item !== value)
                  : [...current, value]
              )
            }
          >
            {value}
          </Choice>
        ))}
      </View>
      <Pressable
        accessibilityRole='checkbox'
        aria-checked={accepted}
        accessibilityState={{ checked: accepted }}
        onPress={() => setAccepted(!accepted)}
        style={styles.terms}
      >
        <Copy
          style={{ color: accepted ? theme.accentText : theme.textSecondary }}
        >
          {accepted ? ro.visual.termsAccepted : ro.auth.acceptTerms}
        </Copy>
      </Pressable>
      {!!error && (
        <Copy accessibilityRole='alert' style={{ color: theme.dangerText }}>
          {error}
        </Copy>
      )}
      <Button loading={saving} onPress={save}>
        {ro.common.save}
      </Button>
      <Button
        variant='outline'
        disabled={saving}
        onPress={async () => {
          const result = await supabase.auth.signOut();
          if (result.error) {
            setError(ro.errors.serverError);
          }
        }}
      >
        {ro.visual.signOut}
      </Button>
    </Screen>
  );
}
const styles = StyleSheet.create({
  terms: { minHeight: 44, justifyContent: 'center', paddingVertical: s.sm },
});
