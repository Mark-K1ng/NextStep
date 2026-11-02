import { useRef, useState } from 'react';
import { useSession } from '@/providers/auth';
import { useEducationRoute, useRefreshEducation } from '@/hooks/use-education';
import { useAppRouter } from '@/hooks/use-app-router';
import { Copy, Panel, Row, GroupedList, Section } from '@/components/design';
import { Button } from '@/components';
import { DataState } from '@/components/data-state';
import { Compass, Check, BookOpen } from 'lucide-react-native';
import {
  saveExplorationActivity,
  type ExplorationActivity,
} from '@/services/education';
import { decideRecommendation } from '@/services/personalized-path';
import { openOption } from '@/lib/option-navigation';
import type { Recommendation } from '@/engine/personalizedPath';

const tables = {
  school: 'schools',
  university: 'universities',
  program: 'programs',
  career: 'careers',
  course: 'courses',
  skill: 'skills',
};
const labels = {
  school: 'Liceu',
  university: 'Universitate',
  program: 'Program de studiu',
  career: 'Carieră de explorat',
  course: 'Curs',
  skill: 'Abilitate',
};
export function EducationalRoute() {
  const route = useEducationRoute();
  const { session } = useSession();
  const refresh = useRefreshEducation();
  const router = useAppRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [feedbackFor, setFeedbackFor] = useState<string | null>(null);
  const lock = useRef(false);
  const run = async (action: () => Promise<unknown>) => {
    if (lock.current) {
      return;
    }
    lock.current = true;
    setBusy(true);
    setError('');
    try {
      await action();
      await refresh();
    } catch {
      setError(
        'Modificarea nu a fost confirmată. Reîncarcă traseul, apoi reîncearcă.'
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  const save = (
    proposal: ExplorationActivity['proposal'],
    status: ExplorationActivity['status'],
    reflection: ExplorationActivity['reflection'] = null,
    existing?: ExplorationActivity
  ) =>
    run(() =>
      saveExplorationActivity(
        session!.user.id,
        proposal,
        status,
        reflection,
        existing?.revision ?? -1
      )
    );
  const acceptOption = (option: Recommendation) =>
    run(() =>
      decideRecommendation(session!.user.id, option.type, option.id, 'accepted')
    );
  const data = route.data;
  if (route.isPending || route.isError || !data) {
    return (
      <DataState
        loadingLayout='path'
        loading={!route.isError}
        error={route.isError}
        retry={() => route.refetch()}
      />
    );
  }
  const active = data.activities.filter((a) => a.status !== 'dismissed');
  return (
    <>
      <Copy>{data.context}</Copy>
      <Button variant='outline' onPress={() => router.push('/personalize')}>
        Preferințe și chestionare
      </Button>
      {!!error && (
        <Panel>
          <Copy accessibilityRole='alert'>{error}</Copy>
          <Button disabled={busy} onPress={() => route.refetch()}>
            Reîncarcă traseul
          </Button>
        </Panel>
      )}
      {!!active.length && (
        <>
          <Section title='Experiențele alese de tine' />
          {active.map((activity) => (
            <Panel key={activity.activity_id}>
              <Row
                icon={activity.status === 'completed' ? Check : BookOpen}
                title={activity.proposal.title}
                subtitle={
                  activity.status === 'completed'
                    ? 'Finalizat · experiență declarată de tine'
                    : `Acceptat · aproximativ ${activity.proposal.minutes} min`
                }
              />
              <Copy>{activity.proposal.text}</Copy>
              {activity.reflection && (
                <Copy kind='caption'>
                  Reflecția ta:{' '}
                  {
                    {
                      enjoyed: 'Mi-a plăcut',
                      more: 'Vreau să continui',
                      unsure: 'Nu sunt sigur încă',
                      not_for_me: 'Nu mi s-a potrivit',
                    }[activity.reflection]
                  }
                </Copy>
              )}
              {activity.status !== 'completed' ||
              !activity.reflection ||
              feedbackFor === activity.activity_id ? (
                <>
                  <Copy kind='label'>După ce ai încercat: cum a fost?</Copy>
                  {(
                    [
                      ['enjoyed', 'Mi-a plăcut'],
                      ['more', 'Vreau să continui'],
                      ['unsure', 'Nu sunt sigur încă'],
                      ['not_for_me', 'Nu mi s-a potrivit'],
                    ] as const
                  ).map(([value, label]) => (
                    <Button
                      key={value}
                      variant='outline'
                      disabled={busy}
                      onPress={() =>
                        save(activity.proposal, 'completed', value, activity)
                      }
                    >
                      {label}
                    </Button>
                  ))}
                </>
              ) : (
                <Button
                  variant='outline'
                  disabled={busy}
                  onPress={() => setFeedbackFor(activity.activity_id)}
                >
                  Revizuiește reflecția
                </Button>
              )}
              <Button
                variant='secondary'
                disabled={busy}
                onPress={() =>
                  save(activity.proposal, 'dismissed', null, activity)
                }
              >
                Retrage această activitate
              </Button>
            </Panel>
          ))}
        </>
      )}
      <Section title='Direcții de explorat' />
      <Copy kind='caption'>
        Răspunsurile actualizează sugestiile. Tu alegi ce intră în traseu;
        experiențele și pașii acceptați rămân până îi retragi.
      </Copy>
      {!data.directions.length && (
        <Panel>
          <Copy>
            Nu avem încă suficiente preferințe pentru direcții explicate. Începe
            cu Interese și curiozități sau explorează liber catalogul.
          </Copy>
          <Button
            onPress={() =>
              router.push({
                pathname: '/questionnaire',
                params: { id: 'interests' },
              })
            }
          >
            Descoperă-ți interesele
          </Button>
        </Panel>
      )}
      {data.directions.map((direction, index) => {
        const existing = data.activities.find(
          (a) => a.activity_id === direction.activity.id
        );
        const visible = expanded === direction.id || (!expanded && index === 0);
        return (
          <Panel key={direction.id}>
            <Row
              icon={Compass}
              title={direction.name}
              subtitle={direction.reasons.join(' ')}
              onPress={() => setExpanded(visible ? 'none' : direction.id)}
            />
            {visible && (
              <>
                <Copy kind='label'>
                  {index === 0
                    ? 'Un pas posibil acum'
                    : 'O experiență de încercat'}
                </Copy>
                <Copy>{direction.activity.text}</Copy>
                <Copy kind='caption'>
                  Aproximativ {direction.activity.minutes} min · exercițiu de
                  explorare, fără evaluarea aptitudinilor
                </Copy>
                {!existing || existing.status === 'dismissed' ? (
                  <Button
                    disabled={busy}
                    onPress={() =>
                      save(direction.activity, 'accepted', null, existing)
                    }
                  >
                    Adaugă experiența în traseu
                  </Button>
                ) : (
                  <Copy kind='caption'>
                    Această experiență este deja în traseul tău.
                  </Copy>
                )}
                {direction.options.length ? (
                  <GroupedList>
                    {direction.options.map((option) => (
                      <Row
                        key={option.key}
                        title={option.name}
                        subtitle={`${labels[option.type]} · ${option.reasons.join(' ')}`}
                        onPress={() =>
                          openOption(router, {
                            type: tables[option.type],
                            id: option.id,
                          })
                        }
                      />
                    ))}
                  </GroupedList>
                ) : (
                  <Copy kind='caption'>
                    Nu avem încă opțiuni cu legături suficiente în catalog
                    pentru această direcție și etapă. Activitatea de explorare
                    rămâne disponibilă.
                  </Copy>
                )}
                {direction.options
                  .filter((option) => option.type !== 'career')
                  .map((option) => (
                    <Button
                      key={option.key}
                      variant='outline'
                      disabled={busy}
                      onPress={() => acceptOption(option)}
                    >
                      {`Adaugă în traseu: ${option.name}`}
                    </Button>
                  ))}
              </>
            )}
          </Panel>
        );
      })}
      {data.notices.map((notice) => (
        <Copy key={notice} kind='caption'>
          {notice}
        </Copy>
      ))}
    </>
  );
}
