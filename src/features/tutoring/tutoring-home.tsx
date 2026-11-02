import { useBottomSafeArea } from '@/hooks/use-bottom-safe-area';
import { useState } from 'react';
import { useAccountMode } from '@/providers/account-mode';
import { StudentPreviewBanner } from '@/components/student-preview-banner';
import { FlatList, Platform, View } from 'react-native';
import { SafeAreaView } from '@/components/safe-area';
import { SafeAreaView as NavigationSafeAreaView } from 'react-native-screens/experimental';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { Copy, GroupedList, Panel, Row, Section } from '@/components/design';
import { CalendarDays } from 'lucide-react-native';
import { MotionPressable } from '@/components/motion';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { SelectField } from '@/components/SelectField';
import { DataState } from '@/components/data-state';
import { BottomNavigation } from '@/components/bottom-navigation';
import { useTheme } from '@/hooks/use-theme';
import { useAppRouter } from '@/hooks/use-app-router';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useTutoringAccount, useTutoringSubjects } from '@/hooks/use-tutoring';
import { discoverTutors, loadLessons } from '@/services/tutoring';
import { bookingLabels, lessonDate } from '@/lib/tutoring';
import { Note, TutorCard, styles } from './shared';
import { TUTORING_BOOKINGS_ENABLED } from '@/constants/release-capabilities';

const Separator = () => <View style={styles.separator} />;
export default function TutoringHome() {
  const theme = useTheme();
  const bottom = useBottomSafeArea();
  const router = useAppRouter();
  const [search, setSearch] = useState('');
  const [subject, setSubject] = useState('');
  const debounced = useDebouncedValue(search, 350);
  const { userId } = useTutoringAccount();
  const { isPreview } = useAccountMode();
  const subjects = useTutoringSubjects();
  const tutors = useInfiniteQuery({
    queryKey: ['tutoring-discovery', debounced, subject],
    initialPageParam: 0,
    staleTime: 60_000,
    queryFn: ({ pageParam, signal }) =>
      discoverTutors(debounced, subject, pageParam, signal),
    getNextPageParam: (last) => (last.more ? last.page + 1 : undefined),
  });
  const lessons = useQuery({
    queryKey: ['tutoring', userId, 'home-lessons'],
    enabled: !!userId && !isPreview,
    staleTime: 60_000,
    queryFn: ({ signal }) => loadLessons(false, 0, signal),
  });
  const upcoming = lessons.data?.items
    .filter(
      (lesson) =>
        ['scheduled', 'pending_payment'].includes(lesson.status) &&
        new Date(lesson.starts_at) > new Date()
    )
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at))
    .slice(0, 2);
  const filtered = !!search.trim() || !!subject;
  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.flex, { backgroundColor: theme.background }]}
    >
      <NavigationSafeAreaView
        edges={{ bottom: Platform.OS === 'ios' && !bottom.content }}
        style={styles.flex}
      >
        <StudentPreviewBanner />
        <FlatList
          data={tutors.data?.pages.flatMap((page) => page.items) ?? []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <TutorCard tutor={item} />}
          contentContainerStyle={[
            styles.list,
            bottom.content && { paddingBottom: 16 + bottom.inset },
          ]}
          ItemSeparatorComponent={Separator}
          keyboardShouldPersistTaps='handled'
          ListHeaderComponent={
            <View style={styles.stack}>
              <View style={styles.compact}>
                <View style={styles.row}>
                  <Copy kind='title' style={styles.flex}>
                    Meditații
                  </Copy>
                  {!isPreview && (
                    <MotionPressable
                      accessibilityRole='button'
                      accessibilityLabel='Ședințele mele'
                      onPress={() => router.push('/tutoring/lessons')}
                      style={({ pressed }) => [
                        styles.utilityAction,
                        {
                          backgroundColor: pressed
                            ? theme.surfaceElevated
                            : theme.surface,
                        },
                      ]}
                    >
                      <CalendarDays size={22} color={theme.accentText} />
                    </MotionPressable>
                  )}
                </View>
                <Note>Meditații · program pilot</Note>
              </View>
              {!TUTORING_BOOKINGS_ENABLED && (
                <Panel>
                  <Copy kind='heading'>Pregătim primele ședințe</Copy>
                  <Note>
                    Poți explora profesorii aprobați când devin disponibili.
                    Rezervările și plățile nu sunt deschise în această versiune.
                  </Note>
                </Panel>
              )}
              <Input
                variant='search'
                accessibilityLabel='Caută un profesor'
                placeholder='Caută după numele profesorului'
                value={search}
                onChangeText={setSearch}
                maxLength={100}
              />
              {subjects.isError ? (
                <DataState error retry={() => subjects.refetch()} />
              ) : (
                <SelectField
                  label='Materie'
                  value={subject}
                  options={[
                    { value: '', label: 'Toate materiile' },
                    ...(subjects.data ?? []).map((name) => ({
                      value: name,
                      label: name,
                    })),
                  ]}
                  onChange={setSubject}
                />
              )}
              {isPreview ? null : lessons.isPending ? (
                <DataState loading loadingLayout='lesson' />
              ) : lessons.isError ? (
                <DataState error retry={() => lessons.refetch()} />
              ) : upcoming?.length ? (
                <View style={styles.compact}>
                  <Section
                    title='Ședințe viitoare'
                    action='Vezi toate'
                    onPress={() => router.push('/tutoring/lessons')}
                  />
                  <GroupedList>
                    {upcoming.map((lesson) => (
                      <Row
                        key={lesson.id}
                        title={lesson.subject}
                        subtitle={[
                          lesson.tutor_name,
                          lessonDate(lesson.starts_at),
                          bookingLabels[lesson.status],
                        ].join(' · ')}
                        onPress={() => router.push('/tutoring/lessons')}
                      />
                    ))}
                  </GroupedList>
                </View>
              ) : null}
              <Section title='Profesori' />
            </View>
          }
          ListEmptyComponent={
            tutors.isPending ? (
              <DataState loading loadingLayout='tutor' />
            ) : tutors.isError ? (
              <DataState error retry={() => tutors.refetch()} />
            ) : (
              <Panel>
                <Copy kind='heading'>
                  {filtered
                    ? 'Niciun profesor pentru această căutare'
                    : 'Nu sunt profesori disponibili încă'}
                </Copy>
                <Note>
                  {filtered
                    ? 'Încearcă alt nume sau alege o altă materie.'
                    : 'Profilurile apar aici după aprobare. Poți reveni mai târziu pentru a vedea profesorii disponibili.'}
                </Note>
                {filtered ? (
                  <Button
                    variant='secondary'
                    onPress={() => {
                      setSearch('');
                      setSubject('');
                    }}
                  >
                    Resetează filtrele
                  </Button>
                ) : null}
              </Panel>
            )
          }
          ListFooterComponent={
            <View style={styles.stack}>
              {tutors.hasNextPage && (
                <Button
                  variant='secondary'
                  loading={tutors.isFetchingNextPage}
                  onPress={() => tutors.fetchNextPage()}
                >
                  Mai mulți profesori
                </Button>
              )}
              {tutors.isError && tutors.data && (
                <DataState error retry={() => tutors.refetch()} />
              )}
            </View>
          }
        />
      </NavigationSafeAreaView>
      {Platform.OS === 'web' && <BottomNavigation active='tutoring' />}
    </SafeAreaView>
  );
}
