import { Platform } from 'react-native';
import { StyleSheet } from 'react-native';
import { View } from 'react-native';
import { useAppRouter as useRouter } from '@/hooks/use-app-router';
import { Target, Info, Backpack } from 'lucide-react-native';
import {
  Screen,
  Copy,
  Row,
  Panel,
  Section,
  BackHeader,
} from '@/components/design';
import { Button } from '@/components';
import { DataState } from '@/components/data-state';
import { useStudentData } from '@/hooks/use-student-data';
import { useTheme } from '@/hooks/use-theme';
import { ro } from '@/i18n/ro';
import { spacing as s, radius } from '@/theme/tokens';
import { gradeLabel } from '@/constants/profile-options';
export default function Objective() {
  const router = useRouter();
  const theme = useTheme();
  const {
    profile,
    goal,
    gap,
    loading: baseLoading,
    gapLoading,
    error,
    retry,
  } = useStudentData();
  const loading = baseLoading || gapLoading;
  const skills = [
    ...(gap?.covered || []).map((skill) => ({ ...skill, covered: true })),
    ...(gap?.partial || []).map((skill) => ({ ...skill, covered: false })),
    ...(gap?.missing || []).map((skill) => ({ ...skill, covered: false })),
  ];
  return (
    <Screen tab='path' nativeTitle={ro.visual.objective}>
      {Platform.OS !== 'ios' && <BackHeader title={ro.visual.objective} />}
      {loading || error ? (
        <DataState
          loadingLayout='detail'
          loading={loading}
          error={error}
          retry={retry}
        />
      ) : (
        <>
          <Panel accent>
            <Row
              icon={Target}
              title={goal?.name || ro.visual.chooseGoal}
              subtitle={goal?.domain}
              onPress={() =>
                router.push({
                  pathname: '/explore',
                  params: { section: 'careers', intent: 'goal' },
                })
              }
            />
          </Panel>
          <Panel>
            <Row
              icon={Backpack}
              title={
                profile?.grade_level
                  ? gradeLabel(profile.grade_level)
                  : ro.profile.gradeLevel
              }
              subtitle={profile?.favorite_subjects.join(' · ')}
              onPress={() => router.push('/_tabs/profile')}
            />
          </Panel>
          <Section title={ro.visual.preparation} />
          <Panel>
            {skills.map((skill) => (
              <View
                key={skill.id}
                style={[
                  uiStyles.s0,
                  {
                    gap: s.md,
                    paddingVertical: s.md,
                    borderBottomColor: theme.border,
                  },
                ]}
              >
                <View style={[uiStyles.s1, { gap: s.sm }]}>
                  <Copy style={uiStyles.s2}>{skill.name}</Copy>
                  <Copy
                    kind='caption'
                    style={{
                      color: skill.covered
                        ? theme.successText
                        : theme.warningText,
                    }}
                  >
                    {skill.covered ? ro.visual.strength : ro.visual.toExplore}
                  </Copy>
                </View>
                <View
                  style={[
                    uiStyles.s3,
                    {
                      height: s.sm,
                      backgroundColor: theme.border,
                      borderRadius: radius.full,
                    },
                  ]}
                >
                  <View
                    style={[
                      uiStyles.s4,
                      {
                        width: ((skill.level / 3) * 100 + '%') as `${number}%`,
                        backgroundColor: skill.covered
                          ? theme.success
                          : theme.warning,
                      },
                    ]}
                  />
                </View>
                <Copy kind='caption' style={{ color: theme.textSecondary }}>
                  {ro.detail.level}: {skill.level}/3
                </Copy>
                <Button
                  variant='outline'
                  onPress={() =>
                    router.push({
                      pathname: '/skill/[id]',
                      params: { id: skill.id },
                    })
                  }
                >
                  {ro.common.update}
                </Button>
              </View>
            ))}
            {!skills.length && (
              <Copy style={{ color: theme.textSecondary }}>
                {goal ? ro.visual.noRequirements : ro.visual.chooseGoalHint}
              </Copy>
            )}
          </Panel>
          <Panel>
            <Row icon={Info} title={ro.visual.evaluationHint} />
          </Panel>
          <Button
            disabled={!goal}
            onPress={() => router.push('/recommendations')}
          >
            {ro.visual.objectiveAction}
          </Button>
        </>
      )}
    </Screen>
  );
}

const uiStyles = StyleSheet.create({
  s0: { borderBottomWidth: 1 },
  s1: { flexDirection: 'row', alignItems: 'center' },
  s2: { flex: 1 },
  s3: { overflow: 'hidden' },
  s4: { height: '100%' },
});
