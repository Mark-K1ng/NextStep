import { supabase } from '@/lib/supabase';
import type { PathStep } from '@/types/models';

type ProgressRow = {
  id: string;
  ref_id: string;
  step_type: Exclude<PathStep['type'], 'career'>;
  status: PathStep['status'];
};
const tables = {
  school: 'schools',
  university: 'universities',
  program: 'programs',
  course: 'courses',
  skill: 'skills',
} as const;

export async function loadPathSteps(
  userId: string,
  county?: string,
  signal?: AbortSignal
): Promise<PathStep[]> {
  const { data, error } = await supabase
    .from('user_progress')
    .select('id, ref_id, step_type, status')
    .eq('user_id', userId)
    .order('updated_at')
    .abortSignal(signal || new AbortController().signal);
  if (error) {
    throw error;
  }
  const rows = (data || []) as ProgressRow[];
  const names = new Map<string, string>();
  await Promise.all(
    Object.entries(tables).map(async ([type, table]) => {
      const ids = rows
        .filter((row) => row.step_type === type)
        .map((row) => row.ref_id);
      if (!ids.length) {
        return;
      }
      const column = type === 'course' ? 'title' : 'name';
      const selection =
        type === 'program'
          ? `id, ${column}, universities!inner(county)`
          : `id, ${column}`;
      let request = supabase.from(table).select(selection).in('id', ids);
      if (['school', 'university', 'program'].includes(type)) {
        if (!county) {
          return;
        }
        request = request.eq(
          type === 'program' ? 'universities.county' : 'county',
          county
        );
      }
      const result = await request.abortSignal(
        signal || new AbortController().signal
      );
      if (result.error) {
        throw result.error;
      }
      for (const item of (result.data || []) as unknown as {
        id: string;
        name?: string;
        title?: string;
      }[]) {
        names.set(`${type}:${item.id}`, item.name || item.title || '');
      }
    })
  );
  return rows
    .filter(
      (row) =>
        !['school', 'university', 'program'].includes(row.step_type) ||
        names.has(`${row.step_type}:${row.ref_id}`)
    )
    .map((row) => ({
      refId: row.ref_id,
      id: row.id,
      type: row.step_type,
      status: row.status,
      name:
        names.get(`${row.step_type}:${row.ref_id}`) || 'Resursă indisponibilă',
      title:
        names.get(`${row.step_type}:${row.ref_id}`) || 'Resursă indisponibilă',
    }));
}
