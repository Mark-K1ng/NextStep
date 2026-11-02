import { useRef, useState } from 'react';
import { questionnaireStyles } from './QuestionnaireHeading';
import { useQueryClient } from '@tanstack/react-query';
import {
  CircleCheck,
  CircleDashed,
  CircleDot,
  Compass,
  Users,
  Sprout,
  ListChecks,
} from 'lucide-react-native';
import {
  Screen,
  BackHeader,
  Copy,
  GroupedList,
  Row,
  Panel,
} from '@/components/design';
import { Button } from '@/components';
import { DataState } from '@/components/data-state';
import { useEducation, useRefreshEducation } from '@/hooks/use-education';
import { useProfileQuery } from '@/hooks/use-profile';
import { useAppRouter } from '@/hooks/use-app-router';
import { saveEducation } from '@/services/education';
import {
  QUESTIONNAIRES,
  questionsFor,
  questionnaireProgress,
} from '../../../supabase/functions/_shared/education';
import { useTheme } from '@/hooks/use-theme';
import { Platform } from 'react-native';

export default function QuestionnaireLibrary() {
  const education = useEducation();
  const profile = useProfileQuery();
  const router = useAppRouter();
  const theme = useTheme();
  const client = useQueryClient();
  const refresh = useRefreshEducation();
  const [clearing, setClearing] = useState<string | null>(null);
  const [managing, setManaging] = useState(false);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [error, setError] = useState('');
  const icons = [Compass, Users, Sprout, ListChecks];
  const clear = async () => {
    if (lock.current || !clearing || !education.data) {
      return;
    }
    lock.current = true;
    setBusy(true);
    try {
      const result = await saveEducation(
        education.data,
        clearing,
        { answers: {}, skipped: [], cursor: 0, status: 'draft', attempt: 1 },
        true
      );
      client.setQueryData(['education', result.user_id], result);
      setClearing(null);
      setError('');
      await refresh(true);
    } catch {
      setError(
        'Nu am putut șterge răspunsurile. Reîncarcă dacă au fost modificate pe alt dispozitiv, apoi reîncearcă.'
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  return (
    <Screen nativeTitle='Preferințe și recomandări' bottomSafeArea='content'>
      {Platform.OS !== 'ios' && (
        <BackHeader title='Preferințe și recomandări' />
      )}
      <Copy kind='title'>Mai multe despre tine</Copy>
      <Copy style={{ color: theme.textSecondary }}>
        Alege ce vrei să explorezi. Poți face o pauză, relua sau schimba
        răspunsurile oricând.
      </Copy>
      {education.isPending ||
      education.isError ||
      profile.isPending ||
      profile.isError ? (
        <DataState
          loadingLayout='form'
          loading={education.isPending || profile.isPending}
          error={education.isError || profile.isError}
          retry={() => {
            education.refetch();
            profile.refetch();
          }}
        />
      ) : (
        <>
          <GroupedList>
            {QUESTIONNAIRES.map((definition, index) => {
              const response = education.data.responses[definition.id];
              const progress = questionnaireProgress(
                response,
                questionsFor(definition, profile.data.grade_level)
              );
              const Status = progress.completed
                ? CircleCheck
                : progress.visited
                  ? CircleDot
                  : CircleDashed;
              const status = progress.completed
                ? 'Finalizat'
                : progress.visited
                  ? `În progres · ${progress.visited}/${progress.total}`
                  : 'Neînceput';
              return (
                <Row
                  key={definition.id}
                  icon={icons[index]}
                  title={definition.title}
                  accessibilityLabel={`${definition.title}. ${status}. ${definition.purpose}`}
                  subtitle={`${definition.purpose}\n${definition.minutes} · ${status}`}
                  trailing={
                    <Status
                      size={22}
                      color={
                        progress.completed
                          ? theme.accentText
                          : theme.textSecondary
                      }
                      accessible={false}
                    />
                  }
                  onPress={() =>
                    router.push({
                      pathname: '/questionnaire',
                      params: { id: definition.id },
                    })
                  }
                />
              );
            })}
          </GroupedList>
          <Copy kind='caption'>
            Acestea sunt exerciții de explorare, fără diagnostic sau măsurarea
            aptitudinilor. Poți sări orice întrebare.
          </Copy>
          <Button variant='outline' onPress={() => router.push('/_tabs/path')}>
            Vezi Traseul meu
          </Button>
          {QUESTIONNAIRES.some((q) => education.data.responses[q.id]) && (
            <Button
              variant='secondary'
              style={questionnaireStyles.quietButton}
              accessibilityState={{ expanded: managing }}
              disabled={busy}
              onPress={() => {
                setManaging(!managing);
                setClearing(null);
              }}
            >
              {managing
                ? 'Închide gestionarea răspunsurilor'
                : 'Gestionează răspunsurile'}
            </Button>
          )}
          {managing &&
            QUESTIONNAIRES.filter((q) => education.data.responses[q.id]).map(
              (q) => (
                <Button
                  key={q.id}
                  variant='outline'
                  disabled={busy}
                  onPress={() => setClearing(q.id)}
                >
                  {`Șterge: ${q.title}`}
                </Button>
              )
            )}
          {!!clearing && (
            <Panel>
              <Copy>
                Ștergi răspunsurile acestui chestionar? Opțiunile salvate și
                pașii acceptați rămân în cont.
              </Copy>
              <Button loading={busy} onPress={clear}>
                Confirmă ștergerea răspunsurilor
              </Button>
              <Button
                variant='secondary'
                disabled={busy}
                onPress={() => setClearing(null)}
              >
                Anulează
              </Button>
            </Panel>
          )}
          {!!error && (
            <Panel>
              <Copy accessibilityRole='alert'>{error}</Copy>
              <Button onPress={() => education.refetch()}>
                Reîncarcă răspunsurile
              </Button>
            </Panel>
          )}
        </>
      )}
    </Screen>
  );
}
