import { useBottomSafeArea } from '@/hooks/use-bottom-safe-area';
import { useCallback, useState } from 'react';
import * as WebBrowser from 'expo-web-browser';
import { FlatList, Platform, View } from 'react-native';
import { Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { SafeAreaView } from '@/components/safe-area';
import { SafeAreaView as NavigationSafeAreaView } from 'react-native-screens/experimental';
import { BackHeader, Copy, Panel, Choice } from '@/components/design';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { DataState } from '@/components/data-state';
import { BottomNavigation } from '@/components/bottom-navigation';
import { useSession } from '@/providers/auth';
import { useTheme } from '@/hooks/use-theme';
import {
  loadLessons,
  reviewLesson,
  completeLesson,
  tutoringPayment,
} from '@/services/tutoring';
import { classroomUrl, openClassroom } from '@/services/tutoring-classroom';
import {
  bookingLabels,
  paymentLabels,
  lessonDate,
  money,
} from '@/lib/tutoring';
import type { Lesson } from '@/types/tutoring';
import { Note, styles } from './shared';

function LessonCard({
  lesson,
  teacher,
  refresh,
}: {
  lesson: Lesson;
  teacher: boolean;
  refresh(): void;
}) {
  const [reviewing, setReviewing] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const resume = useMutation({
    mutationFn: async () => {
      const { url } = await tutoringPayment({
        action: 'resume',
        booking_id: lesson.id,
      });
      await WebBrowser.openBrowserAsync(url);
    },
    onSuccess: refresh,
  });
  const complete = useMutation({
    mutationFn: () => completeLesson(lesson.id),
    onSuccess: refresh,
  });
  const mutation = useMutation({
    mutationFn: () => reviewLesson(lesson.id, rating, comment),
    onSuccess: () => {
      setReviewing(false);
      refresh();
    },
  });
  const canReview =
    !teacher &&
    lesson.status === 'completed' &&
    ['paid', 'partially_refunded'].includes(lesson.payment_status) &&
    !lesson.reviewed;
  return (
    <Panel>
      <Copy kind='heading'>{lesson.subject}</Copy>
      <Copy>{teacher ? lesson.student_name : lesson.tutor_name}</Copy>
      <Note>{lessonDate(lesson.starts_at)} · 60 minute</Note>
      <Copy>
        {bookingLabels[lesson.status]} · {paymentLabels[lesson.payment_status]}
      </Copy>
      {!teacher && lesson.status === 'pending_payment' && (
        <Button
          variant='secondary'
          loading={resume.isPending}
          onPress={() => resume.mutate()}
        >
          Continuă plata
        </Button>
      )}
      {resume.isError && (
        <Copy accessibilityRole='alert'>
          Plata nu poate fi reluată momentan. Actualizează starea ședinței.
        </Copy>
      )}
      <Note>
        {money(lesson.amount_minor)}
        {teacher
          ? ` · Partea ta brută: ${money(lesson.teacher_share_minor)}`
          : ''}
      </Note>
      {classroomUrl(lesson) ? (
        <Button variant='secondary' onPress={() => openClassroom(lesson)}>
          Intră în Google Classroom
        </Button>
      ) : (
        <Note>Clasa nu este încă disponibilă.</Note>
      )}
      {canReview && !reviewing && (
        <Button variant='secondary' onPress={() => setReviewing(true)}>
          Lasă o recenzie
        </Button>
      )}
      {reviewing && (
        <View style={styles.stack}>
          <Copy>Evaluarea ta</Copy>
          <View style={styles.wrap}>
            {[1, 2, 3, 4, 5].map((value) => (
              <Choice
                key={value}
                exclusive
                selected={rating === value}
                onPress={() => setRating(value)}
              >
                {value} / 5
              </Choice>
            ))}
          </View>
          <Input
            label='Comentariu (opțional)'
            multiline
            value={comment}
            onChangeText={setComment}
            maxLength={1500}
          />
          <Button
            loading={mutation.isPending}
            onPress={() => mutation.mutate()}
          >
            Publică recenzia
          </Button>
          <Button variant='outline' onPress={() => setReviewing(false)}>
            Renunță
          </Button>
          {mutation.isError && (
            <Copy accessibilityRole='alert'>
              Nu am putut salva recenzia. Actualizează ședințele și încearcă din
              nou.
            </Copy>
          )}
        </View>
      )}
      {lesson.reviewed && !teacher && (
        <Note>Ai lăsat o recenzie pentru această ședință.</Note>
      )}
      {teacher &&
        lesson.status === 'scheduled' &&
        ['paid', 'partially_refunded'].includes(lesson.payment_status) &&
        new Date(lesson.ends_at) < new Date() && (
          <Button
            variant='secondary'
            loading={complete.isPending}
            onPress={() => complete.mutate()}
          >
            Confirmă ședința finalizată
          </Button>
        )}
      {complete.isError && (
        <Copy accessibilityRole='alert'>
          Nu am putut confirma ședința. Actualizează și încearcă din nou.
        </Copy>
      )}
    </Panel>
  );
}
export default function Lessons() {
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const teacher = mode === 'teacher';
  const { session } = useSession();
  const theme = useTheme();
  const bottom = useBottomSafeArea();
  const client = useQueryClient();
  const [history, setHistory] = useState(false);
  const query = useInfiniteQuery({
    queryKey: ['tutoring', session?.user.id, 'lessons', teacher],
    initialPageParam: 0,
    staleTime: 30_000,
    queryFn: ({ pageParam, signal }) => loadLessons(teacher, pageParam, signal),
    getNextPageParam: (last) => (last.more ? last.page + 1 : undefined),
  });
  useFocusEffect(
    useCallback(() => {
      client.invalidateQueries({
        queryKey: ['tutoring', session?.user.id, 'lessons'],
      });
    }, [client, session?.user.id])
  );
  const rows =
    query.data?.pages
      .flatMap((page) => page.items)
      .filter((lesson) =>
        history
          ? new Date(lesson.ends_at) <= new Date() ||
            ['cancelled', 'refunded'].includes(lesson.status)
          : new Date(lesson.ends_at) > new Date() &&
            !['cancelled', 'refunded'].includes(lesson.status)
      ) ?? [];
  return (
    <SafeAreaView
      edges={
        Platform.OS === 'ios' ? ['left', 'right'] : ['top', 'left', 'right']
      }
      style={[styles.flex, { backgroundColor: theme.background }]}
    >
      {Platform.OS === 'ios' && (
        <Stack.Screen
          options={{
            headerShown: true,
            title: teacher ? 'Ședințele cu elevii' : 'Ședințele mele',
            headerTintColor: theme.accentText,
            headerStyle: { backgroundColor: theme.background },
            headerTitleStyle: {
              fontFamily: 'PlusJakartaSans',
              fontWeight: '600',
            },
            headerShadowVisible: false,
            headerBackButtonDisplayMode: 'minimal',
          }}
        />
      )}
      <NavigationSafeAreaView
        edges={{ bottom: Platform.OS === 'ios' && !bottom.content }}
        style={styles.flex}
      >
        <FlatList
          data={rows}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.list,
            bottom.content && { paddingBottom: 16 + bottom.inset },
          ]}
          renderItem={({ item }) => (
            <LessonCard
              lesson={item}
              teacher={teacher}
              refresh={() => {
                query.refetch();
                client.invalidateQueries({
                  queryKey: ['tutoring-reviews'],
                });
                client.invalidateQueries({
                  queryKey: ['tutoring-discovery'],
                });
              }}
            />
          )}
          ListHeaderComponent={
            <View style={styles.stack}>
              {Platform.OS !== 'ios' && (
                <BackHeader
                  title={teacher ? 'Ședințele cu elevii' : 'Ședințele mele'}
                />
              )}
              <View style={styles.wrap}>
                <Choice
                  exclusive
                  selected={!history}
                  onPress={() => setHistory(false)}
                >
                  Viitoare
                </Choice>
                <Choice
                  exclusive
                  selected={history}
                  onPress={() => setHistory(true)}
                >
                  Istoric
                </Choice>
              </View>
              <Button
                variant='outline'
                loading={query.isRefetching}
                onPress={() => query.refetch()}
              >
                Actualizează starea
              </Button>
            </View>
          }
          ListEmptyComponent={
            query.isPending ? (
              <DataState loadingLayout='lesson' loading />
            ) : query.isError ? (
              <DataState error retry={() => query.refetch()} />
            ) : (
              <Panel>
                <Copy>
                  {history
                    ? 'Nu ai ședințe în istoric.'
                    : 'Nu ai ședințe programate.'}
                </Copy>
              </Panel>
            )
          }
          ListFooterComponent={
            query.hasNextPage ? (
              <Button
                variant='secondary'
                loading={query.isFetchingNextPage}
                onPress={() => query.fetchNextPage()}
              >
                Mai multe ședințe
              </Button>
            ) : query.isError && query.data ? (
              <DataState error retry={() => query.refetch()} />
            ) : null
          }
        />
      </NavigationSafeAreaView>
      {Platform.OS === 'web' && <BottomNavigation active='tutoring' />}
    </SafeAreaView>
  );
}
