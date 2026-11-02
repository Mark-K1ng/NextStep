import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as WebBrowser from 'expo-web-browser';
import { TutoringPage, Note } from './shared';
import { Copy, Panel, Section } from '@/components/design';
import { Button } from '@/components/Button';
import { DataState } from '@/components/data-state';
import { useTutoringAccount } from '@/hooks/use-tutoring';
import { useAppRouter } from '@/hooks/use-app-router';
import { tutoringPayment } from '@/services/tutoring';
import { applicationLabels, availabilityLabel, money } from '@/lib/tutoring';

export default function TutorDashboard() {
  const { userId, query } = useTutoringAccount();
  const router = useAppRouter();
  const client = useQueryClient();
  const onboarding = useMutation({
    mutationFn: async () => {
      const { url } = await tutoringPayment({ action: 'onboard' });
      await WebBrowser.openBrowserAsync(url);
    },
    onSuccess: () =>
      client.invalidateQueries({ queryKey: ['tutoring', userId] }),
  });
  const data = query.data;
  return (
    <TutoringPage title='Panou profesor'>
      {query.isPending ? (
        <DataState loadingLayout='dashboard' loading />
      ) : query.isError ? (
        <DataState error retry={() => query.refetch()} />
      ) : !data || data.status !== 'approved' ? (
        <Panel>
          <Copy>
            {data
              ? applicationLabels[data.status]
              : 'Trimite o cerere pentru a deveni profesor.'}
          </Copy>
          <Button onPress={() => router.push('/tutoring/application')}>
            Vezi cererea
          </Button>
        </Panel>
      ) : (
        <>
          <Copy kind='title'>{data.display_name}</Copy>
          <Note>
            Profesor aprobat · Poți continua să rezervi ședințe ca elev din
            Meditații.
          </Note>
          <Button
            onPress={() =>
              router.push({
                pathname: '/tutoring/lessons',
                params: { mode: 'teacher' },
              })
            }
          >
            Ședințele cu elevii
          </Button>
          <Panel>
            <Section title='Plăți și încasări' />
            <Copy>
              {data.connect_status === 'active'
                ? 'Plățile sunt configurate.'
                : 'Configurează plățile pentru a putea primi rezervări.'}
            </Copy>
            <Note>
              {data.connect_status === 'pending'
                ? 'Stripe verifică informațiile tale.'
                : data.connect_status === 'restricted'
                  ? 'Stripe solicită informații suplimentare.'
                  : 'NextStep reține 20% din fiecare ședință. Partea ta brută este 80%, înainte de eventuale taxe și alte costuri.'}
            </Note>
            <Button
              variant='secondary'
              loading={onboarding.isPending}
              onPress={() => onboarding.mutate()}
            >
              Configurează plățile în Stripe
            </Button>
            <Button variant='outline' onPress={() => query.refetch()}>
              Actualizează starea
            </Button>
            {onboarding.isError && (
              <Copy accessibilityRole='alert'>
                Configurarea Stripe nu este disponibilă momentan. Încearcă din
                nou mai târziu.
              </Copy>
            )}
          </Panel>
          <Panel>
            <Section title='Materii și tarife' />
            {data.subjects.map((subject) => (
              <Copy key={subject.subject}>
                {subject.subject} · {money(subject.price_minor)}/oră
              </Copy>
            ))}
          </Panel>
          <Panel>
            <Section title='Disponibilitate' />
            {data.availability.map((row, index) => (
              <Copy key={index}>{availabilityLabel(row)}</Copy>
            ))}
          </Panel>
          <Button
            variant='secondary'
            onPress={() => router.push('/tutoring/application')}
          >
            Editează profilul, tarifele și programul
          </Button>
          <Button
            variant='outline'
            onPress={() =>
              router.push({
                pathname: '/tutoring/tutor/[id]',
                params: { id: data.id },
              })
            }
          >
            Vezi profilul public și recenziile
          </Button>
          <Note>
            Clasele externe apar în ședințe după configurarea lor. Documentele
            și materialele rămân în serviciile Google.
          </Note>
        </>
      )}
    </TutoringPage>
  );
}
