import { useBottomSafeArea } from '@/hooks/use-bottom-safe-area';
import { Platform, StyleSheet, useWindowDimensions } from 'react-native';
import { useCallback, useEffect, useState } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useSession } from '@/providers/auth';
import {
  View,
  FlatList,
  BackHandler,
  Keyboard,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from '@/components/safe-area';
import { SafeAreaView as NavigationSafeAreaView } from 'react-native-screens/experimental';
import { useLocalSearchParams, useFocusEffect, usePathname } from 'expo-router';
import { useAppRouter as useRouter } from '@/hooks/use-app-router';
import { MotionLayout, MotionPressable } from '@/components/motion';
import { BottomNavigation } from '@/components/bottom-navigation';
import { useJourney } from '@/providers/journey';
import {
  School,
  GraduationCap,
  Briefcase,
  BookOpen,
  Layers,
  Search,
  SlidersHorizontal,
  BrainCircuit,
} from 'lucide-react-native';
import { Copy, Panel, Row, design } from '@/components/design';
import { BackButton } from '@/components/back-button';
import { NavigationSurface } from '@/components/navigation-surface';
import { Input, Button } from '@/components';
import { DataState } from '@/components/data-state';
import { CatalogueResult } from './CatalogueResult';
import { useTheme } from '@/hooks/use-theme';
import { ro } from '@/i18n/ro';
import { spacing as s, radius } from '@/theme/tokens';

import { openOption } from '@/lib/option-navigation';
import { searchCatalogue } from '@/services/catalogue';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useProfileQuery } from '@/hooks/use-profile';
import { normalizeCounty, COUNTIES } from '@/constants/profile-options';
import { useAccountMode } from '@/providers/account-mode';
import { StudentPreviewBanner } from '@/components/student-preview-banner';
import { institutionTables } from '@/lib/institution-scope';
import { SelectField } from '@/components/SelectField';
import { loadCatalogueKeywords } from '@/services/catalogue-filters';
const categories = [
  {
    id: 'skills',
    icon: BrainCircuit,
    label: ro.common.skills,
    hint: ro.visual.skillsHint,
  },
  {
    id: 'schools',
    icon: School,
    label: ro.explore.sections.schools,
    hint: ro.visual.categoryHints[0],
  },
  {
    id: 'school_profiles',
    icon: BookOpen,
    label: ro.visual.specializations,
    hint: ro.visual.specializationsHint,
  },
  {
    id: 'universities',
    icon: GraduationCap,
    label: ro.explore.sections.universities,
    hint: ro.visual.categoryHints[1],
  },
  {
    id: 'programs',
    icon: Layers,
    label: ro.visual.studyPrograms,
    hint: ro.visual.programsHint,
  },
  {
    id: 'careers',
    icon: Briefcase,
    label: ro.explore.sections.careers,
    hint: ro.visual.categoryHints[2],
  },
  {
    id: 'courses',
    icon: BookOpen,
    label: ro.explore.sections.courses,
    hint: ro.visual.categoryHints[3],
  },
];
export default function Explore() {
  const router = useRouter();
  const pathname = usePathname();
  const standalone =
    pathname === '/explore' ||
    (Platform.OS === 'ios' && pathname === '/_tabs/explore');
  const journey = useJourney();
  const theme = useTheme();
  const bottom = useBottomSafeArea();
  const { isPreview, previewCounty, setPreviewCounty } = useAccountMode();
  const { height, fontScale } = useWindowDimensions();
  const compactMenu = height < 760 || fontScale > 1.1;
  // Keep enlarged text and very short windows reachable without shrinking targets.
  const needsOverflow = fontScale > 1.3 || height < 640 || isPreview;
  const { section: initialSection, intent } = useLocalSearchParams<{
    section?: string;
    intent?: string;
  }>();
  const [section, setSection] = useState(
    initialSection &&
      categories.some((category) => category.id === initialSection)
      ? initialSection
      : ''
  );
  useEffect(() => {
    if (
      initialSection &&
      categories.some((category) => category.id === initialSection)
    ) {
      setSection(initialSection);
    }
  }, [initialSection]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const { session } = useSession();
  const profileQuery = useProfileQuery();
  const county = normalizeCounty(
    isPreview ? previewCounty : profileQuery.data?.county
  );
  const catalogueReady = isPreview || profileQuery.isSuccess;
  const settledSearch = useDebouncedValue(search.trim().slice(0, 200));
  const settledFilter = filter.trim().slice(0, 200);
  const keywords = useQuery({
    queryKey: [
      'catalogue-keywords',
      session?.user.id,
      section,
      county,
      isPreview ? 'preview' : 'student',
    ],
    enabled: !!session && catalogueReady && showFilters && !!section,
    queryFn: ({ signal }) => loadCatalogueKeywords(section, county, signal),
    staleTime: 300_000,
  });
  const hasSearch = !!settledSearch;
  const query = useInfiniteQuery({
    queryKey: [
      'explore',
      session?.user.id,
      section,
      county,
      settledSearch,
      settledFilter,
      isPreview ? 'preview' : 'student',
    ],
    enabled: !!session && catalogueReady && (!!section || hasSearch),
    initialPageParam: 0,
    queryFn: ({ pageParam, signal }) =>
      searchCatalogue({
        section,
        search: settledSearch,
        filter: settledFilter,
        county,
        page: pageParam,
        signal,
      }),
    getNextPageParam: (last) => (last.more ? last.page + 1 : undefined),
  });
  const items = query.data?.pages.flatMap((page) => page.items) || [];
  const settling =
    settledSearch !== search.trim().slice(0, 200) ||
    settledFilter !== filter.trim().slice(0, 200);
  const loading = query.isLoading || (!isPreview && profileQuery.isPending);
  const error = query.isError || (!isPreview && profileQuery.isError);
  const filtered = items;
  const browsing = !!section || !!search.trim();
  const fixedMenu = !browsing && !needsOverflow;
  const returnToCategories = useCallback(() => {
    if (standalone) {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/_tabs/explore');
      }
      return;
    }
    setSection('');
    setSearch('');
    setFilter('');
    setShowFilters(false);
  }, [standalone, router]);
  useFocusEffect(
    useCallback(() => {
      if (!browsing) {
        return;
      }
      // Categories are local state, so consume Back before the tab navigator.
      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        () => {
          returnToCategories();
          return true;
        }
      );
      return () => subscription.remove();
    }, [browsing, returnToCategories])
  );
  const refreshCatalogue = () => {
    if (!browsing) {
      return;
    }
    profileQuery.refetch();
    query.refetch();
  };
  const header = (
    <MotionLayout
      style={[fixedMenu && uiStyles.fill, { gap: browsing ? s.xl : s.lg }]}
    >
      {isPreview && (
        <View style={{ gap: s.sm }}>
          <SelectField
            label='Județ pentru previzualizare'
            value={county}
            options={COUNTIES.map((value) => ({ value, label: value }))}
            onChange={setPreviewCounty}
          />
          <Copy kind='caption' style={{ color: theme.textSecondary }}>
            Alegerea filtrează catalogul public și nu modifică profilul
            contului.
          </Copy>
        </View>
      )}
      {!browsing && (
        <View style={{ gap: s.sm }}>
          <Copy kind='title'>{ro.explore.title}</Copy>
          <Copy kind='caption' style={{ color: theme.textSecondary }}>
            Catalog local pilot: Bihor. Acoperirea altor județe este limitată.
          </Copy>
          {!compactMenu && (
            <Copy kind='caption' style={{ color: theme.textSecondary }}>
              {ro.visual.exploreHint}
            </Copy>
          )}
        </View>
      )}
      {intent === 'goal' && (
        <Panel accent>
          <Copy kind='heading'>{ro.refinement.findCareer}</Copy>
          <Copy>{ro.refinement.goalPicking}</Copy>
        </Panel>
      )}
      <View style={[uiStyles.s1, { gap: s.sm }]}>
        {browsing && <BackButton onPress={returnToCategories} />}
        <View style={uiStyles.s3}>
          <Input
            variant='search'
            material='navigation'
            placeholder={
              ro.refinement.searchScopes[section] || ro.visual.searchHint
            }
            value={search}
            onChangeText={setSearch}
          />
        </View>
        {browsing && (
          <MotionPressable
            accessibilityRole='button'
            accessibilityLabel={ro.common.filter}
            accessibilityState={{ expanded: showFilters, selected: !!filter }}
            onPress={() => {
              Keyboard.dismiss();
              setShowFilters(true);
            }}
            style={({ pressed }) => [
              uiStyles.filterButton,
              {
                borderColor:
                  filter || showFilters ? theme.accent : theme.border,
                backgroundColor:
                  Platform.OS === 'ios'
                    ? 'transparent'
                    : filter || showFilters
                      ? theme.accent + '26'
                      : theme.surface,
                opacity: pressed && Platform.OS !== 'ios' ? 0.7 : 1,
              },
            ]}
          >
            {Platform.OS === 'ios' && (
              <NavigationSurface
                pointerEvents='none'
                accessible={false}
                style={[
                  StyleSheet.absoluteFill,
                  uiStyles.filterMaterial,
                  { backgroundColor: theme.surface },
                ]}
              />
            )}
            <SlidersHorizontal size={22} color={theme.accentText} />
            {!!filter && (
              <View
                style={[
                  uiStyles.filterDot,
                  { backgroundColor: theme.accentText },
                ]}
              />
            )}
          </MotionPressable>
        )}
      </View>
      {browsing && (
        <>
          <Copy
            accessibilityLiveRegion='polite'
            kind='caption'
            style={{ color: theme.textSecondary }}
          >
            {settling
              ? ro.common.loading
              : filtered.length === 1 && !query.hasNextPage
                ? ro.refinement.oneResult
                : `${filtered.length}${query.hasNextPage ? '+' : ''} ${query.hasNextPage ? ro.refinement.allResults : ro.visual.results}`}
          </Copy>
        </>
      )}
      {!browsing && (
        <View style={[fixedMenu && uiStyles.fill, { gap: s.sm }]}>
          <Copy kind='heading'>{ro.visual.categories}</Copy>
          <View
            style={[
              uiStyles.categoryPanel,
              fixedMenu && uiStyles.fill,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            {categories.map((category, index) => (
              <View
                key={category.id}
                style={[
                  index < categories.length - 1 && uiStyles.divider,
                  fixedMenu && uiStyles.spreadRow,
                  !compactMenu && uiStyles.categoryRow,
                  {
                    borderBottomColor: theme.border,
                  },
                ]}
              >
                <Row
                  icon={category.icon}
                  title={category.label}
                  subtitle={compactMenu ? undefined : category.hint}
                  onPress={() => {
                    Keyboard.dismiss();
                    router.push({
                      pathname: '/explore',
                      params: {
                        section: category.id,
                        ...(intent ? { intent } : {}),
                      },
                    });
                  }}
                />
              </View>
            ))}
          </View>
        </View>
      )}
    </MotionLayout>
  );
  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[uiStyles.s4, { backgroundColor: theme.background }]}
    >
      <NavigationSafeAreaView
        edges={{ bottom: Platform.OS === 'ios' && !bottom.content }}
      >
        <StudentPreviewBanner />
        <FlatList
          scrollEnabled={browsing || needsOverflow}
          bounces={browsing || needsOverflow}
          alwaysBounceVertical={false}
          showsVerticalScrollIndicator={browsing || needsOverflow}
          refreshing={browsing && query.isRefetching}
          onRefresh={browsing ? refreshCatalogue : undefined}
          // Android RefreshControl wraps the scroll view. Keep that wrapper
          // mounted across menu/search so the focused TextInput is not replaced.
          refreshControl={
            Platform.OS === 'android' ? (
              <RefreshControl
                enabled={browsing}
                refreshing={browsing && query.isRefetching}
                onRefresh={refreshCatalogue}
              />
            ) : undefined
          }
          ListFooterComponent={
            browsing && query.hasNextPage ? (
              <Button
                loading={query.isFetchingNextPage}
                variant='outline'
                onPress={() => {
                  query.fetchNextPage();
                }}
              >
                {ro.common.showMore}
              </Button>
            ) : null
          }
          data={browsing && !loading ? filtered : []}
          keyExtractor={(item) => item.type + item.id}
          contentContainerStyle={[
            design.screen,
            fixedMenu && uiStyles.staticMenu,
            bottom.content && { paddingBottom: s.lg + bottom.inset },
            { gap: s.md },
          ]}
          ListHeaderComponentStyle={fixedMenu ? uiStyles.fill : undefined}
          ListHeaderComponent={header}
          keyboardShouldPersistTaps='handled'
          ListEmptyComponent={
            browsing ? (
              loading || error ? (
                <DataState
                  loadingLayout='catalogue'
                  loading={loading}
                  error={error}
                  retry={() => {
                    profileQuery.refetch();
                    query.refetch();
                  }}
                />
              ) : (
                <Panel>
                  <Search size={32} color={theme.textSecondary} />
                  <Copy kind='heading'>{ro.explore.noResults}</Copy>
                  {(institutionTables as readonly string[]).includes(section) &&
                    !items.length &&
                    !query.hasNextPage &&
                    !search.trim() &&
                    !filter.trim() && (
                      <Copy style={{ color: theme.textSecondary }}>
                        {ro.profileChoices.countyEmpty}
                      </Copy>
                    )}
                  <Button
                    variant='secondary'
                    onPress={() => {
                      setFilter('');
                      setSearch('');
                    }}
                  >
                    {ro.visual.resetFilters}
                  </Button>
                </Panel>
              )
            ) : null
          }
          renderItem={({ item }) => (
            <CatalogueResult
              item={item}
              category={
                !section
                  ? categories.find((category) => category.id === item.type)
                      ?.label
                  : undefined
              }
              onPress={() => openOption(router, item)}
            />
          )}
        />
        <SelectField
          hideTrigger
          presented={showFilters}
          onDismiss={() => setShowFilters(false)}
          label={section ? ro.refinement.filterKeyword : ro.visual.categories}
          sheetTitle={ro.refinement.filterOptions}
          value={section ? filter : ''}
          options={
            section
              ? (keywords.data?.values || []).map((value) => ({
                  value,
                  label: value,
                }))
              : categories.map((category) => ({
                  value: category.id,
                  label: category.label,
                }))
          }
          onChange={(value) => {
            if (section) {
              setFilter(value);
            } else {
              setSection(value);
              setFilter('');
            }
          }}
          onReset={() => setFilter('')}
          searchPlaceholder={ro.common.search}
          content={
            section && (keywords.isPending || keywords.isError) ? (
              <DataState
                loadingLayout='row'
                loading={keywords.isPending}
                error={keywords.isError}
                retry={() => {
                  keywords.refetch();
                }}
              />
            ) : undefined
          }
        />
      </NavigationSafeAreaView>
      {standalone && Platform.OS === 'web' && (
        <BottomNavigation active={journey.activeTab || 'explore'} />
      )}
    </SafeAreaView>
  );
}

const uiStyles = StyleSheet.create({
  filterMaterial: { borderRadius: 24 },
  fill: { flex: 1 },
  staticMenu: { flex: 1, paddingBottom: s.lg },
  spreadRow: { flex: 1, justifyContent: 'center' },
  categoryPanel: {
    padding: s.sm,
    borderWidth: 1,
    borderRadius: radius.md,
    borderCurve: 'continuous',
  },
  categoryRow: { paddingVertical: s.xs },
  divider: { borderBottomWidth: 1 },
  s1: { flexDirection: 'row', alignItems: 'center' },
  filterButton: {
    width: 48,
    height: 48,
    flexShrink: 0,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterDot: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  s3: { flex: 1, minWidth: 0 },
  s4: { flex: 1 },
});
