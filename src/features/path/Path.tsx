import { StyleSheet } from 'react-native';
import { View } from 'react-native';
import { useAppRouter as useRouter } from '@/hooks/use-app-router';
import { Target } from 'lucide-react-native';
import {
  Screen,
  Copy,
  Panel,
  Row,
  GroupedList,
  Section,
} from '@/components/design';
import { Button } from '@/components';
import { DataState } from '@/components/data-state';
import { useStudentData } from '@/hooks/use-student-data';
import { useTheme } from '@/hooks/use-theme';
import { ro } from '@/i18n/ro';
import { updateProgress } from '@/services/progress';
import { showMessage } from '@/lib/show-message';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { PathStepItem } from './PathStepItem';
import { spacing as s } from '@/theme/tokens';
import { AnimatedProgress } from '@/components/motion';
import { PersonalizedSuggestions } from './PersonalizedSuggestions';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/providers/auth';
import { accountRequest } from '@/lib/account-request';
import { useAccountMode } from '@/providers/account-mode';
import { StudentPreview } from '@/features/preview/student-preview';
import { EDUCATION_ROUTES_ENABLED } from '@/constants/education-rollout';
import { EducationalRoute } from './EducationalRoute';
export default function Path() {
  const { isPreview } = useAccountMode();
  return isPreview ? <StudentPreview section='path' /> : <StudentPath />;
}
function StudentPath() {
  const router = useRouter();
  const { session } = useSession();
  const theme = useTheme();
  const client = useQueryClient();
  const {
    goal,
    steps,
    loading: baseLoading,
    pathLoading,
    error,
    retry,
  } = useStudentData({ includeGap: false, includePath: true });
  const loading = baseLoading || pathLoading;
  const [saving, setSaving] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>();
  const finish = async (id: string) => {
    if (saving) {
      return;
    }
    setSaving(id);
    try {
      await updateProgress(id, 'completed');
      await client.invalidateQueries({
        queryKey: ['student'],
        predicate: (query) => query.queryKey[2] === 'path',
      });
      await client.invalidateQueries({
        queryKey: ['education-route', session?.user.id],
      });
      setExpandedId((current) =>
        current === undefined || current === id ? undefined : current
      );
    } catch {
      showMessage(ro.errors.serverError);
    } finally {
      setSaving(null);
    }
  };
  const completed = steps.filter((step) => step.status === 'completed').length;
  const remove = async (id: string) => {
    if (saving) {
      return;
    }
    setSaving(id);
    try {
      const result = await accountRequest((signal) =>
        supabase
          .rpc('remove_path_step', {
            step_id: id,
            expected_user: session?.user.id,
          })
          .abortSignal(signal)
      );
      if (result.error) {
        throw result.error;
      }
      await Promise.all([
        client.invalidateQueries({ queryKey: ['student'] }),
        client.invalidateQueries({ queryKey: ['personalized-path'] }),
        client.invalidateQueries({
          queryKey: ['education-route', session?.user.id],
        }),
      ]);
    } catch {
      showMessage(ro.errors.serverError);
    } finally {
      setSaving(null);
    }
  };
  const expanded =
    expandedId === undefined
      ? steps.find((step) => step.status !== 'completed')?.id
      : expandedId;
  return (
    <Screen>
      <Copy kind='title'>{ro.myPath.title}</Copy>
      {loading || error ? (
        <DataState
          loadingLayout='path'
          loading={loading}
          error={error}
          retry={retry}
        />
      ) : (
        <>
          {(!EDUCATION_ROUTES_ENABLED || goal || steps.length > 0) && (
            <Panel>
              <Row
                icon={Target}
                title={goal?.name || ro.visual.chooseGoal}
                subtitle={ro.visual.objective}
                onPress={() =>
                  router.push(
                    goal
                      ? '/objective'
                      : {
                          pathname: '/explore',
                          params: { section: 'careers', intent: 'goal' },
                        }
                  )
                }
              />
              {!!steps.length && (
                <View style={uiStyles.s0}>
                  <Copy style={{ color: theme.textSecondary }}>
                    {ro.visual.progress}
                  </Copy>
                  <Copy style={{ color: theme.accentText }}>
                    {completed} / {steps.length}
                  </Copy>
                </View>
              )}
              {!!steps.length && (
                <AnimatedProgress
                  value={completed}
                  total={steps.length}
                  label={ro.visual.progress}
                />
              )}
            </Panel>
          )}
          {!EDUCATION_ROUTES_ENABLED && !steps.length && (
            <Panel>
              <Copy style={{ color: theme.textSecondary }}>
                {ro.visual.noSteps}
              </Copy>
            </Panel>
          )}
          {!!steps.length && (
            <View style={uiStyles.steps}>
              <Section title={ro.refinement.pathSteps} />
              <GroupedList>
                {steps.map((step, index) => (
                  <PathStepItem
                    key={step.id}
                    step={step}
                    index={index}
                    expanded={expanded === step.id}
                    saving={saving === step.id}
                    disabled={saving !== null}
                    onToggle={() =>
                      setExpandedId(expanded === step.id ? null : step.id)
                    }
                    onOpen={() => {
                      if (step.refId) {
                        router.push({
                          pathname: ('/' +
                            step.type +
                            '/[id]') as '/course/[id]',
                          params: { id: step.refId },
                        });
                      }
                    }}
                    onFinish={() => finish(step.id)}
                    onRemove={() => remove(step.id)}
                  />
                ))}
              </GroupedList>
            </View>
          )}
        </>
      )}
      {EDUCATION_ROUTES_ENABLED ? (
        <EducationalRoute />
      ) : (
        <PersonalizedSuggestions />
      )}
      <Button variant='secondary' onPress={() => router.push('/_tabs/explore')}>
        {ro.visual.alternatives}
      </Button>
    </Screen>
  );
}

const uiStyles = StyleSheet.create({
  s0: { flexDirection: 'row', justifyContent: 'space-between' },
  steps: { gap: s.md },
});
