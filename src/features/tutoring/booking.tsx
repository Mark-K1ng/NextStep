import { useRef, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { secureRandomUUID } from '@/lib/secure-crypto';
import * as WebBrowser from 'expo-web-browser';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { loadSlots, loadTutor, tutoringPayment } from '@/services/tutoring';
import { TutoringPage, Note } from './shared';
import { Copy, Panel } from '@/components/design';
import { Button } from '@/components/Button';
import { SelectField } from '@/components/SelectField';
import { DataState } from '@/components/data-state';
import { lessonDate, money } from '@/lib/tutoring';
import { useAppRouter } from '@/hooks/use-app-router';
import { useAccountMode } from '@/providers/account-mode';
import { TUTORING_BOOKINGS_ENABLED } from '@/constants/release-capabilities';

export default function Booking() {
  const { isTeacher } = useAccountMode();
  return !TUTORING_BOOKINGS_ENABLED ? (
    <TutoringPage title='Meditații · program pilot'>
      <Copy>Rezervările și plățile nu sunt deschise în această versiune.</Copy>
      <Note>
        Ședințele deja înregistrate rămân disponibile în Ședințele mele.
      </Note>
    </TutoringPage>
  ) : isTeacher ? (
    <TutoringPage title='Rezervare'>
      <Copy>Rezervările sunt disponibile doar pentru conturile de elev.</Copy>
    </TutoringPage>
  ) : (
    <StudentBooking />
  );
}
function StudentBooking() {
  const { id = '' } = useLocalSearchParams<{ id: string }>();
  const router = useAppRouter();
  const client = useQueryClient();
  const [subject, setSubject] = useState('');
  const [slot, setSlot] = useState('');
  const [returned, setReturned] = useState(false);
  const retry = useRef<{ key: string; id: string } | null>(null);
  const tutor = useQuery({
    queryKey: ['tutoring-tutor', id],
    queryFn: ({ signal }) => loadTutor(id, signal),
    staleTime: 60_000,
  });
  const slots = useQuery({
    queryKey: ['tutoring-slots', id],
    queryFn: ({ signal }) => loadSlots(id, signal),
    staleTime: 30_000,
  });
  const chosen = tutor.data?.subjects.find((row) => row.subject === subject);
  const payment = useMutation({
    mutationFn: async () => {
      const key = `${id}:${subject}:${slot}`;
      if (retry.current?.key !== key) {
        retry.current = { key, id: secureRandomUUID() };
      }
      const result = await tutoringPayment({
        action: 'checkout',
        tutor_id: id,
        subject,
        starts_at: slot,
        request_id: retry.current.id,
      });
      await WebBrowser.openBrowserAsync(result.url);
    },
    onSuccess: async () => {
      setReturned(true);
      await Promise.all([
        client.invalidateQueries({ queryKey: ['tutoring'] }),
        client.invalidateQueries({ queryKey: ['tutoring-slots', id] }),
      ]);
    },
  });
  return (
    <TutoringPage title='Rezervă o ședință'>
      {tutor.isPending || slots.isPending ? (
        <DataState loadingLayout='form' loading />
      ) : tutor.isError || slots.isError ? (
        <DataState
          error
          retry={() => {
            tutor.refetch();
            slots.refetch();
          }}
        />
      ) : !tutor.data ? (
        <Copy>Profesorul nu este disponibil.</Copy>
      ) : (
        <>
          <Copy kind='title'>{tutor.data.display_name}</Copy>
          <SelectField
            label='Alege materia'
            value={subject}
            options={tutor.data.subjects.map((row) => ({
              value: row.subject,
              label: `${row.subject} · ${money(row.price_minor)}`,
            }))}
            onChange={setSubject}
          />
          {slots.data?.length ? (
            <SelectField
              label='Alege data și ora'
              value={slot}
              options={slots.data.map((row) => ({
                value: row.starts_at,
                label: lessonDate(row.starts_at),
              }))}
              onChange={setSlot}
            />
          ) : (
            <Note>Nu sunt ore disponibile în următoarele două săptămâni.</Note>
          )}
          <Note>Orele sunt afișate în fusul orar al României.</Note>
          {chosen && slot && (
            <Panel>
              <Copy>{subject} · 60 minute</Copy>
              <Copy>{lessonDate(slot)}</Copy>
              <Copy>Total: {money(chosen.price_minor)}</Copy>
              <Note>
                Prețul final este verificat la rezervare. Ședința este
                confirmată după procesarea plății.
              </Note>
            </Panel>
          )}
          {!tutor.data.can_book && (
            <Note>Plățile profesorului nu sunt încă disponibile.</Note>
          )}
          <Button
            disabled={!chosen || !slot || !tutor.data.can_book || returned}
            loading={payment.isPending}
            onPress={() => payment.mutate()}
          >
            Continuă la plată
          </Button>
          {payment.isError && (
            <Copy accessibilityRole='alert'>
              Nu am putut deschide plata. Ora poate fi ocupată sau plățile nu
              sunt încă disponibile. Actualizează orele și încearcă din nou.
            </Copy>
          )}
          {returned && (
            <Note>
              Verificăm plata prin Stripe. Starea confirmată apare în Ședințele
              mele. Închiderea paginii de plată nu confirmă rezervarea.
            </Note>
          )}
          <Button
            variant='secondary'
            onPress={() => router.push('/tutoring/lessons')}
          >
            Ședințele mele
          </Button>
          <Button variant='outline' onPress={() => slots.refetch()}>
            Actualizează orele
          </Button>
        </>
      )}
    </TutoringPage>
  );
}
