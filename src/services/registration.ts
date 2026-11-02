import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { gradeSchema, locationSchema } from '@/lib/validators';

export function parseStringArray(value?: string): string[] {
  try {
    const parsed: unknown = JSON.parse(value || '[]');
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === 'string')
      : [];
  } catch {
    return [];
  }
}

// Coalesce signup and startup completion while AuthProvider publishes SIGNED_IN.
const registrations = new Map<string, Promise<void>>();
export function completeRegistration(user: User): Promise<void> {
  const existing = registrations.get(user.id);
  if (existing) {
    return existing;
  }
  const pending = persistRegistration(user).finally(() => {
    if (registrations.get(user.id) === pending) {
      registrations.delete(user.id);
    }
  });
  registrations.set(user.id, pending);
  return pending;
}

// Save onboarding only after confirmation grants the user's normal RLS access.
// The pending marker is cleared so later sign-ins cannot overwrite profile edits.
async function persistRegistration(user: User) {
  const pending: unknown = user.user_metadata.nextstep_profile_pending;
  if (!user.email_confirmed_at || !pending || typeof pending !== 'object') {
    return;
  }
  const profile = pending as Record<string, unknown>;
  const access = await supabase.rpc('get_account_access');
  if (
    access.error ||
    !['student', 'teacher'].includes(access.data?.account_kind)
  ) {
    throw access.error || new Error('Account access unavailable');
  }
  if (access.data.account_kind === 'teacher') {
    if (
      typeof profile.display_name !== 'string' ||
      !profile.display_name.trim()
    ) {
      throw new Error('Invalid teacher identity');
    }
    await saveProfile(user.id, { display_name: profile.display_name.trim() });
    const updated = await supabase.auth.updateUser({
      data: { nextstep_profile_pending: null },
    });
    if (updated.error) {
      throw updated.error;
    }
    return;
  }
  if (
    typeof profile.display_name !== 'string' ||
    !locationSchema.safeParse({
      county: profile.county,
      sector: profile.sector,
    }).success ||
    !gradeSchema.safeParse(profile.grade_level).success
  ) {
    throw new Error('Invalid registration profile');
  }
  await saveProfile(user.id, {
    display_name: profile.display_name,
    county: profile.county,
    sector: profile.sector ?? null,
    grade_level: profile.grade_level,
    interests: Array.isArray(profile.interests)
      ? profile.interests.filter(
          (value): value is string => typeof value === 'string'
        )
      : [],
    favorite_subjects: Array.isArray(profile.favorite_subjects)
      ? profile.favorite_subjects.filter(
          (value): value is string => typeof value === 'string'
        )
      : [],
  });
  const { error: metadataError } = await supabase.auth.updateUser({
    data: { nextstep_profile_pending: null },
  });
  if (metadataError) {
    throw metadataError;
  }
}

async function saveProfile(id: string, values: Record<string, unknown>) {
  // INSERT ... DO NOTHING never requests UPDATE permission on the immutable id.
  const created = await supabase
    .from('profiles')
    .upsert(
      { id, interests: [], favorite_subjects: [], ...values },
      { onConflict: 'id', ignoreDuplicates: true }
    );
  if (created.error) {
    throw created.error;
  }
  const saved = await supabase
    .from('profiles')
    .update(values)
    .eq('id', id)
    .select('id')
    .single();
  if (saved.error) {
    throw saved.error;
  }
}
