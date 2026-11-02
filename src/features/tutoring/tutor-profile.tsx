import { useLocalSearchParams } from 'expo-router';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { View } from 'react-native';
import { loadTutor, loadReviews } from '@/services/tutoring';
import { TutoringPage, Note, styles } from './shared';
import { Copy, Panel, Section } from '@/components/design';
import { Button } from '@/components/Button';
import { DataState } from '@/components/data-state';
import { useAppRouter } from '@/hooks/use-app-router';
import { availabilityLabel, money } from '@/lib/tutoring';
import { useAccountMode } from '@/providers/account-mode';
import { TUTORING_BOOKINGS_ENABLED } from '@/constants/release-capabilities';

export default function TutorProfile() {
  const { id = '' } = useLocalSearchParams<{ id: string }>();
  const router = useAppRouter();
  const { isTeacher } = useAccountMode();
  const query = useQuery({
    queryKey: ['tutoring-tutor', id],
    queryFn: ({ signal }) => loadTutor(id, signal),
    staleTime: 60_000,
  });
  const reviews = useInfiniteQuery({
    queryKey: ['tutoring-reviews', id],
    initialPageParam: 0,
    queryFn: ({ pageParam, signal }) => loadReviews(id, pageParam, signal),
    getNextPageParam: (last, pages) =>
      last.length === 20 ? pages.length : undefined,
    staleTime: 60_000,
  });
  const tutor = query.data;
  return (
    <TutoringPage title='Profil profesor'>
      {query.isPending ? (
        <DataState loadingLayout='tutor' loading />
      ) : query.isError ? (
        <DataState error retry={() => query.refetch()} />
      ) : !tutor ? (
        <Copy>Profilul profesorului nu este disponibil.</Copy>
      ) : (
        <>
          <View style={styles.compact}>
            <Copy kind='title'>{tutor.display_name}</Copy>
            <Note>
              {tutor.review_count
                ? `${tutor.rating} / 5 · ${tutor.review_count} recenzii`
                : 'Fără recenzii încă'}{' '}
              · {tutor.completed_lessons} ședințe finalizate
            </Note>
          </View>
          <Copy>{tutor.biography}</Copy>
          <Panel>
            <Section title='Materii și tarife' />
            {tutor.subjects.map((subject) => (
              <Copy key={subject.subject}>
                {subject.subject} · {money(subject.price_minor)}/oră
              </Copy>
            ))}
            <Note>
              {tutor.levels
                .map((level) =>
                  level === 'student' ? 'Universitate' : `Clasa ${level}`
                )
                .join(' · ')}
            </Note>
          </Panel>
          <Panel>
            <Section title='Experiență și calificări' />
            <Copy>{tutor.experience}</Copy>
            <Note>{tutor.qualifications}</Note>
          </Panel>
          <Panel>
            <Section title='Disponibilitate' />
            <Note>
              Orele sunt afișate în fusul orar al României. Ședințele durează 60
              de minute.
            </Note>
            {tutor.availability.length ? (
              tutor.availability.map((row, index) => (
                <Copy key={index}>{availabilityLabel(row)}</Copy>
              ))
            ) : (
              <Note>Profesorul nu a adăugat încă ore disponibile.</Note>
            )}
          </Panel>
          {!TUTORING_BOOKINGS_ENABLED ? (
            <Note>Rezervările nu sunt deschise încă în programul pilot.</Note>
          ) : (
            !tutor.can_book && (
              <Note>
                Profesorul nu poate primi încă plăți. Rezervările vor fi
                disponibile după configurarea plăților.
              </Note>
            )
          )}
          <Button
            disabled={
              !TUTORING_BOOKINGS_ENABLED ||
              isTeacher ||
              !tutor.can_book ||
              !tutor.availability.length
            }
            onPress={() =>
              router.push({ pathname: '/tutoring/book/[id]', params: { id } })
            }
          >
            Rezervă o ședință
          </Button>
          {isTeacher && (
            <Note>
              Rezervările sunt disponibile doar pentru conturile de elev.
            </Note>
          )}
          <Section title='Recenzii' />
          {reviews.isPending ? (
            <DataState loadingLayout='text' loading />
          ) : reviews.isError ? (
            <DataState error retry={() => reviews.refetch()} />
          ) : reviews.data.pages.flat().length ? (
            reviews.data.pages.flat().map((review) => (
              <Panel key={review.id}>
                <Copy>{review.rating} / 5</Copy>
                <Copy>{review.comment || 'Recenzie fără comentariu.'}</Copy>
              </Panel>
            ))
          ) : (
            <Note>Nu există recenzii încă.</Note>
          )}
          {reviews.hasNextPage && (
            <Button
              variant='secondary'
              loading={reviews.isFetchingNextPage}
              onPress={() => reviews.fetchNextPage()}
            >
              Mai multe recenzii
            </Button>
          )}
        </>
      )}
    </TutoringPage>
  );
}
