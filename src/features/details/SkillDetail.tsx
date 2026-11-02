import { useEffect, useState } from 'react';
import { View, Platform, Share, StyleSheet } from 'react-native';
import { spacing as s } from '@/theme/tokens';
import { DetailHeading } from './detail-heading';
import { useLocalSearchParams } from 'expo-router';
import { useAppRouter as useRouter } from '@/hooks/use-app-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { BookOpen, Briefcase, Columns2, Share2 } from 'lucide-react-native';
import {
  BackHeader,
  Copy,
  Panel,
  Row,
  Screen,
  Section,
  Choice,
  design,
} from '@/components/design';
import { DataState } from '@/components/data-state';
import { Button } from '@/components';
import { SaveButton } from '@/components/save-button';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/providers/auth';
import { useTheme } from '@/hooks/use-theme';
import { saveSkillLevel } from '@/services/skills';
import { ro } from '@/i18n/ro';
import { MotionPressable } from '@/components/motion';
import { useJourney } from '@/providers/journey';
import { showMessage } from '@/lib/show-message';
import type { ExploreItem } from '@/types/models';
import { useAccountMode } from '@/providers/account-mode';
import { useToast } from '@/providers/toast';
type SkillData = {
  id: string;
  name: string;
  category: string;
  course_skills: { courses: { id: string; title: string; provider: string } }[];
  career_skills: { careers: { id: string; name: string } }[];
};
export default function SkillDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useSession();
  const { isTeacher } = useAccountMode();
  const router = useRouter();
  const theme = useTheme();
  const toast = useToast();
  const { beginComparison } = useJourney();
  const client = useQueryClient();
  const [draft, setDraft] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    setDraft(null);
    setError('');
  }, [id]);
  const query = useQuery({
    queryKey: [
      'skill',
      session?.user.id,
      id,
      isTeacher ? 'preview' : 'student',
    ],
    enabled: !!session && !!id,
    queryFn: async ({ signal }) => {
      const [skill, level] = await Promise.all([
        supabase
          .from('skills')
          .select(
            '*,course_skills(courses(id,title,provider)),career_skills(careers(id,name))'
          )
          .eq('id', id)
          .abortSignal(signal)
          .single(),
        isTeacher
          ? Promise.resolve({ data: null, error: null })
          : supabase
              .from('user_skills')
              .select('level')
              .eq('user_id', session!.user.id)
              .eq('skill_id', id)
              .abortSignal(signal)
              .maybeSingle(),
      ]);
      if (skill.error) {
        throw skill.error;
      }
      if (level.error) {
        throw level.error;
      }
      return {
        skill: skill.data as unknown as SkillData,
        level: level.data?.level || 0,
      };
    },
  });
  const current = draft ?? query.data?.level ?? 0;
  const persistedLevel = query.data?.level ?? 0;
  const clearSavedLevel =
    persistedLevel > 0 && (current === persistedLevel || current === 0);
  const save = async () => {
    if (isTeacher || saving) {
      return;
    }
    const level = clearSavedLevel ? 0 : current;
    setSaving(true);
    setError('');
    try {
      await saveSkillLevel(id, level);
      client.setQueryData(['skill', session?.user.id, id, 'student'], {
        ...query.data,
        level,
      });
      await client.invalidateQueries({
        queryKey: ['student', session?.user.id, 'gap'],
      });
      await client.invalidateQueries({
        queryKey: ['education-route', session?.user.id],
      });
      setDraft(null);
      toast(
        level === 0 ? ro.visual.skillLevelCleared : ro.visual.skillLevelSaved
      );
    } catch {
      setError(ro.errors.serverError);
    } finally {
      setSaving(false);
    }
  };
  const item = query.data?.skill;
  const option: ExploreItem | undefined = item
    ? {
        id: item.id,
        type: 'skills',
        name: item.name,
        domain: item.category,
      }
    : undefined;
  const actions = option && (
    <View style={styles.actions}>
      <SaveButton item={option} />
      <MotionPressable
        accessibilityRole='button'
        accessibilityLabel={ro.visual.compare}
        style={styles.action}
        onPress={() => {
          beginComparison(option);
          router.push('/compare');
        }}
      >
        <Columns2 size={22} color={theme.textSecondary} />
      </MotionPressable>
      <MotionPressable
        accessibilityRole='button'
        accessibilityLabel={ro.visual.share}
        style={styles.action}
        onPress={() =>
          Share.share({ message: option.name || '' }).catch(() =>
            showMessage(ro.errors.serverError)
          )
        }
      >
        <Share2 size={24} color={theme.textSecondary} />
      </MotionPressable>
    </View>
  );
  return (
    <Screen
      tab='explore'
      nativeTitle={ro.common.skills}
      nativeActions={Platform.OS === 'ios' ? actions : undefined}
    >
      {Platform.OS !== 'ios' && (
        <BackHeader title={ro.common.skills} trailing={actions} />
      )}
      {query.isLoading || !item ? (
        <DataState
          loadingLayout='detail'
          loading={query.isLoading}
          error={query.isError}
          retry={() => {
            query.refetch();
          }}
        />
      ) : (
        <>
          <DetailHeading title={item.name} subtitle={item.category} />
          {isTeacher ? (
            <Panel>
              <Copy kind='heading'>Autoevaluarea elevilor</Copy>
              <Copy kind='caption' style={{ color: theme.textSecondary }}>
                Elevii își pot evalua această abilitate pentru recomandări
                personale. Previzualizarea nu salvează autoevaluări și nu
                modifică profilul contului tău de profesor.
              </Copy>
            </Panel>
          ) : (
            <View style={{ gap: s.lg }}>
              <Section title={ro.visual.selfAssessment} />
              <Copy style={{ color: theme.textSecondary }}>
                {ro.visual.assessmentHint}
              </Copy>
              <Copy kind='caption' style={{ color: theme.textSecondary }}>
                {ro.refinement.skillLevelHint}
              </Copy>
              <View style={design.wrap}>
                {ro.visual.skillLevels.map((label, level) => (
                  <Choice
                    exclusive
                    numberOfLines={1}
                    key={level}
                    selected={current === level}
                    onPress={() => {
                      setDraft(level);
                    }}
                  >
                    {label}
                  </Choice>
                ))}
              </View>
              {!!error && (
                <Copy
                  accessibilityRole='alert'
                  style={{ color: theme.dangerText }}
                >
                  {error}
                </Copy>
              )}
              <Button
                loading={saving}
                disabled={saving || (current === 0 && persistedLevel === 0)}
                onPress={save}
              >
                {clearSavedLevel ? ro.visual.unsaveSkillLevel : ro.common.save}
              </Button>
            </View>
          )}
          <View style={{ gap: s.lg }}>
            <Section title={ro.visual.practiceResources} />
            {item.course_skills
              .filter((link) => link.courses)
              .map((link) => (
                <Panel key={link.courses.id}>
                  <Row
                    icon={BookOpen}
                    title={link.courses.title}
                    subtitle={link.courses.provider}
                    onPress={() =>
                      router.push({
                        pathname: '/course/[id]',
                        params: { id: link.courses.id },
                      })
                    }
                  />
                </Panel>
              ))}
            {!item.course_skills.length && (
              <Panel>
                <Copy>{ro.refinement.noSkillCourses}</Copy>
                <Button
                  variant='outline'
                  onPress={() =>
                    router.push({
                      pathname: '/explore',
                      params: { section: 'courses' },
                    })
                  }
                >
                  {ro.explore.sections.courses}
                </Button>
              </Panel>
            )}
          </View>
          {!!item.career_skills.length && (
            <View style={{ gap: s.lg }}>
              <Section title={ro.visual.usedBy} />
              {item.career_skills
                .filter((link) => link.careers)
                .map((link) => (
                  <Panel key={link.careers.id}>
                    <Row
                      icon={Briefcase}
                      title={link.careers.name}
                      onPress={() =>
                        router.push({
                          pathname: '/career/[id]',
                          params: { id: link.careers.id },
                        })
                      }
                    />
                  </Panel>
                ))}
            </View>
          )}
        </>
      )}
    </Screen>
  );
}
const styles = StyleSheet.create({
  actions: { flexDirection: 'row', alignItems: 'center', gap: 0 },
  action: {
    width: 48,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
