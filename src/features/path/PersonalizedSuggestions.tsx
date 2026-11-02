import { useRef, useState } from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import {
  Screen,
  Copy,
  Panel,
  BackHeader,
  Row,
  Section,
} from '@/components/design';
import { Button } from '@/components';
import { DataState } from '@/components/data-state';
import { usePersonalizedPath } from '@/hooks/use-personalized-path';
import { useAppRouter } from '@/hooks/use-app-router';
import { decideRecommendation } from '@/services/personalized-path';
import { openOption } from '@/lib/option-navigation';
import { supabase } from '@/lib/supabase';
import type { Recommendation } from '@/engine/personalizedPath';
import { useToast } from '@/providers/toast';
import { accountRequest } from '@/lib/account-request';
import { useTheme } from '@/hooks/use-theme';
import { spacing } from '@/theme/tokens';

const tables = {
  school: 'schools',
  university: 'universities',
  program: 'programs',
  career: 'careers',
  course: 'courses',
  skill: 'skills',
};
const categoryLabels = {
  school: 'Liceu',
  university: 'Universitate',
  program: 'Program de studiu',
  career: 'Obiectiv posibil',
  course: 'Curs',
  skill: 'Abilitate',
};
export function PersonalizedSuggestions() {
  const data = usePersonalizedPath();
  const client = useQueryClient();
  const router = useAppRouter();
  const toast = useToast();
  const theme = useTheme();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');
  const lock = useRef(false);
  const refresh = async () => {
    await Promise.all([
      client.invalidateQueries({
        queryKey: ['personalized-path', data.userId],
      }),
      client.invalidateQueries({ queryKey: ['student', data.userId] }),
      client.invalidateQueries({ queryKey: ['education-route', data.userId] }),
    ]);
  };
  const decide = async (
    item: Recommendation,
    decision: 'accepted' | 'dismissed'
  ) => {
    if (!data.userId || lock.current) {
      return;
    }
    lock.current = true;
    setBusy(item.key);
    setError('');
    try {
      await decideRecommendation(data.userId, item.type, item.id, decision);
      await refresh();
      toast(
        decision === 'accepted'
          ? item.type === 'career'
            ? 'Obiectiv actualizat'
            : 'Pas adăugat în Traseu'
          : 'Sugestie ascunsă'
      );
    } catch {
      setError(
        'Modificarea nu a fost salvată. Verifică conexiunea și reîncearcă.'
      );
    } finally {
      lock.current = false;
      setBusy(null);
    }
  };
  return (
    <>
      <View style={styles.introduction}>
        <Section
          title='Ce poți face în continuare'
          action='Preferințe'
          onPress={() => router.push('/personalize')}
        />
        <Copy kind='caption' style={{ color: theme.textSecondary }}>
          Salvate păstrează interesele tale. Aici alegi pașii pe care vrei să îi
          urmezi.
        </Copy>
      </View>
      {data.error ? (
        <DataState error retry={data.retry} />
      ) : data.loading ? (
        <DataState loadingLayout='recommendations' loading />
      ) : (
        <>
          {data.items.map((item, index) => (
            <Panel key={item.key} accent={index === 0}>
              <Row
                title={item.name}
                subtitle={[categoryLabels[item.type], item.county]
                  .filter(Boolean)
                  .join(' · ')}
                onPress={
                  busy === null
                    ? () =>
                        openOption(router, {
                          id: item.id,
                          type: tables[item.type],
                        })
                    : undefined
                }
              />
              <Copy kind='caption' style={{ color: theme.textSecondary }}>
                {item.reasons.join(' ')}
              </Copy>
              <Button
                variant={index === 0 ? 'primary' : 'secondary'}
                disabled={busy !== null}
                loading={busy === item.key}
                onPress={() => decide(item, 'accepted')}
              >
                {item.type === 'career'
                  ? `Alege obiectiv: ${item.name}`
                  : 'Adaugă în Traseu'}
              </Button>
              <Button
                variant='outline'
                disabled={busy !== null}
                onPress={() => decide(item, 'dismissed')}
              >
                Nu mi se potrivește
              </Button>
            </Panel>
          ))}
          {!data.items.length && (
            <Panel>
              <Copy>
                Nicio sugestie nouă pentru datele actuale. Adaugă interese,
                autoevaluează abilități sau explorează alte opțiuni. Pașii aleși
                rămân în Traseu.
              </Copy>
            </Panel>
          )}
          {data.notices.map((notice) => (
            <Copy kind='caption' key={notice}>
              {notice}
            </Copy>
          ))}
          {data.hasDismissed && (
            <Button
              variant='outline'
              disabled={busy !== null}
              onPress={async () => {
                if (lock.current) {
                  return;
                }
                lock.current = true;
                setBusy('reset');
                try {
                  const result = await accountRequest((signal) =>
                    supabase
                      .rpc('reset_dismissed_recommendations', {
                        expected_user: data.userId,
                      })
                      .abortSignal(signal)
                  );
                  if (result.error) {
                    throw result.error;
                  }
                  await refresh();
                } catch {
                  setError('Nu am putut reafișa sugestiile. Reîncearcă.');
                } finally {
                  lock.current = false;
                  setBusy(null);
                }
              }}
            >
              Reafișează sugestiile respinse
            </Button>
          )}
        </>
      )}
      {!!error && <Copy accessibilityRole='alert'>{error}</Copy>}
    </>
  );
}
const styles = StyleSheet.create({
  introduction: { gap: spacing.sm },
});
export default function Recommendations() {
  return (
    <Screen nativeTitle='Recomandări'>
      {Platform.OS !== 'ios' && <BackHeader title='Recomandări' />}
      <PersonalizedSuggestions />
    </Screen>
  );
}
