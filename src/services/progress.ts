import { supabase } from '@/lib/supabase';
import type { PathStep } from '@/types/models';
export async function saveProgress(
  type: 'school' | 'program' | 'course' | 'skill',
  refId: string
) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    throw authError || new Error('Session required');
  }
  const existing = await supabase
    .from('user_progress')
    .select('id')
    .eq('user_id', user.id)
    .eq('step_type', type)
    .eq('ref_id', refId)
    .limit(1);
  if (existing.error) {
    throw existing.error;
  }
  if (existing.data?.length) {
    return;
  }
  const result = await supabase.from('user_progress').insert({
    user_id: user.id,
    step_type: type,
    ref_id: refId,
    status: 'in_progress',
  });
  if (result.error) {
    throw result.error;
  }
}
export async function updateProgress(id: string, status: PathStep['status']) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    throw authError || new Error('Session required');
  }
  const result = await supabase
    .from('user_progress')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)
    .select('id')
    .single();
  if (result.error) {
    throw result.error;
  }
}
