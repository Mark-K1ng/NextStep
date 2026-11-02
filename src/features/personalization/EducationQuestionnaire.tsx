import { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Screen, BackHeader, Copy, Choice, Panel } from '@/components/design';
import { Button } from '@/components';
import { DataState } from '@/components/data-state';
import { useEducation, useRefreshEducation } from '@/hooks/use-education';
import { useProfileQuery } from '@/hooks/use-profile';
import { useAppRouter } from '@/hooks/use-app-router';
import { saveEducation } from '@/services/education';
import { toggleAnswer } from '@/constants/questionnaire';
import { spacing } from '@/theme/tokens';
import {
  QuestionnaireHeading,
  questionnaireStyles,
} from './QuestionnaireHeading';
import {
  QUESTIONNAIRES,
  questionsFor,
  type EducationDocument,
  type QuestionnaireResponse,
} from '../../../supabase/functions/_shared/education';

export default function EducationQuestionnaire() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const definition = QUESTIONNAIRES.find((q) => q.id === id);
  const query = useEducation();
  const profile = useProfileQuery();
  const router = useAppRouter();
  const client = useQueryClient();
  const refresh = useRefreshEducation();
  const [loaded, setLoaded] = useState<EducationDocument | null>(null);
  const [response, setResponse] = useState<QuestionnaireResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const lock = useRef(false);
  const initialized = useRef('');
  const questions = useMemo(
    () =>
      definition ? questionsFor(definition, profile.data?.grade_level) : [],
    [definition, profile.data?.grade_level]
  );
  useEffect(() => {
    const key = `${query.data?.user_id}:${id}`;
    if (query.data && profile.data && initialized.current !== key) {
      initialized.current = key;
      setLoaded(query.data);
      const existing = query.data.responses[id];
      const firstMissing = questions.findIndex(
        (q) =>
          !existing?.answers[q.id]?.length && !existing?.skipped.includes(q.id)
      );
      setResponse({
        answers: {},
        skipped: [],
        status: 'draft',
        attempt: 1,
        ...existing,
        cursor:
          existing?.status === 'completed'
            ? 0
            : Math.min(
                existing?.cursor ?? Math.max(0, firstMissing),
                questions.length - 1
              ),
      });
    }
  }, [query.data, profile.data, id, questions]);
  const persist = async (next: QuestionnaireResponse, exit = false) => {
    if (lock.current || !loaded || loaded.user_id !== query.data?.user_id) {
      return;
    }
    lock.current = true;
    setBusy(true);
    setError('');
    try {
      const result = await saveEducation(loaded, id, next);
      setLoaded(result);
      setResponse(result.responses[id]);
      client.setQueryData(['education', result.user_id], result);
      await refresh(true);
      if (exit) {
        router.replace('/personalize');
      }
    } catch {
      setError(
        'La salvare a apărut o problemă. Reîncearcă alegerea sau reîncarcă răspunsurile dacă au fost modificate pe alt dispozitiv.'
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  if (!definition) {
    return (
      <Screen>
        <BackHeader title='Chestionar indisponibil' />
        <Button onPress={() => router.replace('/personalize')}>
          Înapoi la chestionare
        </Button>
      </Screen>
    );
  }
  const ready = loaded && loaded.user_id === query.data?.user_id && response;
  const question = ready && questions[response.cursor];
  const selected = question && (response.answers[question.id] || []);
  return (
    <Screen nativeTitle={definition.title} bottomSafeArea='content'>
      {Platform.OS !== 'ios' && <BackHeader title={definition.title} />}
      {query.isError || profile.isError || !ready || !question ? (
        <DataState
          loadingLayout='form'
          loading={!query.isError && !profile.isError}
          error={query.isError || profile.isError}
          retry={() => {
            query.refetch();
            profile.refetch();
          }}
        />
      ) : (
        <>
          <QuestionnaireHeading
            position={response.cursor + 1}
            total={questions.length}
            title={question.title}
            limit={question.limit}
          />
          <View style={{ gap: spacing.sm }}>
            {[...question.options, ['unknown', 'Nu știu încă'] as const].map(
              ([value, label]) => (
                <Choice
                  layout='row'
                  key={value}
                  selected={selected.includes(value)}
                  exclusive={question.limit === 1}
                  disabled={
                    busy ||
                    (!selected.includes(value) &&
                      value !== 'unknown' &&
                      question.limit > 1 &&
                      selected.length >= question.limit &&
                      !selected.includes('unknown'))
                  }
                  onPress={() =>
                    persist({
                      ...response,
                      status: 'draft',
                      answers: {
                        ...response.answers,
                        [question.id]: toggleAnswer(
                          selected,
                          value,
                          question.limit
                        ),
                      },
                      skipped: response.skipped.filter(
                        (key) => key !== question.id
                      ),
                    })
                  }
                >
                  {label}
                </Choice>
              )
            )}
          </View>
          {!!error && (
            <Panel>
              <Copy accessibilityRole='alert'>{error}</Copy>
              <Button
                disabled={busy}
                onPress={async () => {
                  initialized.current = '';
                  const result = await query.refetch();
                  if (!result.isError) {
                    setError('');
                  }
                }}
              >
                Reîncarcă răspunsurile
              </Button>
            </Panel>
          )}
          <Button
            loading={busy}
            onPress={() => {
              const skipped = selected.length
                ? response.skipped.filter((key) => key !== question.id)
                : [...new Set([...response.skipped, question.id])];
              const last = response.cursor === questions.length - 1;
              const missing = questions.findIndex(
                (q) =>
                  !response.answers[q.id]?.length && !skipped.includes(q.id)
              );
              const finished = last && missing === -1;
              persist(
                {
                  ...response,
                  skipped,
                  cursor: last ? Math.max(0, missing) : response.cursor + 1,
                  status: finished ? 'completed' : 'draft',
                },
                finished
              );
            }}
          >
            {response.cursor === questions.length - 1
              ? 'Finalizează chestionarul'
              : selected.length
                ? 'Continuă'
                : 'Sari întrebarea'}
          </Button>
          {response.cursor > 0 && (
            <Button
              variant='outline'
              disabled={busy}
              onPress={() =>
                persist({
                  ...response,
                  cursor: response.cursor - 1,
                  status: 'draft',
                })
              }
            >
              Întrebarea anterioară
            </Button>
          )}
          <Button
            variant='secondary'
            style={questionnaireStyles.quietButton}
            disabled={busy}
            onPress={() => router.replace('/personalize')}
          >
            Continuă mai târziu
          </Button>
          <Copy kind='caption'>
            {definition.id === 'confidence'
              ? 'Încrederea declarată nu reprezintă o măsurare a abilităților.'
              : 'Alegerile confirmate sunt salvate automat. Poți reveni oricând.'}
          </Copy>
        </>
      )}
    </Screen>
  );
}
