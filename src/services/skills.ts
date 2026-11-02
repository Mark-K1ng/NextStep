import { supabase } from '@/lib/supabase';
import { z } from 'zod';
const levelSchema = z.number().int().min(0).max(3);
export async function saveSkillLevel(skillId: string, level: number) {
  levelSchema.parse(level);
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    throw authError || new Error('Session required');
  }
  const result =
    level === 0
      ? await supabase
          .from('user_skills')
          .delete()
          .eq('user_id', user.id)
          .eq('skill_id', skillId)
      : await supabase
          .from('user_skills')
          .upsert(
            { user_id: user.id, skill_id: skillId, level },
            { onConflict: 'user_id,skill_id' }
          );
  if (result.error) {
    throw result.error;
  }
}
