import { useState } from 'react';
import { View, StyleSheet, useWindowDimensions, Platform } from 'react-native';
import { useAppRouter as useRouter } from '@/hooks/use-app-router';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { loadComparisonOptions } from '@/services/comparison';
import {
  BackHeader,
  Copy,
  GroupedList,
  Panel,
  Row,
  Screen,
  Section,
} from '@/components/design';
import { Button, Input } from '@/components';
import { MotionContent } from '@/components/motion';
import { DataState } from '@/components/data-state';
import { CatalogueResult } from '@/features/explore/CatalogueResult';
import { useJourney } from '@/providers/journey';
import { useSession } from '@/providers/auth';
import { useProfileQuery } from '@/hooks/use-profile';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { searchCatalogue } from '@/services/catalogue';
import { institutionVisible } from '@/lib/institution-scope';
import { useTheme } from '@/hooks/use-theme';
import { normalizeCounty } from '@/constants/profile-options';
import { openOption } from '@/lib/option-navigation';
import { ro } from '@/i18n/ro';
import { spacing as s } from '@/theme/tokens';
import { useAccountMode } from '@/providers/account-mode';

export default function Compare() {
  const { comparison, selectComparison, resetSecond } = useJourney();
  const [selectedFirst, selectedSecond] = comparison;
  const [expandedDescription, setExpandedDescription] = useState<string | null>(
    null
  );
  const comparisonId = `${selectedFirst?.id || ''}:${selectedSecond?.id || ''}`;
  const descriptionExpanded = expandedDescription === comparisonId;
  const router = useRouter();
  const theme = useTheme();
  const { fontScale, width } = useWindowDimensions();
  const stacked = fontScale > 1.3 || width < 360;
  const { session } = useSession();
  const profile = useProfileQuery();
  const { isPreview, previewCounty } = useAccountMode();
  const county = normalizeCounty(
    isPreview ? previewCounty : profile.data?.county
  );
  const selectedFirstVisible =
    selectedFirst &&
    institutionVisible(
      selectedFirst.type,
      selectedFirst.type === 'programs'
        ? { universities: { county: selectedFirst.county } }
        : selectedFirst.type === 'school_profiles'
          ? { schools: { county: selectedFirst.county } }
          : selectedFirst,
      county
    );
  const details = useQuery({
    queryKey: [
      'comparison-details',
      session?.user.id,
      isPreview ? 'preview' : 'student',
      county,
      selectedFirst?.type,
      selectedFirst?.id,
      selectedSecond?.id,
    ],
    enabled:
      !!session &&
      (isPreview || profile.isSuccess) &&
      !!selectedFirstVisible &&
      !!selectedSecond,
    queryFn: ({ signal }) => loadComparisonOptions(comparison, county, signal),
  });
  const resolvedComparison = details.data || comparison;
  const [first, second] = resolvedComparison;
  const [search, setSearch] = useState('');
  const settledSearch = useDebouncedValue(search);
  const query = useInfiniteQuery({
    queryKey: [
      'compare-options',
      session?.user.id,
      first?.type,
      county,
      settledSearch,
    ],
    enabled:
      !!session && profile.isSuccess && !!selectedFirstVisible && !second,
    initialPageParam: 0,
    queryFn: ({ pageParam, signal }) =>
      searchCatalogue({
        section: first!.type,
        search: settledSearch,
        filter: '',
        county,
        page: pageParam,
        signal,
      }),
    getNextPageParam: (last) => (last.more ? last.page + 1 : undefined),
  });
  const alternatives =
    query.data?.pages
      .flatMap((page) => page.items)
      .filter((item) => item.id !== first?.id) || [];
  const rows =
    first && second
      ? [
          { label: ro.profile.county, values: [first.county, second.county] },
          {
            label:
              first.type === 'schools'
                ? ro.visual.specializations
                : first.type === 'school_profiles'
                  ? ro.school.specialization
                  : first.type === 'programs'
                    ? ro.university.degreeLevel
                    : first.type === 'skills'
                      ? ro.visual.categories
                      : ro.career.domain,
            values: [
              first.type === 'programs'
                ? first.degreeLevel || first.domain
                : first.specialization || first.domain,
              second.type === 'programs'
                ? second.degreeLevel || second.domain
                : second.specialization || second.domain,
            ],
          },
          {
            label:
              first.type === 'programs'
                ? ro.university.name
                : ro.course.provider,
            values: [first.provider, second.provider],
          },
          {
            label: ro.university.degreeLevel,
            values:
              first.type === 'programs'
                ? []
                : [first.degreeLevel, second.degreeLevel],
          },
          {
            label: ro.university.duration,
            values: [first.duration, second.duration],
          },
          {
            label: ro.course.level,
            values: [first.level, second.level],
          },
          {
            label: ro.course.language,
            values: [first.language, second.language],
          },
          {
            label: ro.course.isFree,
            values: [first.isFree, second.isFree].map((value) =>
              typeof value !== 'boolean'
                ? undefined
                : value
                  ? ro.common.isFree
                  : ro.common.paid
            ),
          },
          {
            label: ro.detail.description,
            values: [first.description, second.description],
          },
        ].filter((row) => row.values.some(Boolean))
      : [];
  return (
    <Screen tab='explore' nativeTitle={ro.refinement.compareTitle}>
      {Platform.OS !== 'ios' && (
        <BackHeader title={ro.refinement.compareTitle} />
      )}
      {profile.isPending || profile.isError ? (
        <DataState
          loadingLayout='comparison'
          loading={profile.isPending}
          error={profile.isError}
          retry={() => {
            profile.refetch();
          }}
        />
      ) : !selectedFirstVisible ? (
        <Panel>
          <Copy>{ro.refinement.compareEmpty}</Copy>
          <Button onPress={() => router.navigate('/_tabs/explore')}>
            {ro.explore.title}
          </Button>
        </Panel>
      ) : (
        <>
          {!second && (
            <Panel>
              <Copy kind='heading'>{first.name || first.title}</Copy>
              <Copy kind='caption' style={{ color: theme.textSecondary }}>
                {ro.refinement.compareSelected}
              </Copy>
            </Panel>
          )}
          <MotionContent
            key={second ? 'comparison' : 'picker'}
            animateExit={false}
            style={styles.content}
          >
            {second && (details.isPending || details.isError) ? (
              <DataState
                loadingLayout='comparison'
                loading={details.isPending && !details.isError}
                error={details.isError}
                retry={() => {
                  details.refetch();
                }}
              />
            ) : second ? (
              <>
                <Section title={ro.comparison.options} />
                <GroupedList>
                  {resolvedComparison.map((item, index) => (
                    <Row
                      key={item.id}
                      title={item.name || item.title || ro.common.notAvailable}
                      subtitle={[
                        `${ro.comparison.option} ${index + 1}`,
                        item.county,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                      accessibilityLabel={`${ro.common.open}: ${item.name || item.title}`}
                      onPress={() => openOption(router, item)}
                    />
                  ))}
                </GroupedList>
                {!!rows.length && <Section title={ro.comparison.facts} />}
                {rows.map((row) => {
                  const isDescription = row.label === ro.detail.description;
                  const fullWidth =
                    stacked ||
                    isDescription ||
                    row.values.some(
                      (value) => String(value || '').length > 160
                    );
                  return (
                    <Panel key={row.label}>
                      <Copy
                        kind='caption'
                        style={[
                          styles.factLabel,
                          { color: theme.textSecondary },
                        ]}
                      >
                        {row.label}
                      </Copy>
                      <View style={[styles.pair, fullWidth && styles.stacked]}>
                        {row.values.map((value, index) => (
                          <View
                            key={resolvedComparison[index].id}
                            style={[
                              styles.column,
                              index > 0 &&
                                (fullWidth
                                  ? styles.separatedStack
                                  : styles.separatedColumn),
                              { borderColor: theme.border },
                            ]}
                          >
                            <Copy
                              kind={fullWidth ? 'caption' : 'label'}
                              style={{ color: theme.accentText }}
                            >
                              {fullWidth
                                ? `${ro.comparison.option} ${index + 1} · ${resolvedComparison[index].name || resolvedComparison[index].title}`
                                : `${ro.comparison.option} ${index + 1}`}
                            </Copy>
                            <Copy
                              selectable
                              numberOfLines={
                                isDescription && !descriptionExpanded
                                  ? 3
                                  : undefined
                              }
                              accessibilityLabel={`${resolvedComparison[index].name || resolvedComparison[index].title}, ${row.label}: ${value || ro.common.notAvailable}`}
                              style={{
                                color: value
                                  ? theme.textPrimary
                                  : theme.textSecondary,
                              }}
                            >
                              {value || ro.common.notAvailable}
                            </Copy>
                          </View>
                        ))}
                      </View>
                      {isDescription && (
                        <Button
                          variant='outline'
                          accessibilityState={{
                            expanded: descriptionExpanded,
                          }}
                          accessibilityLabel={`${ro.detail.description}: ${descriptionExpanded ? ro.common.showLess : ro.common.showMore}`}
                          onPress={() =>
                            setExpandedDescription(
                              descriptionExpanded ? null : comparisonId
                            )
                          }
                        >
                          {descriptionExpanded
                            ? ro.common.showLess
                            : ro.common.showMore}
                        </Button>
                      )}
                    </Panel>
                  );
                })}
                <Copy kind='caption' style={{ color: theme.textSecondary }}>
                  {ro.refinement.compareHint}
                </Copy>
                <Button variant='secondary' onPress={resetSecond}>
                  {ro.refinement.replace}
                </Button>
              </>
            ) : (
              <>
                <Section title={ro.refinement.comparePick} />
                <Input
                  variant='search'
                  placeholder={ro.refinement.searchScopes[first.type]}
                  value={search}
                  onChangeText={setSearch}
                />
                {(query.isLoading || query.isError) && (
                  <DataState
                    loadingLayout='catalogue'
                    loading={query.isLoading}
                    error={query.isError}
                    retry={() => {
                      query.refetch();
                    }}
                  />
                )}
                {query.isSuccess && !alternatives.length && (
                  <Panel>
                    <Copy>{ro.explore.noResults}</Copy>
                    {!!search && (
                      <Button variant='outline' onPress={() => setSearch('')}>
                        {ro.common.clear}
                      </Button>
                    )}
                  </Panel>
                )}
                {alternatives.map((item) => (
                  <CatalogueResult
                    key={item.type + item.id}
                    item={item}
                    onPress={() => selectComparison(item)}
                  />
                ))}
                {query.hasNextPage && (
                  <Button
                    variant='outline'
                    loading={query.isFetchingNextPage}
                    onPress={() => {
                      query.fetchNextPage();
                    }}
                  >
                    {ro.common.showMore}
                  </Button>
                )}
              </>
            )}
          </MotionContent>
        </>
      )}
    </Screen>
  );
}
const styles = StyleSheet.create({
  content: { gap: s.lg },
  pair: { flexDirection: 'row', gap: s.lg },
  stacked: { flexDirection: 'column' },
  column: { flex: 1, minWidth: 0, gap: s.sm },
  separatedColumn: {
    borderLeftWidth: StyleSheet.hairlineWidth,
    paddingLeft: s.lg,
  },
  separatedStack: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: s.md,
  },
  factLabel: { fontWeight: '600' },
});
