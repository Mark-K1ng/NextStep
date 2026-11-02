import { supabase } from '@/lib/supabase';
import { readableSourceUrl } from '@/lib/school-admissions';
import type { ExploreItem } from '@/types/models';

export const CATALOGUE_PAGE_SIZE = 20;
export async function searchCatalogue({
  section,
  search,
  filter,
  county,
  page,
  signal,
}: {
  section: string;
  search: string;
  filter: string;
  county: string;
  page: number;
  signal?: AbortSignal;
}) {
  let request = supabase.rpc('search_catalogue', {
    p_section: section,
    p_search: search.trim().slice(0, 200),
    p_filter: filter.trim().slice(0, 200),
    p_county: county,
    p_offset: page * CATALOGUE_PAGE_SIZE,
    p_limit: CATALOGUE_PAGE_SIZE + 1,
  });
  if (signal) {
    request = request.abortSignal(signal);
  }
  const result = await request;
  if (result.error) {
    throw result.error;
  }
  const rows = (result.data || []) as ExploreItem[];
  return {
    items: rows.slice(0, CATALOGUE_PAGE_SIZE).map((item) => ({
      ...item,
      sourceUrl: readableSourceUrl(item.sourceUrl),
    })),
    more: rows.length > CATALOGUE_PAGE_SIZE,
    page,
  };
}
