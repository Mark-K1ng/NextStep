import { supabase } from '@/lib/supabase';
import {
  institutionCountyColumn,
  institutionTables,
  institutionVisible,
} from '@/lib/institution-scope';
import { normalizeCounty } from '@/constants/profile-options';
import { readableSourceUrl } from '@/lib/school-admissions';
import { ro } from '@/i18n/ro';
import type { ExploreItem } from '@/types/models';

const selections = {
  schools: '*,school_profiles(specialization,is_current)',
  school_profiles: '*,schools!inner(name,county)',
  universities: '*',
  programs: '*,universities!inner(name,county)',
  careers: '*',
  courses: '*',
  skills: '*',
} as const;

type RecordData = {
  id: string;
  name?: string;
  title?: string;
  description?: string;
  county?: string;
  domain?: string;
  category?: string;
  specialization?: string;
  provider?: string;
  degree_level?: string;
  duration_years?: number;
  language?: string;
  teaching_language?: string;
  is_free?: boolean;
  is_current?: boolean;
  level?: string;
  track?: string;
  key_subjects?: string[];
  source_url?: string;
  verified_at?: string;
  schools?: { name: string; county: string };
  universities?: { name: string; county: string };
  school_profiles?: { specialization: string; is_current: boolean }[];
};

/** Both columns use current records rather than differently shaped UI snapshots. */
export async function loadComparisonOptions(
  selected: ExploreItem[],
  county: string,
  signal?: AbortSignal
): Promise<ExploreItem[]> {
  const type = selected[0]?.type;
  if (
    !type ||
    !Object.hasOwn(selections, type) ||
    selected.some((item) => item.type !== type)
  ) {
    throw new Error('Unsupported comparison');
  }
  const scoped = (institutionTables as readonly string[]).includes(type);
  const normalizedCounty = normalizeCounty(county);
  if (scoped && !normalizedCounty) {
    throw new Error('Comparison county required');
  }
  let request = supabase
    .from(type)
    .select(selections[type as keyof typeof selections]);
  if (scoped) {
    request = request.eq(institutionCountyColumn(type), normalizedCounty);
  }
  const { data, error } = await request
    .in(
      'id',
      selected.map((item) => item.id)
    )
    .abortSignal(signal || new AbortController().signal);
  if (error) {
    throw error;
  }
  const records = new Map(
    ((data || []) as unknown as RecordData[]).map((row) => [row.id, row])
  );
  return selected.map((item) => {
    const row = records.get(item.id);
    if (
      !row ||
      !institutionVisible(type, row, normalizedCounty) ||
      row.is_current === false
    ) {
      throw new Error('Comparison option unavailable');
    }
    return {
      id: row.id,
      type,
      name: row.name || row.specialization || row.title,
      title: row.title,
      county: row.county || row.schools?.county || row.universities?.county,
      description:
        row.description ||
        (type === 'school_profiles' ? row.schools?.name : undefined),
      specialization:
        type === 'schools'
          ? [
              ...new Set(
                row.school_profiles
                  ?.filter((profile) => profile.is_current)
                  .map((profile) => profile.specialization)
              ),
            ].join(' · ')
          : row.specialization,
      domain: row.domain || row.category,
      provider: row.provider || row.universities?.name,
      degreeLevel: row.degree_level,
      duration: row.duration_years
        ? `${row.duration_years} ${ro.visual.years}`
        : undefined,
      language: row.language || row.teaching_language,
      isFree: row.is_free,
      level: row.level,
      track: row.track,
      subjects: row.key_subjects,
      sourceUrl: readableSourceUrl(row.source_url),
      verifiedAt: row.verified_at,
    };
  });
}
