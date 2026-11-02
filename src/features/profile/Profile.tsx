import { StyleSheet } from 'react-native';
import { useEffect, useState } from 'react';
import { AsciiContentGate } from '@/components/ascii-skin';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { View } from 'react-native';
import { MotionContent, MotionPressable } from '@/components/motion';
import { useAppRouter as useRouter } from '@/hooks/use-app-router';
import {
  BrainCircuit,
  Bookmark,
  LockKeyhole,
  Palette,
  CircleHelp,
  Settings,
  CircleUserRound,
} from 'lucide-react-native';
import {
  Screen,
  Copy,
  Panel,
  Row,
  Choice,
  GroupedList,
  design,
} from '@/components/design';
import { Button, Input } from '@/components';
import { DataState } from '@/components/data-state';
import { useSession } from '@/providers/auth';
import { useSaved } from '@/providers/saved';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/hooks/use-theme';
import { showMessage } from '@/lib/show-message';
import type { Profile as ProfileModel } from '@/types/models';
import { ro } from '@/i18n/ro';
import { radius, spacing as s } from '@/theme/tokens';
import { GradeSelect, CountySelect } from '@/components/profile-selectors';
import { gradeSchema, locationSchema } from '@/lib/validators';
import { normalizeCounty } from '@/constants/profile-options';
import { useAccountMode } from '@/providers/account-mode';
import { StudentPreview } from '@/features/preview/student-preview';
export default function Profile() {
  const { isPreview } = useAccountMode();
  return isPreview ? <StudentPreview section='profile' /> : <StudentProfile />;
}
function StudentProfile() {
  const router = useRouter();
  const theme = useTheme();
  const { session } = useSession();
  const { items } = useSaved();
  const [profile, setProfile] = useState<ProfileModel | null>(null);
  const [draft, setDraft] = useState<ProfileModel | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ['profile', session?.user.id],
    enabled: !!session,
    queryFn: async ({ signal }) => {
      const result = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session!.user.id)
        .abortSignal(signal)
        .single();
      if (result.error) {
        throw result.error;
      }
      return result.data as ProfileModel;
    },
  });
  const loading = query.isLoading;
  const error = query.isError;
  useEffect(() => {
    if (query.data && !editing) {
      setProfile(query.data);
      setDraft(query.data);
    }
  }, [query.data, editing]);
  const save = async () => {
    if (!draft || !session) {
      return;
    }
    if (
      !draft.display_name.trim() ||
      !locationSchema.safeParse({
        county: normalizeCounty(draft.county),
        sector: draft.sector,
      }).success ||
      !gradeSchema.safeParse(draft.grade_level).success
    ) {
      showMessage(ro.visual.profileRequired);
      return;
    }
    setSaving(true);
    const values = {
      display_name: draft.display_name.trim(),
      county: normalizeCounty(draft.county),
      sector: draft.sector ?? null,
      grade_level: draft.grade_level,
      interests: draft.interests,
      favorite_subjects: draft.favorite_subjects,
      updated_at: new Date().toISOString(),
    };
    try {
      const result = await supabase
        .from('profiles')
        .update(values)
        .eq('id', session.user.id)
        .select('*')
        .single();
      if (result.error) {
        throw result.error;
      }
      queryClient.setQueryData(['profile', session.user.id], result.data);
      await queryClient.invalidateQueries({
        queryKey: ['student', session.user.id, 'path'],
      });
      await queryClient.invalidateQueries({ queryKey: ['explore'] });
      await queryClient.invalidateQueries({ queryKey: ['option'] });
      await queryClient.invalidateQueries({ queryKey: ['education-route'] });
      setProfile(result.data);
      setDraft(result.data);
      setEditing(false);
    } catch {
      showMessage(ro.errors.serverError);
    } finally {
      setSaving(false);
    }
  };
  const logout = async () => {
    const result = await supabase.auth.signOut();
    if (result.error) {
      showMessage(ro.errors.serverError);
    } else {
      router.replace('/(auth)/login');
    }
  };
  return (
    <Screen>
      {loading || error || !profile ? (
        <DataState
          loadingLayout='profile'
          loading={loading}
          error={error}
          retry={() => {
            query.refetch();
          }}
        />
      ) : (
        <>
          <View style={[uiStyles.s0, { gap: s.md }]}>
            <AsciiContentGate cover nativeOnly radius={28}>
              <CircleUserRound size={56} color={theme.accentText} />
            </AsciiContentGate>
            <View style={[uiStyles.s1, { gap: s.xs }]}>
              <Copy kind='heading'>{profile.display_name}</Copy>
              <Copy kind='caption' style={{ color: theme.textSecondary }}>
                {session?.user.email}
              </Copy>
            </View>
            <MotionPressable
              accessibilityRole='button'
              style={design.touch}
              onPress={() => {
                setDraft(profile);
                setEditing(true);
              }}
            >
              <Copy style={{ color: theme.accentText }}>{ro.visual.edit}</Copy>
            </MotionPressable>
          </View>
          <MotionContent
            key={editing ? 'edit' : 'summary'}
            animateExit={false}
            style={{ gap: s.xl }}
          >
            {editing && draft ? (
              <Panel>
                <Input
                  label={ro.profile.displayName}
                  value={draft.display_name}
                  onChangeText={(value) =>
                    setDraft({ ...draft, display_name: value })
                  }
                  autoCapitalize='words'
                />
                <GradeSelect
                  value={draft.grade_level}
                  onChange={(value) =>
                    setDraft({ ...draft, grade_level: value })
                  }
                />
                <CountySelect
                  county={draft.county}
                  sector={draft.sector}
                  onChange={(county, sector) =>
                    setDraft({ ...draft, county, sector })
                  }
                />
                <Copy kind='heading'>{ro.profile.favoriteSubjects}</Copy>
                <View style={design.wrap}>
                  {ro.visual.personalize.subjects.map((value) => (
                    <Choice
                      key={value}
                      selected={draft.favorite_subjects.includes(value)}
                      onPress={() =>
                        setDraft({
                          ...draft,
                          favorite_subjects: draft.favorite_subjects.includes(
                            value
                          )
                            ? draft.favorite_subjects.filter(
                                (item) => item !== value
                              )
                            : [...draft.favorite_subjects, value],
                        })
                      }
                    >
                      {value}
                    </Choice>
                  ))}
                </View>
                <Copy kind='heading'>{ro.profile.interests}</Copy>
                <View style={design.wrap}>
                  {ro.visual.personalize.domains.map((value) => (
                    <Choice
                      key={value}
                      selected={draft.interests.includes(value)}
                      onPress={() =>
                        setDraft({
                          ...draft,
                          interests: draft.interests.includes(value)
                            ? draft.interests.filter((item) => item !== value)
                            : [...draft.interests, value],
                        })
                      }
                    >
                      {value}
                    </Choice>
                  ))}
                </View>
                <Button loading={saving} onPress={save}>
                  {ro.common.save}
                </Button>
                <Button
                  variant='outline'
                  disabled={saving}
                  onPress={() => setEditing(false)}
                >
                  {ro.common.cancel}
                </Button>
              </Panel>
            ) : (
              <>
                <View style={uiStyles.interestsSection}>
                  <Copy
                    kind='label'
                    accessibilityRole='header'
                    style={{ color: theme.textSecondary }}
                  >
                    {ro.visual.interests}
                  </Copy>
                  {!!(
                    profile.favorite_subjects.length || profile.interests.length
                  ) && (
                    <View style={design.wrap}>
                      {[
                        ...new Set([
                          ...profile.favorite_subjects,
                          ...profile.interests,
                        ]),
                      ].map((value) => (
                        <View
                          key={value}
                          style={[
                            uiStyles.tag,
                            { backgroundColor: theme.surfaceElevated },
                          ]}
                        >
                          <Copy kind='caption'>{value}</Copy>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
                <View style={uiStyles.section}>
                  <Copy
                    kind='label'
                    accessibilityRole='header'
                    style={{ color: theme.textSecondary }}
                  >
                    {ro.visual.account}
                  </Copy>
                  <GroupedList inset>
                    <Row
                      icon={BrainCircuit}
                      title='Preferințe și recomandări'
                      subtitle='Chestionare, interese și direcții de explorat'
                      onPress={() => router.push('/personalize')}
                    />
                    <Row
                      icon={Bookmark}
                      title={ro.visual.saved}
                      subtitle={`${items.length} ${items.length === 1 ? ro.refinement.optionOne : ro.refinement.optionMany}`}
                      onPress={() => router.push('/saved')}
                    />
                    <Row
                      icon={Settings}
                      title={ro.visual.appearance}
                      subtitle={ro.visual.appearanceHint}
                      onPress={() => router.push('/settings')}
                    />
                    <Row
                      icon={LockKeyhole}
                      title={ro.visual.privacy}
                      subtitle={ro.visual.privacyHint}
                      onPress={() => router.push('/privacy-and-data')}
                    />
                    <Row
                      icon={CircleHelp}
                      title='Q&A'
                      subtitle='Întrebări și răspunsuri despre NextStep'
                      onPress={() => router.push('/qa')}
                    />
                    <Row
                      icon={Palette}
                      title='Paletă de culori'
                      subtitle='Explorează și salvează o culoare principală'
                      onPress={() => router.push('/palette')}
                    />
                  </GroupedList>
                </View>
                <Button
                  variant='outline'
                  style={uiStyles.s4}
                  textStyle={{ color: theme.dangerText }}
                  onPress={logout}
                >
                  {ro.visual.signOut}
                </Button>
                <Copy
                  kind='caption'
                  style={[uiStyles.s5, { color: theme.textSecondary }]}
                >
                  {ro.visual.version}
                </Copy>
              </>
            )}
          </MotionContent>
        </>
      )}
    </Screen>
  );
}

const uiStyles = StyleSheet.create({
  interestsSection: { gap: s.xs },
  section: { gap: s.sm },
  tag: {
    paddingHorizontal: s.md,
    paddingVertical: s.sm,
    borderRadius: radius.sm,
    borderCurve: 'continuous',
    alignSelf: 'center',
  },
  s0: { flexDirection: 'row', alignItems: 'center' },
  s1: { flex: 1 },
  s4: { borderWidth: 0 },
  s5: { textAlign: 'center' },
});
