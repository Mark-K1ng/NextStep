import { supabase } from '@/lib/supabase';
import { normalizeSavedOption } from '@/lib/saved-options';
import type { ExploreItem } from '@/types/models';
import type { PathOptionType } from './option-path';

const tables = {
  school: 'schools',
  university: 'universities',
  program: 'programs',
  course: 'courses',
  skill: 'skills',
  career: 'careers',
} as const;
type SavedPathRow = {
  id: string;
  county?: string | null;
  domain?: string | null;
  category?: string | null;
  provider?: string | null;
  source_url?: string | null;
  verified_at?: string | null;
  universities?: { county?: string; name?: string } | null;
};

export async function resolveSavedPathTarget(
  item: ExploreItem
): Promise<{ type: PathOptionType; id: string }> {
  if (item.type === 'school_profiles') {
    const { data, error } = await supabase
      .from('school_profiles')
      .select('school_id')
      .eq('id', item.id)
      .single();
    if (error || !data?.school_id) {
      throw error || new Error('School unavailable');
    }
    return { type: 'school', id: data.school_id };
  }
  const type = Object.entries(tables).find(
    ([, table]) => table === item.type
  )?.[0] as PathOptionType | undefined;
  if (!type) {
    throw new Error('Unsupported saved category');
  }
  return { type, id: item.id };
}

// Recover selections made by the previous detail-header implementation.
export async function loadSavedPathOptions(
  userId: string
): Promise<ExploreItem[]> {
  const [progress, goal] = await Promise.all([
    supabase
      .from('user_progress')
      .select('step_type,ref_id')
      .eq('user_id', userId),
    supabase
      .from('user_goals')
      .select('career_id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
  ]);
  if (progress.error || goal.error) {
    throw progress.error || goal.error;
  }
  const refs = [
    ...(progress.data || []).map((row) => ({
      type: row.step_type as PathOptionType,
      id: row.ref_id as string,
    })),
    ...(goal.data || []).map((row) => ({
      type: 'career' as const,
      id: row.career_id as string,
    })),
  ];
  const groups = await Promise.all(
    Object.entries(tables).map(async ([type, table]) => {
      const ids = refs.filter((row) => row.type === type).map((row) => row.id);
      if (!ids.length) {
        return [];
      }
      const { data, error } = await supabase
        .from(table)
        .select(type === 'program' ? '*,universities(county,name)' : '*')
        .in('id', ids);
      if (error) {
        throw error;
      }
      return ((data || []) as unknown as SavedPathRow[]).map((row) =>
        normalizeSavedOption({
          ...row,
          pathSynced: true,
          type: table,
          county: row.county || row.universities?.county,
          domain: row.domain || row.category,
          provider: row.provider || row.universities?.name,
          sourceUrl: row.source_url,
          verifiedAt: row.verified_at,
        })
      );
    })
  );
  return groups.flat();
}
