import { supabase } from '@/lib/supabase';
export type PathOptionType =
  'school' | 'university' | 'program' | 'course' | 'career' | 'skill';
export async function isOnPath(
  userId: string,
  type: PathOptionType,
  refId: string
) {
  if (type === 'career') {
    const result = await supabase
      .from('user_goals')
      .select('career_id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1);
    if (result.error) {
      throw result.error;
    }
    return result.data?.[0]?.career_id === refId;
  }
  const result = await supabase
    .from('user_progress')
    .select('id')
    .eq('user_id', userId)
    .eq('step_type', type)
    .eq('ref_id', refId)
    .limit(1);
  if (result.error) {
    throw result.error;
  }
  return !!result.data?.length;
}
export async function setPathSelection(
  type: PathOptionType,
  refId: string,
  selected: boolean,
  expectedUserId?: string
) {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    throw error || new Error('Session required');
  }
  if (expectedUserId && user.id !== expectedUserId) {
    throw new Error('Session changed');
  }
  const table = type === 'career' ? 'user_goals' : 'user_progress';
  if (!selected) {
    let request = supabase.from(table).delete().eq('user_id', user.id);
    request =
      type === 'career'
        ? request.eq('career_id', refId)
        : request.eq('step_type', type).eq('ref_id', refId);
    const result = await request;
    if (result.error) {
      throw result.error;
    }
  } else {
    const result =
      type === 'career'
        ? await supabase
            .from(table)
            .insert({ user_id: user.id, career_id: refId })
        : await supabase.from(table).upsert(
            {
              user_id: user.id,
              step_type: type,
              ref_id: refId,
              status: 'in_progress',
            },
            { onConflict: 'user_id,step_type,ref_id', ignoreDuplicates: true }
          );
    if (result.error) {
      throw result.error;
    }
  }
}
