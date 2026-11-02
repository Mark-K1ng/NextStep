import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import type { ExploreItem } from '@/types/models';
import { clearDataExport } from '@/lib/export-data';
import { clearGuestIntake, readGuestIntake } from './education';

export async function exportMyData(
  userId: string,
  email: string | undefined,
  saved: ExploreItem[]
) {
  const { data, error } = await supabase.functions.invoke('export-data');
  if (error || !data || data.userId !== userId) {
    throw new Error('Unable to export account data');
  }
  return { ...data, account: { email }, savedOptions: saved };
}

export async function deleteMyAccount(userId: string, boundIntake?: string) {
  const { data, error } = await supabase.functions.invoke('delete-account');
  if (error || data?.success !== true) {
    throw new Error('Unable to delete account');
  }
  // The server has deleted the account; clear this device without a second remote logout.
  await AsyncStorage.removeItem('nextstep-saved-' + userId).catch(() => {});
  await AsyncStorage.removeItem(
    'nextstep-bookmarks-imported-v1-' + userId
  ).catch(() => {});
  await clearDataExport().catch(() => {});
  if (boundIntake) {
    const draft = await readGuestIntake().catch(() => null);
    if (draft?.id === boundIntake) {
      await clearGuestIntake().catch(() => {});
    }
  }
  await supabase.auth.signOut({ scope: 'local' });
}
