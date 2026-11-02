import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { normalizeSavedOption, readSavedOptions } from '@/lib/saved-options';
import type { ExploreItem } from '@/types/models';
import { accountRequest } from '@/lib/account-request';

export const bookmarkTypes = {
  schools: 'school',
  school_profiles: 'specialization',
  universities: 'university',
  programs: 'program',
  careers: 'career',
  courses: 'course',
  skills: 'skill',
} as const;
type Table = keyof typeof bookmarkTypes;
export async function loadBookmarks(
  userId: string,
  { migrate = true }: { migrate?: boolean } = {}
): Promise<ExploreItem[]> {
  const migrationKey = 'nextstep-bookmarks-imported-v1-' + userId;
  const imported = await AsyncStorage.getItem(migrationKey);
  if (migrate && !imported) {
    const raw = await AsyncStorage.getItem('nextstep-saved-' + userId);
    let local: ExploreItem[] = [];
    try {
      local = readSavedOptions(raw ? JSON.parse(raw) : []);
    } catch {
      /* Broken legacy caches cannot hide account bookmarks. */
    }
    const items = local
      .filter((item) => /^[0-9a-f-]{36}$/i.test(item.id))
      .map((item) => ({
        item_type: bookmarkTypes[item.type as Table],
        item_id: item.id,
      }));
    const result = await supabase.rpc('import_local_bookmarks', {
      items,
      expected_user: userId,
    });
    if (result.error) {
      throw result.error;
    }
    await AsyncStorage.setItem(migrationKey, '1');
  }
  const result = await supabase
    .from('user_favorites')
    .select('item_type,item_id')
    .eq('user_id', userId)
    .order('created_at');
  if (result.error) {
    throw result.error;
  }
  const groups = await Promise.all(
    Object.entries(bookmarkTypes).map(async ([table, type]) => {
      const ids = (result.data || [])
        .filter((row) => row.item_type === type)
        .map((row) => row.item_id);
      if (!ids.length) {
        return [];
      }
      const selection =
        table === 'programs'
          ? '*,universities(county,name)'
          : table === 'school_profiles'
            ? '*,schools(county,name)'
            : '*';
      const rows = await supabase.from(table).select(selection).in('id', ids);
      if (rows.error) {
        throw rows.error;
      }
      return (rows.data || []).map((value) => {
        const row = value as unknown as ExploreItem & {
          category?: string;
          source_url?: string;
          verified_at?: string;
          universities?: { county?: string; name?: string };
          schools?: { county?: string; name?: string };
        };
        return normalizeSavedOption({
          ...row,
          type: table,
          name: row.name || row.specialization,
          county: row.county || row.universities?.county || row.schools?.county,
          domain: row.domain || row.category,
          provider: row.provider || row.universities?.name || row.schools?.name,
          sourceUrl: row.source_url,
          verifiedAt: row.verified_at,
        });
      });
    })
  );
  return groups.flat();
}
export async function writeBookmark(
  userId: string,
  item: ExploreItem,
  selected: boolean
) {
  const result = await accountRequest((signal) =>
    supabase
      .rpc('set_bookmark', {
        kind: bookmarkTypes[item.type as Table],
        ref: item.id,
        selected,
        expected_user: userId,
      })
      .abortSignal(signal)
  );
  if (result.error) {
    throw result.error;
  }
}
