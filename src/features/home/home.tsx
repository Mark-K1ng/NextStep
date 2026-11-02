import { View, StyleSheet } from 'react-native';
import { useAppRouter as useRouter } from '@/hooks/use-app-router';
import { CircleUserRound, Route, Compass, Bookmark } from 'lucide-react-native';
import {
  Screen,
  Copy,
  Panel,
  Row,
  Section,
  IconTile,
  GroupedList,
} from '@/components/design';
import { Button } from '@/components';
import { DataState } from '@/components/data-state';
import { useStudentData } from '@/hooks/use-student-data';
import { useSaved } from '@/providers/saved';
import { useTheme } from '@/hooks/use-theme';
import { ro } from '@/i18n/ro';
import { spacing as s } from '@/theme/tokens';
import { usePersonalizedPath } from '@/hooks/use-personalized-path';
import { useAccountMode } from '@/providers/account-mode';
import { StudentPreview } from '@/features/preview/student-preview';
export default function Home() {
  const { isPreview } = useAccountMode();
  return isPreview ? <StudentPreview section='home' /> : <StudentHome />;
}
function StudentHome() {
  const router = useRouter();
  const theme = useTheme();
  const { items } = useSaved();
  const {
    profile,
    goal,
    gap,
    gapLoading: careerCoursesLoading,
    loading,
    error,
    retry,
  } = useStudentData();
  const personalized = usePersonalizedPath();
  const gapLoading = personalized.loading && !personalized.error;
  const courses = personalized.error
    ? []
    : personalized.items
        .filter((item) => item.type === 'course')
        .map((item) => ({
          id: item.id,
          title: item.name,
          provider: item.reasons[0],
        }));
  const courseSuggestions = goal
    ? gap?.steps.flatMap((step) => step.courses) || []
    : courses;
  const otherCourses = courseSuggestions
    .filter(
      (course, index, all) =>
        all.findIndex((item) => item.id === course.id) === index &&
        (!goal || course.id !== courses[0]?.id)
    )
    .slice(0, 1);
  return (
    <Screen>
      {loading || (error && !profile) ? (
        <DataState
          loadingLayout='home'
          loading={loading}
          error={error}
          retry={retry}
        />
      ) : (
        <>
          {error && <DataState error retry={retry} />}
          <View style={styles.greeting}>
            <IconTile icon={CircleUserRound} />
            <View style={styles.name}>
              <Copy kind='caption' style={{ color: theme.textSecondary }}>
                {ro.visual.welcomeBack}
              </Copy>
              <Copy kind='heading'>{profile?.display_name}</Copy>
            </View>
          </View>
          <View style={styles.section}>
            <Copy kind='title'>
              {goal ? ro.refinement.nextStep : ro.refinement.firstStep}
            </Copy>
            {goal ? (
              <Panel accent>
                <Row
                  icon={Route}
                  title={goal.name}
                  subtitle={ro.refinement.yourGoal}
                  onPress={() => router.push('/objective')}
                />
                {!gapLoading && courses[0] && (
                  <>
                    <View style={styles.summary}>
                      <Copy kind='heading'>{courses[0].title}</Copy>
                      {!!courses[0].provider && (
                        <Copy
                          kind='caption'
                          style={{ color: theme.textSecondary }}
                        >
                          {courses[0].provider}
                        </Copy>
                      )}
                    </View>
                    <Button
                      onPress={() =>
                        router.push({
                          pathname: '/course/[id]',
                          params: { id: courses[0].id },
                        })
                      }
                    >
                      {ro.visual.continueStep}
                    </Button>
                  </>
                )}
                {!personalized.error && !gapLoading && !courses.length && (
                  <Copy kind='caption' style={{ color: theme.textSecondary }}>
                    Nu ai cursuri noi sugerate acum. Poți continua cu pașii
                    aleși sau explora alte opțiuni în Traseu.
                  </Copy>
                )}
                {!courses.length && !gapLoading && (
                  <Button onPress={() => router.push('/_tabs/path')}>
                    Vezi traseul
                  </Button>
                )}
              </Panel>
            ) : (
              <Panel accent>
                <Copy>
                  Pornește de la interesele tale. Alege ce vrei să explorezi și
                  ce pași vrei să urmezi.
                </Copy>
                <Button onPress={() => router.push('/_tabs/path')}>
                  {ro.visual.recommendations}
                </Button>
              </Panel>
            )}
          </View>
          <GroupedList inset>
            <Row
              icon={Compass}
              title={ro.explore.title}
              subtitle={ro.visual.exploreHint}
              onPress={() => router.navigate('/_tabs/explore')}
            />
            <Row
              icon={Bookmark}
              title={ro.visual.saved}
              subtitle={`${items.length} ${items.length === 1 ? ro.refinement.optionOne : ro.refinement.optionMany}`}
              onPress={() => router.push('/saved')}
            />
          </GroupedList>
          {personalized.error ? (
            <DataState error retry={personalized.retry} />
          ) : gapLoading || (goal && careerCoursesLoading) ? (
            <DataState loadingLayout='recommendations' loading />
          ) : null}
          {!!otherCourses.length && (
            <View style={styles.section}>
              <Section title={ro.recommendations.recommendedCourses} />
              {otherCourses.map((course) => (
                <Panel key={course.id}>
                  <Row
                    title={course.title}
                    subtitle={course.provider}
                    onPress={() =>
                      router.push({
                        pathname: '/course/[id]',
                        params: { id: course.id },
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
  greeting: { flexDirection: 'row', alignItems: 'center', gap: s.md },
  name: { flex: 1 },
  section: { gap: s.md },
  summary: { gap: s.sm },
});
