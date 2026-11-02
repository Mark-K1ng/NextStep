import { supabase } from '@/lib/supabase';
import { accountRequest } from '@/lib/account-request';
import type { Availability } from '@/types/tutoring';

export type TeacherStatus =
  | 'not_started'
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'suspended';
export interface AccountAccess {
  account_kind: 'student' | 'teacher';
  teacher_status: TeacherStatus;
  can_teach: boolean;
  application_reference: string | null;
  application_expires_at: string | null;
  application_received_at: string | null;
  review_reason: string | null;
}
const statuses: TeacherStatus[] = [
  'not_started',
  'draft',
  'submitted',
  'under_review',
  'approved',
  'rejected',
  'suspended',
];
export function parseAccountAccess(value: unknown): AccountAccess {
  if (!value || typeof value !== 'object') {
    throw new Error('Invalid account access');
  }
  const data = value as AccountAccess;
  if (
    !['student', 'teacher'].includes(data.account_kind) ||
    !statuses.includes(data.teacher_status) ||
    typeof data.can_teach !== 'boolean'
  ) {
    throw new Error('Invalid account access');
  }
  if (
    data.can_teach &&
    (data.account_kind !== 'teacher' || data.teacher_status !== 'approved')
  ) {
    throw new Error('Inconsistent account access');
  }
  return data;
}
export async function getAccountAccess(
  signal?: AbortSignal
): Promise<AccountAccess> {
  const request = supabase.rpc('get_account_access');
  const result = await (signal ? request.abortSignal(signal) : request);
  if (result.error) {
    throw result.error;
  }
  return parseAccountAccess(result.data);
}
export async function startTeacherApplication(): Promise<AccountAccess> {
  const result = await accountRequest((signal) =>
    supabase.rpc('start_teacher_application').abortSignal(signal)
  );
  if (result.error) {
    throw result.error;
  }
  return parseAccountAccess(result.data);
}
export async function updateTeacherAvailability(
  rows: Availability[]
): Promise<Availability[]> {
  const result = await accountRequest((signal) =>
    supabase
      .rpc('update_teacher_availability', { slots: rows })
      .abortSignal(signal)
  );
  if (result.error) {
    throw result.error;
  }
  return result.data as Availability[];
}
