import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as WebBrowser from 'expo-web-browser';
import { useRouter } from 'expo-router';
import { CalendarDays, Clock, UserRound } from 'lucide-react-native';
import { Copy, Panel, Section, GroupedList, Row } from '@/components/design';
import { Button } from '@/components/Button';
import { useSession } from '@/providers/auth';
import { tutoringPayment } from '@/services/tutoring';
import { TeacherAccountContent, TeacherNote, TeacherPage } from './shared';

export default function TeacherDashboard() {
  const router = useRouter();
  const client = useQueryClient();
  const { session } = useSession();
  const onboarding = useMutation({
    mutationFn: async () => {
      const { url } = await tutoringPayment({ action: 'onboard' });
      await WebBrowser.openBrowserAsync(url);
    },
    onSuccess: () =>
      client.invalidateQueries({ queryKey: ['tutoring', session?.user.id] }),
  });
  return (
    <TeacherPage title='Panou profesor'>
      <TeacherAccountContent>
        {(data) => (
          <>
            <Copy kind='heading'>{data.display_name}</Copy>
            <TeacherNote>
              Cont de profesor aprobat. Gestionează ședințele și verifică
              informațiile publicate.
            </TeacherNote>
            <GroupedList inset>
              <Row
                title='Ședințele cu elevii'
                subtitle='Programări, istoric și acces la clasă'
                icon={CalendarDays}
                onPress={() => router.push('/teacher/lessons')}
              />
              <Row
                title='Disponibilitate'
                subtitle='Programul tău săptămânal'
                icon={Clock}
                onPress={() => router.push('/teacher/availability')}
              />
              <Row
                title='Profilul meu de profesor'
                subtitle='Materii, tarife și informații publice'
                icon={UserRound}
                onPress={() => router.push('/teacher/profile')}
              />
            </GroupedList>
            <Panel>
              <Section title='Plăți și încasări' />
              <Copy>
                {data.connect_status === 'active'
                  ? 'Plățile sunt configurate.'
                  : data.connect_status === 'pending'
                    ? 'Stripe verifică informațiile tale.'
                    : data.connect_status === 'restricted'
                      ? 'Stripe solicită informații suplimentare.'
                      : 'Configurează plățile pentru a putea primi rezervări.'}
              </Copy>
              <TeacherNote>
                NextStep reține 20% din fiecare ședință. Partea ta brută este
                80%, înainte de eventuale taxe și alte costuri.
              </TeacherNote>
              {data.connect_status !== 'active' && (
                <Button
                  loading={onboarding.isPending}
                  onPress={() => onboarding.mutate()}
                >
                  Configurează plățile în Stripe
                </Button>
              )}
              <Button
                variant='outline'
                onPress={() =>
                  client.invalidateQueries({
                    queryKey: ['tutoring', session?.user.id],
                  })
                }
              >
                Actualizează starea
              </Button>
              {onboarding.isError && (
                <Copy accessibilityRole='alert'>
                  Configurarea Stripe nu este disponibilă momentan. Încearcă din
                  nou.
                </Copy>
              )}
            </Panel>
          </>
        )}
      </TeacherAccountContent>
    </TeacherPage>
  );
}
