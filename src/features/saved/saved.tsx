import { View, StyleSheet, Platform } from 'react-native';
import { spacing as s } from '@/theme/tokens';
import {
  MotionPressable as Pressable,
  MotionContent,
} from '@/components/motion';
import { useState } from 'react';
import { useAppRouter as useRouter } from '@/hooks/use-app-router';
import { Columns2, Trash2 } from 'lucide-react-native';
import {
  Screen,
  Copy,
  Panel,
  GroupedList,
  Choice,
  BackHeader,
  design,
} from '@/components/design';
import { DataState } from '@/components/data-state';
import { Button } from '@/components';
import { useSaved } from '@/providers/saved';
import { useJourney } from '@/providers/journey';
import { useTheme } from '@/hooks/use-theme';
import { useProfileQuery } from '@/hooks/use-profile';
import { institutionVisible } from '@/lib/institution-scope';
import { openOption } from '@/lib/option-navigation';
import { ro } from '@/i18n/ro';

const categoryLabels: Record<string, string> = {
  schools: ro.explore.sections.schools,
  school_profiles: ro.school.specialization,
  universities: ro.explore.sections.universities,
  programs: ro.refinement.studyProgramsHeader,
  careers: ro.explore.sections.careers,
  courses: ro.explore.sections.courses,
  skills: ro.common.skills,
};

export default function Saved() {
  const router = useRouter();
  const theme = useTheme();
  const { items: saved, ready, toggle, error, retry } = useSaved();
  const { beginComparison } = useJourney();
  const profile = useProfileQuery();
  const [filter, setFilter] = useState('all');
  const items = saved.filter((item) =>
    institutionVisible(
      item.type,
      item.type === 'school_profiles'
        ? { schools: { county: item.county } }
        : item.type === 'programs'
          ? { universities: { county: item.county } }
          : item,
      profile.data?.county || ''
    )
  );
  const visible = items.filter(
    (item) =>
      filter === 'all' ||
      (filter === 'schools'
        ? ['schools', 'school_profiles'].includes(item.type)
        : filter === 'universities'
          ? ['universities', 'programs'].includes(item.type)
          : item.type === filter)
  );
  const filters = [
    { id: 'all', label: ro.visual.all, count: items.length },
    {
      id: 'schools',
      label: ro.explore.sections.schools,
      count: items.filter((item) =>
        ['schools', 'school_profiles'].includes(item.type)
      ).length,
    },
    {
      id: 'universities',
      label: ro.explore.sections.universities,
      count: items.filter((item) =>
        ['universities', 'programs'].includes(item.type)
      ).length,
    },
    ...(['careers', 'courses', 'skills'] as const).map((id) => ({
      id,
      label: categoryLabels[id],
      count: items.filter((item) => item.type === id).length,
    })),
  ].filter(
    (option) => option.id === 'all' || option.count || option.id === filter
  );
  const contentReady = ready && profile.isSuccess;
  return (
    <Screen tab='profile' nativeTitle={ro.visual.saved}>
      {Platform.OS !== 'ios' && <BackHeader title={ro.visual.saved} />}
      <Copy style={{ color: theme.textSecondary }}>
        {ro.refinement.savedIntro}
      </Copy>
      {contentReady && saved.length > items.length && (
        <Copy kind='caption' style={{ color: theme.textSecondary }}>
          {ro.refinement.scope} {profile.data?.county}
        </Copy>
      )}
      <View style={design.wrap}>
        {filters.map((option) => (
          <Choice
            key={option.id}
            exclusive
            selected={filter === option.id}
            onPress={() => setFilter(option.id)}
          >
            {contentReady ? `${option.label} · ${option.count}` : option.label}
          </Choice>
        ))}
      </View>
      <MotionContent key={filter} animateExit={false} style={{ gap: s.xl }}>
        {!ready || profile.isPending || profile.isError ? (
          <DataState
            loadingLayout='catalogue'
            loading={
              (!ready || profile.isPending) && !error && !profile.isError
            }
            error={error || profile.isError}
            retry={() => {
              retry();
              profile.refetch();
            }}
          />
        ) : (
          <>
            {error && <DataState error retry={retry} />}
            {!visible.length && !error && (
              <Panel>
                <Copy>
                  {filter === 'all' && !saved.length
                    ? ro.visual.noSaved
                    : ro.explore.noResults}
                </Copy>
                {filter !== 'all' ? (
                  <Button variant='outline' onPress={() => setFilter('all')}>
                    {ro.refinement.clearFilters}
                  </Button>
                ) : (
                  <Button onPress={() => router.navigate('/_tabs/explore')}>
                    {ro.explore.title}
                  </Button>
                )}
              </Panel>
            )}
            {!!visible.length && (
              <GroupedList>
                {visible.map((item) => (
                  <View key={item.type + item.id}>
                    <View style={styles.row}>
                      <Pressable
                        feedback='highlight'
                        accessibilityRole='button'
                        accessibilityLabel={item.name || item.title || ''}
                        onPress={() => openOption(router, item)}
                        style={styles.option}
                      >
                        <Copy style={styles.title}>
                          {item.name || item.title || ''}
                        </Copy>
                        <Copy
                          kind='caption'
                          style={{ color: theme.accentText }}
                        >
                          {categoryLabels[item.type] || ro.refinement.optionOne}
                        </Copy>
                        {!!(item.county || item.domain || item.provider) && (
                          <Copy
                            kind='caption'
                            style={{ color: theme.textSecondary }}
                          >
                            {[item.county, item.provider || item.domain]
                              .filter(Boolean)
                              .join(' · ')}
                          </Copy>
                        )}
                      </Pressable>
                      <View style={styles.actions}>
                        <Pressable
                          accessibilityRole='button'
                          accessibilityLabel={`${ro.visual.compare}: ${item.name || item.title || ''}`}
                          onPress={() => {
                            beginComparison(item);
                            router.push('/compare');
                          }}
                          style={styles.iconAction}
                        >
                          <Columns2 size={22} color={theme.textSecondary} />
                        </Pressable>
                        <Pressable
                          accessibilityRole='button'
                          accessibilityLabel={`${ro.visual.unsaveOption}: ${item.name || item.title}`}
                          onPress={() => {
                            toggle(item);
                          }}
                          style={styles.iconAction}
                        >
                          <Trash2 size={20} color={theme.dangerText} />
                        </Pressable>
                      </View>
                    </View>
                  </View>
                ))}
              </GroupedList>
            )}
          </>
        )}
      </MotionContent>
      <Copy kind='caption' style={{ color: theme.textSecondary }}>
        {ro.visual.savedDevice}
      </Copy>
    </Screen>
  );
}
const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: s.sm },
  option: {
    flex: 1,
    minWidth: 0,
    minHeight: 48,
    justifyContent: 'center',
    gap: s.xs,
  },
  title: { fontWeight: '600' },
  actions: { flexDirection: 'row', flexShrink: 0, alignItems: 'center' },
  iconAction: {
    minWidth: 48,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
