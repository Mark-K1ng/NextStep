import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { StyleSheet, View } from 'react-native';
import { Copy, Panel, Choice } from '@/components/design';
import { Button } from '@/components/Button';
import { DataState } from '@/components/data-state';
import { useSession } from '@/providers/auth';
import { loadLessons, completeLesson } from '@/services/tutoring';
import { classroomUrl, openClassroom } from '@/services/tutoring-classroom';
import {
  bookingLabels,
  paymentLabels,
  money,
  lessonDate,
} from '@/lib/tutoring';
import type { Lesson } from '@/types/tutoring';
import { spacing as s } from '@/theme/tokens';
import { TeacherNote, TeacherPage } from './shared';

function TeacherLesson({
  lesson,
  refresh,
}: {
  lesson: Lesson;
  refresh: () => void;
}) {
  const mutation = useMutation({
    mutationFn: () => completeLesson(lesson.id),
    onSuccess: refresh,
  });
  const [classroomError, setClassroomError] = useState(false);
  return (
    <Panel>
      <Copy kind='heading'>{lesson.subject}</Copy>
      <Copy>{lesson.student_name}</Copy>
      <TeacherNote>{lessonDate(lesson.starts_at)} · 60 minute</TeacherNote>
      <Copy>
        {bookingLabels[lesson.status]} · {paymentLabels[lesson.payment_status]}
      </Copy>
      <TeacherNote>
        {money(lesson.amount_minor)} · Partea ta brută:{' '}
        {money(lesson.teacher_share_minor)}
      </TeacherNote>
      {classroomUrl(lesson) ? (
        <Button
          variant='secondary'
          onPress={async () => {
            setClassroomError(false);
            try {
              await openClassroom(lesson);
            } catch {
              setClassroomError(true);
            }
          }}
        >
          Intră în Google Classroom
        </Button>
      ) : (
        <TeacherNote>Clasa nu este încă disponibilă.</TeacherNote>
      )}
      {classroomError && (
        <Copy accessibilityRole='alert'>
          Nu am putut deschide clasa. Încearcă din nou.
        </Copy>
      )}
      {lesson.status === 'scheduled' &&
        ['paid', 'partially_refunded'].includes(lesson.payment_status) &&
        new Date(lesson.ends_at) < new Date() && (
          <Button
            loading={mutation.isPending}
            variant='secondary'
            onPress={() => mutation.mutate()}
          >
            Confirmă ședința finalizată
          </Button>
        )}
      {mutation.isError && (
        <Copy accessibilityRole='alert'>
          Nu am putut confirma ședința. Actualizează starea și încearcă din nou.
        </Copy>
      )}
    </Panel>
  );
}

export default function TeacherLessons() {
  const { session } = useSession();
  const client = useQueryClient();
  const userId = session?.user.id;
  const [history, setHistory] = useState(false);
  const query = useInfiniteQuery({
    queryKey: ['teacher', session?.user.id, 'lessons'],
    enabled: !!session,
    initialPageParam: 0,
    staleTime: 30_000,
    queryFn: ({ pageParam, signal }) => loadLessons(true, pageParam, signal),
    getNextPageParam: (last) => (last.more ? last.page + 1 : undefined),
  });
  useFocusEffect(
    useCallback(() => {
      client.invalidateQueries({
        queryKey: ['teacher', userId, 'lessons'],
      });
    }, [client, userId])
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
    <TeacherPage title='Ședințele cu elevii'>
      <View style={styles.choices}>
        <Choice exclusive selected={!history} onPress={() => setHistory(false)}>
          Viitoare
        </Choice>
        <Choice exclusive selected={history} onPress={() => setHistory(true)}>
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
      {query.isPending ? (
        <DataState loadingLayout='lesson' loading />
      ) : (
        <>
          {rows.map((lesson) => (
            <TeacherLesson
              key={lesson.id}
              lesson={lesson}
              refresh={() => {
                query.refetch();
              }}
            />
          ))}
          {query.isError ? (
            <DataState error retry={() => query.refetch()} />
          ) : (
            !rows.length && (
              <Panel>
                <Copy>
                  {history
                    ? 'Nu ai ședințe în istoric.'
                    : 'Nu ai ședințe programate.'}
                </Copy>
                <TeacherNote>
                  {query.hasNextPage
                    ? 'Poți încărca alte ședințe pentru perioada selectată.'
                    : 'Programările confirmate apar aici.'}
                </TeacherNote>
              </Panel>
            )
          )}
          {query.hasNextPage && (
            <Button
              variant='secondary'
              loading={query.isFetchingNextPage}
              onPress={() => query.fetchNextPage()}
            >
              Mai multe ședințe
            </Button>
          )}
        </>
      )}
    </TeacherPage>
  );
}

const styles = StyleSheet.create({
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: s.sm },
});
