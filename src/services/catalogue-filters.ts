import { supabase } from '@/lib/supabase';

const fields: Record<string, string> = {
  skills: 'category',
  school_profiles: 'track',
  programs: 'degree_level',
  careers: 'domain',
  courses: 'level',
};
export async function loadCatalogueKeywords(
  section: string,
  county: string,
  signal?: AbortSignal
) {
  const table = section === 'schools' ? 'school_profiles' : section;
  const field = section === 'schools' ? 'specialization' : fields[section];
  if (!field) {
    return { values: [] as string[], limited: false };
  }
  if (['schools', 'school_profiles', 'programs'].includes(section) && !county) {
    return { values: [] as string[], limited: false };
  }
  const select = ['schools', 'school_profiles'].includes(section)
    ? `${field},schools!inner(county)`
    : section === 'programs'
      ? `${field},universities!inner(county)`
      : field;
  let request = supabase.from(table).select(select).order(field).limit(501);
  if (['schools', 'school_profiles'].includes(section)) {
    request = request.eq('schools.county', county).eq('is_current', true);
  }
  if (section === 'programs') {
    request = request.eq('universities.county', county);
  }
  if (signal) {
    request = request.abortSignal(signal);
  }
  const { data, error } = await request;
  if (error) {
    throw error;
  }
  const rows = (data || []) as unknown as Record<string, unknown>[];
  return {
    values: [
      ...new Set(
        rows
          .slice(0, 500)
          .map((row) => row[field])
          .filter(
            (value): value is string =>
              typeof value === 'string' && !!value.trim()
          )
      ),
    ].sort((a, b) => a.localeCompare(b, 'ro')),
    limited: rows.length > 500,
  };
}
