import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { Screen, Copy, Choice, Panel, BackHeader } from '@/components/design';
import { Button } from '@/components';
import { GradeSelect } from '@/components/profile-selectors';
import { useAppRouter } from '@/hooks/use-app-router';
import {
  readGuestIntake,
  writeGuestIntake,
  newGuestIntake,
  clearGuestIntake,
  type GuestIntake as Draft,
} from '@/services/education';
import {
  QUESTIONNAIRES,
  rankDirections,
  stageCopy,
  activityFor,
  legacyResponses,
} from '../../../supabase/functions/_shared/education';
import { toggleAnswer } from '@/constants/questionnaire';
import { spacing } from '@/theme/tokens';
import {
  QuestionnaireHeading,
  questionnaireStyles,
} from './QuestionnaireHeading';

export default function GuestIntake() {
  const router = useAppRouter();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    readGuestIntake()
      .then((value) => {
        if (active) {
          setDraft(value || newGuestIntake());
          setError('');
        }
      })
      .catch(() => {
        if (active) {
          setError(
            'Nu am putut citi răspunsurile de pe acest dispozitiv. Reîncearcă sau începe din nou.'
          );
        }
      });
    return () => {
      active = false;
    };
  }, [attempt]);
  const save = async (next: Draft) => {
    if (lock.current) {
      return;
    }
    lock.current = true;
    setBusy(true);
    try {
      await writeGuestIntake(next);
      setDraft(next);
      setError('');
    } catch {
      setError(
        'Răspunsurile nu au fost salvate pe dispozitiv. Reîncearcă alegerea.'
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  const questions = QUESTIONNAIRES[0].questions;
  const q = draft && questions[draft.cursor];
  const responses = legacyResponses(draft?.responses.interests || {});
  const directions = rankDirections(responses);
  const register = () =>
    router.push({
      pathname: '/(auth)/register',
      params: { gradeLevel: draft.grade, county: 'Bihor', intakeId: draft.id },
    });
  return (
    <Screen auth>
      <BackHeader
        title={
          draft?.preview
            ? 'Primele direcții de explorat'
            : 'Descoperă ce te interesează'
        }
      />
      {!!error && (
        <Panel>
          <Copy accessibilityRole='alert'>{error}</Copy>
          {!draft && (
            <>
              <Button onPress={() => setAttempt((n) => n + 1)}>
                Reîncearcă
              </Button>
              <Button
                variant='outline'
                onPress={async () => {
                  try {
                    await clearGuestIntake();
                    setDraft(newGuestIntake());
                    setError('');
                  } catch {
                    setError('Nu am putut șterge ciorna. Reîncearcă.');
                  }
                }}
              >
                Începe din nou
              </Button>
            </>
          )}
        </Panel>
      )}
      {!draft ? (
        <Copy>Se încarcă răspunsurile locale…</Copy>
      ) : draft.preview ? (
        <>
          <Copy kind='title'>Un punct de pornire pentru tine</Copy>
          <Copy>{stageCopy(draft.grade)}</Copy>
          <Copy>
            Aceste direcții sunt orientative, pe baza răspunsurilor tale. Poți
            explora și alte opțiuni.
          </Copy>
          {directions.length ? (
            directions.map((d) => (
              <Panel key={d.id}>
                <Copy kind='heading'>{d.name}</Copy>
                {d.reasons.map((reason) => (
                  <Copy key={reason} kind='caption'>
                    {reason}
                  </Copy>
                ))}
                <Copy>{activityFor(d.id, draft.grade, responses).text}</Copy>
              </Panel>
            ))
          ) : (
            <Panel>
              <Copy>
                Este în regulă să nu știi încă. Poți începe prin a explora o
                materie care îți stârnește curiozitatea și poți completa
                chestionarele mai târziu.
              </Copy>
            </Panel>
          )}
          <Button disabled={busy} onPress={register}>
            Creează contul și păstrează răspunsurile
          </Button>
          <Button
            variant='outline'
            disabled={busy}
            onPress={() => save({ ...draft, preview: false })}
          >
            Revizuiește răspunsurile
          </Button>
          <Button
            variant='secondary'
            disabled={busy}
            onPress={async () => {
              if (lock.current) {
                return;
              }
              lock.current = true;
              setBusy(true);
              try {
                await clearGuestIntake();
                setDraft(newGuestIntake());
                setError('');
              } catch {
                setError('Ciorna nu a fost ștearsă. Reîncearcă.');
              } finally {
                lock.current = false;
                setBusy(false);
              }
            }}
          >
            Șterge ciorna de pe dispozitiv
          </Button>
          <Copy kind='caption'>
            Până la crearea contului, răspunsurile rămân pe acest dispozitiv.
            Catalogul instituțiilor acoperă Bihor.
          </Copy>
        </>
      ) : (
        <>
          {draft.cursor === 0 && (
            <>
              <Copy>
                Începem cu câteva preferințe, înainte de e-mail. Le poți
                modifica oricând.
              </Copy>
              <GradeSelect
                value={draft.grade}
                onChange={(grade) => save({ ...draft, grade })}
              />
            </>
          )}
          <QuestionnaireHeading
            position={draft.cursor + 1}
            total={questions.length}
            title={q.title}
            limit={q.limit}
          />
          <View style={{ gap: spacing.sm }}>
            {[...q.options, ['unknown', 'Nu știu încă'] as const].map(
              ([id, label]) => {
                const selected = draft.responses.interests?.[q.id] || [];
                return (
                  <Choice
                    layout='row'
                    key={id}
                    selected={selected.includes(id)}
                    disabled={
                      busy ||
                      (!selected.includes(id) &&
                        id !== 'unknown' &&
                        selected.length >= q.limit &&
                        !selected.includes('unknown'))
                    }
                    onPress={() =>
                      save({
                        ...draft,
                        responses: {
                          ...draft.responses,
                          interests: {
                            ...draft.responses.interests,
                            [q.id]: toggleAnswer(selected, id, q.limit),
                          },
                        },
                      })
                    }
                  >
                    {label}
                  </Choice>
                );
              }
            )}
          </View>
          <Button
            loading={busy}
            onPress={() =>
              save({
                ...draft,
                cursor: Math.min(2, draft.cursor + 1),
                preview: draft.cursor === 2,
              })
            }
          >
            {draft.cursor === 2 ? 'Vezi primele direcții' : 'Continuă'}
          </Button>
          {!!draft.cursor && (
            <Button
              variant='outline'
              disabled={busy}
              onPress={() => save({ ...draft, cursor: draft.cursor - 1 })}
            >
              Întrebarea anterioară
            </Button>
          )}
          <Button
            variant='secondary'
            disabled={busy}
            onPress={() => save({ ...draft, preview: true })}
            style={questionnaireStyles.quietButton}
          >
            Continuă fără alte răspunsuri
          </Button>
        </>
      )}
    </Screen>
  );
}
