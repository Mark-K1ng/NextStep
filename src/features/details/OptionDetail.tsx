import { squircle } from '@/theme/tokens';
import { StyleSheet } from 'react-native';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSession } from '@/providers/auth';
import { View, Share, Platform, useWindowDimensions } from 'react-native';
import {
  MotionPressable as Pressable,
  MotionContent,
} from '@/components/motion';
import { useLocalSearchParams } from 'expo-router';
import { useAppRouter as useRouter } from '@/hooks/use-app-router';
import {
  Share2,
  BookOpen,
  Briefcase,
  Info,
  GraduationCap,
  Columns2,
} from 'lucide-react-native';
import {
  Screen,
  Copy,
  Row,
  Panel,
  Section,
  GroupedList,
  BackHeader,
  design,
} from '@/components/design';
import { Button } from '@/components';
import { DataState } from '@/components/data-state';
import { SaveButton } from '@/components/save-button';
import { CareerGoalAction } from '@/components/career-goal-action';
import { BackButton } from '@/components/back-button';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';
import { openExternalUrl } from '@/lib/open-external-url';
import { openOption } from '@/lib/option-navigation';
import { showMessage } from '@/lib/show-message';
import { useProfileQuery } from '@/hooks/use-profile';
import {
  institutionTables,
  institutionCountyColumn,
  institutionVisible,
} from '@/lib/institution-scope';
import { normalizeCounty } from '@/constants/profile-options';
import { useAccountMode } from '@/providers/account-mode';
import { InstitutionMap } from '@/components/InstitutionMap';
import { ro } from '@/i18n/ro';
import { radius, spacing as s } from '@/theme/tokens';
import { DetailHeading } from './detail-heading';
import type { ExploreItem } from '@/types/models';
import { SchoolAdmissions, AdmissionFacts } from './school-admissions';
import { useJourney } from '@/providers/journey';
import {
  readableSourceUrl,
  admissionVariant,
  type SchoolAdmission,
} from '@/lib/school-admissions';
type Kind =
  | 'schools'
  | 'school_profiles'
  | 'universities'
  | 'programs'
  | 'careers'
  | 'courses';
type Related = {
  id: string;
  name: string;
  domain?: string;
  universities?: { name: string; county?: string };
  county?: string;
};
type Detail = Partial<SchoolAdmission> & {
  id: string;
  name?: string;
  title?: string;
  description?: string;
  city?: string;
  county?: string;
  domain?: string;
  website?: string;
  address?: string;
  location_note?: string;
  url?: string;
  source_url?: string;
  verified_at?: string;
  degree_level?: string;
  duration_years?: number;
  provider?: string;
  language?: string;
  level?: string;
  specialization?: string;
  track?: string;
  admission_notes?: string;
  key_subjects?: string[];
  schools?: { id: string; name: string; county: string; description?: string };
  universities?: { name: string; county?: string };
  school_profiles?: SchoolAdmission[];
  programs?: Related[];
  school_profile_programs?: { programs: Related }[];
  program_careers?: { careers?: Related; programs?: Related }[];
  career_skills?: { skills: Related }[];
  program_skills?: { skills: Related }[];
  course_skills?: { skills: Related }[];
};
const selections: Record<Kind, string> = {
  schools: '*,school_profiles(*)',
  school_profiles:
    '*,schools!inner(*),school_profile_programs(programs(*,universities(name,county)))',
  universities: '*,programs(*)',
  programs:
    '*,universities!inner(*),program_skills(skills(*)),program_careers(careers(*))',
  careers:
    '*,career_skills(skills(*)),program_careers(programs(*,universities(name,county)))',
  courses: '*,course_skills(skills(*))',
};
const labels: Record<Kind, string> = {
  schools: ro.explore.sections.schools,
  school_profiles: ro.visual.specializations,
  universities: ro.explore.sections.universities,
  programs: ro.visual.studyPrograms,
  careers: ro.explore.sections.careers,
  courses: ro.explore.sections.courses,
};
export default function OptionDetail({ kind }: { kind: Kind }) {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const { session } = useSession();
  const profileQuery = useProfileQuery();
  const { isPreview, previewCounty } = useAccountMode();
  const county = normalizeCounty(
    isPreview ? previewCounty : profileQuery.data?.county
  );
  const { beginComparison } = useJourney();
  const { fontScale } = useWindowDimensions();
  const headerTitle =
    kind === 'programs' ? ro.refinement.studyProgramsHeader : labels[kind];
  const [showSupporting, setShowSupporting] = useState(false);
  const query = useQuery({
    queryKey: [
      'option',
      session?.user.id,
      kind,
      id,
      county,
      isPreview ? 'preview' : 'student',
    ],
    enabled: !!id && !!session && (isPreview || profileQuery.isSuccess),
    queryFn: async ({ signal }) => {
      const scoped = (institutionTables as readonly string[]).includes(kind);
      if (scoped && !county) {
        return null;
      }
      let request = supabase.from(kind).select(selections[kind]);
      if (scoped) {
        request = request.eq(institutionCountyColumn(kind), county);
      }
      const result = await request.eq('id', id).abortSignal(signal).single();
      if (result.error) {
        throw result.error;
      }
      return result.data as unknown as Detail;
    },
  });
  const item = query.data;
  const archived = kind === 'school_profiles' && item?.is_current === false;
  const sourceUrl = readableSourceUrl(item?.source_url);
  const loading = query.isLoading || (!isPreview && profileQuery.isPending);
  const error = query.isError || (!isPreview && profileQuery.isError);

  const option: ExploreItem = {
    id,
    type: kind,
    sourceUrl: readableSourceUrl(item?.source_url),
    verifiedAt: item?.verified_at,
    name: item?.name || item?.specialization || item?.title,
    description: item?.description || item?.schools?.name,
    county: item?.county || item?.schools?.county || item?.universities?.county,
    specialization:
      kind === 'schools'
        ? [
            ...new Set(
              item?.school_profiles
                ?.filter((profile) => profile.is_current)
                .map((profile) => profile.specialization)
                .filter(Boolean)
            ),
          ].join(' · ')
        : item?.specialization,
    domain: item?.domain,
    provider: item?.provider,
  };
  const subjects = kind === 'schools' ? [] : item?.key_subjects || [];
  const skills =
    item?.career_skills || item?.program_skills || item?.course_skills || [];
  const related =
    kind === 'schools'
      ? []
      : kind === 'school_profiles'
        ? item?.school_profile_programs?.map((link) => ({
            ...link.programs,
            type: 'programs',
          }))
        : kind === 'programs'
          ? item?.program_careers?.map((link) => ({
              ...link.careers!,
              type: 'careers',
            }))
          : kind === 'universities'
            ? item?.programs?.map((program) => ({
                ...program,
                type: 'programs',
                universities: { name: item.name, county: item.county },
              }))
            : kind === 'careers'
              ? item?.program_careers?.flatMap((link) =>
                  link.programs ? [{ ...link.programs, type: 'programs' }] : []
                )
              : [];
  const visibleRelated = related?.filter((link) =>
    institutionVisible(link.type, link, county)
  );
  const institution =
    kind === 'schools' || kind === 'universities' ? item : null;
  const categoryBadge = (
    <Copy
      kind='label'
      style={[
        uiStyles.s4,
        fontScale < 1.5 ? uiStyles.inlineBadge : uiStyles.stackedBadge,
        {
          color: theme.accentText,
          backgroundColor: theme.accent + '26',
          ...squircle,
          borderRadius: radius.sm,
          paddingHorizontal: s.md,
          paddingVertical: s.sm,
        },
      ]}
    >
      {labels[kind].toUpperCase()}
      {item?.track ? ' · ' + item.track.toUpperCase() : ''}
    </Copy>
  );
  const actions =
    item && !archived ? (
      <View style={[uiStyles.actions, uiStyles.compactActions]}>
        <SaveButton item={option} />
        <Pressable
          accessibilityRole='button'
          accessibilityLabel={ro.visual.compare}
          onPress={() => {
            beginComparison(option);
            router.push('/compare');
          }}
          style={[design.touch, uiStyles.s3]}
        >
          <Columns2 size={22} color={theme.textSecondary} />
        </Pressable>
        <Pressable
          accessibilityRole='button'
          accessibilityLabel={ro.visual.share}
          onPress={() =>
            Share.share({
              message: [option.name, sourceUrl].filter(Boolean).join('\n'),
            }).catch(() => showMessage(ro.errors.serverError))
          }
          style={({ pressed }) => [
            design.touch,
            uiStyles.s3,
            { opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Share2 color={theme.textSecondary} />
        </Pressable>
      </View>
    ) : undefined;
  return (
    <Screen
      tab='explore'
      nativeTitle={headerTitle}
      nativeActions={Platform.OS === 'ios' ? actions : undefined}
    >
      {Platform.OS === 'android' ? (
        <BackHeader title={headerTitle} trailing={actions} />
      ) : (
        Platform.OS !== 'ios' && (
          <View style={[uiStyles.s0, { gap: s.sm }]}>
            <BackButton onPress={() => router.back()} />
            {fontScale < 1.5 && item && !archived && categoryBadge}
            <View style={uiStyles.s2} />
            {actions}
          </View>
        )
      )}
      {loading || (error && !item) || !item ? (
        <DataState
          loadingLayout='detail'
          loading={loading}
          error={error}
          retry={() => {
            query.refetch();
          }}
        />
      ) : archived ? (
        <Panel>
          <Copy>{ro.admissions.archived}</Copy>
          <Button
            onPress={() =>
              router.push({
                pathname: '/school/[id]',
                params: { id: item.schools!.id },
              })
            }
          >
            {ro.admissions.school}
          </Button>
        </Panel>
      ) : (
        <>
          {error && (
            <DataState
              error
              retry={() => {
                profileQuery.refetch();
                query.refetch();
              }}
            />
          )}
          <DetailHeading
            title={option.name || ''}
            leading={Platform.OS === 'web' && fontScale >= 1.5 && categoryBadge}
            subtitle={[
              option.county,
              kind === 'school_profiles' ? item.schools?.name : '',
              item.track ||
                item.domain ||
                item.universities?.name ||
                item.schools?.name ||
                item.provider,
            ]
              .filter(Boolean)
              .join(' · ')}
          >
            {(item.degree_level ||
              item.duration_years ||
              item.language ||
              item.level) && (
              <View>
                <Copy kind='caption' style={{ color: theme.textSecondary }}>
                  {[
                    item.degree_level,
                    item.duration_years
                      ? item.duration_years + ' ' + ro.visual.years
                      : '',
                    item.language,
                    item.level,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </Copy>
              </View>
            )}
          </DetailHeading>
          {kind === 'careers' && (
            <CareerGoalAction id={id} name={option.name || ''} />
          )}
          {(kind === 'school_profiles'
            ? item.admission_notes
            : !institution && item.description) && (
            <Panel>
              <Copy>
                {kind === 'school_profiles'
                  ? item.admission_notes
                  : item.description}
              </Copy>
            </Panel>
          )}
          {kind === 'school_profiles' && item.admission_year && (
            <Panel>
              <Copy kind='heading'>
                {ro.admissions.title} {item.admission_year}
              </Copy>
              <Copy kind='caption' style={{ color: theme.textSecondary }}>
                {ro.admissions.code} {item.admission_code} ·{' '}
                {admissionVariant(item as SchoolAdmission)}
              </Copy>
              <AdmissionFacts profile={item as SchoolAdmission} expanded />
              <Copy kind='caption' style={{ color: theme.textSecondary }}>
                {ro.admissions.historyNote}
              </Copy>
            </Panel>
          )}
          {!!subjects.length && (
            <View style={uiStyles.section}>
              <Section title={ro.visual.importantSubjects} />
              <Panel>
                {[...new Set(subjects)].map((subject) => (
                  <Row key={subject} icon={BookOpen} title={subject} />
                ))}
              </Panel>
            </View>
          )}
          {kind === 'school_profiles' && (
            <Panel>
              {!subjects.length && <Copy>{ro.admissions.subjectsEmpty}</Copy>}
              {!!item.subjects_note && (
                <Copy kind='caption' style={{ color: theme.textSecondary }}>
                  {item.subjects_note}
                </Copy>
              )}
              {!!item.subjects_source_url && (
                <Button
                  variant='outline'
                  onPress={() => openExternalUrl(item.subjects_source_url!)}
                >
                  {ro.admissions.curriculum}
                </Button>
              )}
            </Panel>
          )}
          {!!skills.length && (
            <View style={uiStyles.section}>
              <Section title={ro.common.skills} />
              <Panel>
                {skills
                  .filter((link) => link.skills)
                  .map((link) => (
                    <Row
                      key={link.skills.id}
                      icon={BookOpen}
                      title={link.skills.name}
                      onPress={() =>
                        router.push({
                          pathname: '/skill/[id]',
                          params: { id: link.skills.id },
                        })
                      }
                    />
                  ))}
              </Panel>
            </View>
          )}
          {!!visibleRelated?.length && (
            <View style={uiStyles.section}>
              <Section title={ro.visual.leadsTo} />
              <GroupedList inset>
                {visibleRelated.map((link) => (
                  <Row
                    key={link.id}
                    icon={kind === 'programs' ? Briefcase : GraduationCap}
                    title={link.name}
                    onPress={() => openOption(router, link)}
                  />
                ))}
              </GroupedList>
            </View>
          )}
          {kind === 'schools' ? (
            <SchoolAdmissions
              profiles={item.school_profiles || []}
              onSelect={(profile) =>
                openOption(router, { id: profile.id, type: 'school_profiles' })
              }
            />
          ) : (
            <Panel>
              {kind !== 'school_profiles' && (
                <Row icon={Info} title={ro.refinement.sourceHint} />
              )}
              {sourceUrl && (
                <Button
                  variant='outline'
                  onPress={() => openExternalUrl(sourceUrl)}
                >
                  {kind === 'school_profiles'
                    ? ro.admissions.report
                    : ro.detail.source}
                </Button>
              )}
              {(item.url || (!institution && item.website)) && (
                <Button
                  onPress={() => openExternalUrl((item.url || item.website)!)}
                >
                  {item.url ? ro.course.url : ro.school.website}
                </Button>
              )}
            </Panel>
          )}
          {institution && (
            <View style={uiStyles.section}>
              <Section title={ro.refinement.history} />
              <Button
                variant='outline'
                accessibilityState={{ expanded: showSupporting }}
                onPress={() => setShowSupporting((value) => !value)}
              >
                {showSupporting ? ro.common.showLess : ro.common.showMore}
              </Button>
              {showSupporting && (
                <MotionContent style={uiStyles.section}>
                  {!!institution.description && (
                    <Panel>
                      <Copy>{institution.description}</Copy>
                    </Panel>
                  )}
                  {!!institution.address && <Copy>{institution.address}</Copy>}
                  {!!institution.location_note && (
                    <Copy kind='caption' style={{ color: theme.textSecondary }}>
                      {institution.location_note}
                    </Copy>
                  )}
                  <InstitutionMap
                    name={option.name || ''}
                    city={institution.city}
                    county={institution.county}
                    address={institution.address}
                  />
                  {!!institution.website && (
                    <Pressable
                      accessibilityRole='link'
                      onPress={() => openExternalUrl(institution.website!)}
                      style={({ pressed }) => [
                        design.touch,
                        { opacity: pressed ? 0.7 : 1 },
                      ]}
                    >
                      <Copy kind='caption'>{ro.school.website}</Copy>
                      <Copy style={{ color: theme.accentText }}>
                        {institution.website}
                      </Copy>
                    </Pressable>
                  )}
                </MotionContent>
              )}
            </View>
          )}
        </>
      )}
    </Screen>
  );
}

const uiStyles = StyleSheet.create({
  actions: { flexDirection: 'row', alignItems: 'center', gap: s.sm },
  compactActions: { gap: 0 },
  s0: { flexDirection: 'row', alignItems: 'center' },
  s2: { flex: 1 },
  s3: { width: 48, alignItems: 'center' },
  s4: { flexShrink: 1 },
  inlineBadge: { alignSelf: 'center' },
  stackedBadge: { alignSelf: 'flex-start' },
  section: { gap: s.lg },
});
