import { useEffect, useRef, useState } from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import { Check } from 'lucide-react-native';
import { useQueryClient } from '@tanstack/react-query';
import { Screen, Copy, Panel, BackHeader } from '@/components/design';
import { Button } from '@/components';
import { MotionPressable, AnimatedProgress } from '@/components/motion';
import { DataState } from '@/components/data-state';
import {
  usePersonalization,
  persistPersonalization,
  personalizationKey,
  type Personalization,
} from '@/hooks/use-personalization';
import {
  QUESTIONS,
  toggleAnswer,
  type Answers,
} from '@/constants/questionnaire';
import { useAppRouter } from '@/hooks/use-app-router';
import { useTheme } from '@/hooks/use-theme';
import { spacing, radius } from '@/theme/tokens';

export default function Questionnaire() {
  const query = usePersonalization();
  const client = useQueryClient();
  const router = useAppRouter();
  const theme = useTheme();
  const [answers, setAnswers] = useState<Answers>({});
  const [document, setDocument] = useState<Personalization | null>(null);
  const [cursor, setCursor] = useState(0);
  const [busy, setBusy] = useState(false);
  const [exitRequested, setExitRequested] = useState(false);
  const lock = useRef(false);
  const initialized = useRef<string | undefined>(undefined);
  const [error, setError] = useState('');
  useEffect(() => {
    if (
      query.data &&
      !query.isFetching &&
      initialized.current !== query.data.user_id
    ) {
      initialized.current = query.data.user_id;
      setAnswers(query.data.answers);
      setCursor(query.data.cursor);
      setDocument(query.data);
    }
  }, [query.data, query.isFetching]);
  useEffect(() => {
    // Run after the navigator has committed the updated onboarding guard.
    if (exitRequested && query.data && !query.data.onboarding_required) {
      router.replace('/_tabs/path');
    }
  }, [exitRequested, query.data, router]);
  const persist = async (
    next: Answers,
    index: number,
    status: 'draft' | 'completed' | 'skipped' = 'draft'
  ) => {
    if (!document || lock.current) {
      return;
    }
    lock.current = true;
    setBusy(true);
    setError('');
    try {
      const result = await persistPersonalization(
        document,
        next,
        status,
        index
      );
      client.setQueryData(personalizationKey(result.user_id), result);
      setDocument(result);
      setAnswers(next);
      setCursor(index);
      await client.invalidateQueries({
        queryKey: ['personalized-path', result.user_id],
      });
      if (status !== 'draft') {
        setExitRequested(true);
      }
    } catch {
      setError(
        'Răspunsurile nu au fost salvate. Verifică conexiunea. Dacă ai editat pe alt dispozitiv, reîncarcă înainte să continui.'
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  const question = QUESTIONS[cursor];
  const selected = answers[question.id] || [];
  return (
    <Screen
      key={cursor}
      nativeTitle='Preferințele tale'
      bottomSafeArea='content'
    >
      {Platform.OS !== 'ios' && <BackHeader title='Preferințele tale' />}
      {query.isPending ||
      query.isError ||
      !document ||
      document.user_id !== query.data?.user_id ? (
        <DataState
          loadingLayout='form'
          loading={
            query.isPending ||
            !document ||
            document.user_id !== query.data?.user_id
          }
          error={query.isError}
          retry={() => query.refetch()}
        />
      ) : (
        <>
          <Copy kind='caption'>
            Chestionar de interese · {cursor + 1} din {QUESTIONS.length}
          </Copy>
          <AnimatedProgress
            value={cursor + 1}
            total={QUESTIONS.length}
            label={`Întrebarea ${cursor + 1} din ${QUESTIONS.length}`}
          />
          <Copy kind='title'>{question.title}</Copy>
          {cursor === 0 && (
            <Copy kind='caption'>
              Chestionar opțional de preferințe, fără evaluare psihologică. Îl
              poți opri, relua sau șterge din Profil.
            </Copy>
          )}
          <Copy>
            Alege{' '}
            {question.limit === 1
              ? 'o variantă'
              : `cel mult ${question.limit} variante`}
            . Poți reveni oricând.
          </Copy>
          <Copy kind='caption' accessibilityLiveRegion='polite'>
            {selected.includes('unknown')
              ? 'Nu știu încă'
              : `${selected.length} din ${question.limit} variante alese`}
          </Copy>
          <View style={styles.options}>
            {[...question.options, ['unknown', 'Nu știu încă'] as const].map(
              ([id, label]) => {
                const active = selected.includes(id);
                const atLimit =
                  !active &&
                  id !== 'unknown' &&
                  question.limit > 1 &&
                  selected.length >= question.limit &&
                  !selected.includes('unknown');
                return (
                  <MotionPressable
                    key={id}
                    accessibilityRole={
                      question.limit === 1 ? 'radio' : 'checkbox'
                    }
                    accessibilityState={{
                      checked: active,
                      disabled: busy || atLimit,
                    }}
                    disabled={busy || atLimit}
                    onPress={() =>
                      persist(
                        {
                          ...answers,
                          [question.id]: toggleAnswer(
                            selected,
                            id,
                            question.limit
                          ),
                        },
                        cursor
                      )
                    }
                    style={[
                      styles.option,
                      {
                        borderColor: active ? theme.accentText : theme.border,
                        backgroundColor: active
                          ? theme.surfaceElevated
                          : theme.surface,
                      },
                    ]}
                  >
                    <Copy style={styles.label}>{label}</Copy>
                    {active && <Check size={22} color={theme.accentText} />}
                  </MotionPressable>
                );
              }
            )}
          </View>
          {!!error && (
            <Panel>
              <Copy accessibilityRole='alert'>{error}</Copy>
              <Button
                variant='outline'
                onPress={async () => {
                  initialized.current = undefined;
                  await query.refetch();
                  setError('');
                }}
              >
                Reîncarcă răspunsurile
              </Button>
            </Panel>
          )}
          <Button
            loading={busy}
            onPress={() =>
              persist(
                answers,
                Math.min(cursor + 1, QUESTIONS.length - 1),
                cursor === QUESTIONS.length - 1 ? 'completed' : 'draft'
              )
            }
          >
            {cursor === QUESTIONS.length - 1
              ? 'Vezi recomandările'
              : 'Continuă'}
          </Button>
          {cursor > 0 && (
            <Button
              variant='outline'
              disabled={busy}
              onPress={() => persist(answers, cursor - 1)}
            >
              Întrebarea anterioară
            </Button>
          )}
          <Button
            variant='secondary'
            disabled={busy}
            onPress={() => persist(answers, cursor, 'skipped')}
          >
            Mai târziu
          </Button>
          <Copy kind='caption' style={{ color: theme.textSecondary }}>
            Răspunsurile se salvează în cont. Acesta este un chestionar de
            preferințe, nu un test psihologic. Recomandările sunt orientative.
          </Copy>
          <Button
            variant='outline'
            disabled={busy}
            onPress={() => persist({}, 0, 'skipped')}
          >
            Șterge răspunsurile și continuă fără ele
          </Button>
        </>
      )}
    </Screen>
  );
}
const styles = StyleSheet.create({
  options: { gap: spacing.sm },
  option: {
    minHeight: 52,
    padding: spacing.lg,
    borderWidth: 1,
    borderRadius: radius.md,
    borderCurve: 'continuous',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  label: { flex: 1 },
});
