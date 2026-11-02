import { supabase } from '@/lib/supabase';
import type {
  Tutor,
  TutorApplication,
  Lesson,
  TutorReview,
} from '@/types/tutoring';

export const TUTOR_PAGE_SIZE = 20;
async function rpc<T>(
  name: string,
  args = {},
  signal?: AbortSignal
): Promise<T> {
  let request = supabase.rpc(name, args);
  if (signal) {
    request = request.abortSignal(signal);
  }
  const { data, error } = await request;
  if (error) {
    throw error;
  }
  return data as T;
}
export async function discoverTutors(
  search: string,
  subject: string,
  page: number,
  signal?: AbortSignal
) {
  const rows = await rpc<Tutor[]>(
    'tutoring_discover',
    {
      p_search: search.trim().slice(0, 100),
      p_subject: subject,
      p_offset: page * TUTOR_PAGE_SIZE,
      p_limit: TUTOR_PAGE_SIZE + 1,
    },
    signal
  );
  return {
    items: rows.slice(0, TUTOR_PAGE_SIZE),
    more: rows.length > TUTOR_PAGE_SIZE,
    page,
  };
}
export async function loadTutor(id: string, signal?: AbortSignal) {
  const rows = await rpc<Tutor[]>('tutoring_discover', { p_id: id }, signal);
  return rows[0] ?? null;
}
export async function loadSubjects(signal?: AbortSignal) {
  let request = supabase.from('tutoring_subjects').select('name').order('name');
  if (signal) {
    request = request.abortSignal(signal);
  }
  const { data, error } = await request;
  if (error) {
    throw error;
  }
  return (data ?? []).map((row: { name: string }) => row.name);
}
export const loadApplication = (signal?: AbortSignal) =>
  rpc<TutorApplication | null>('tutoring_my_application', {}, signal);
export const saveApplication = (
  data: Omit<TutorApplication, 'id' | 'status' | 'connect_status'>,
  submit: boolean
) =>
  rpc<string>('tutoring_save_application', { p_data: data, p_submit: submit });
export const loadSlots = (id: string, signal?: AbortSignal) =>
  rpc<{ starts_at: string }[]>('tutoring_slots', { p_tutor: id }, signal);
export async function loadLessons(
  teacher: boolean,
  page: number,
  signal?: AbortSignal
) {
  const rows = await rpc<Lesson[]>(
    'tutoring_lessons',
    { p_teacher: teacher, p_offset: page * TUTOR_PAGE_SIZE },
    signal
  );
  return {
    items: rows.slice(0, TUTOR_PAGE_SIZE),
    more: rows.length > TUTOR_PAGE_SIZE,
    page,
  };
}
export const loadReviews = (id: string, page: number, signal?: AbortSignal) =>
  rpc<TutorReview[]>(
    'tutoring_reviews',
    { p_tutor: id, p_offset: page * 20 },
    signal
  );
export const reviewLesson = (id: string, rating: number, comment: string) =>
  rpc<void>('tutoring_review', {
    p_booking: id,
    p_rating: rating,
    p_comment: comment,
  });
export const completeLesson = (id: string) =>
  rpc<void>('tutoring_complete', { p_booking: id });
export async function tutoringPayment(
  body: Record<string, unknown>
): Promise<{ url: string; booking_id?: string }> {
  const { data, error } = await supabase.functions.invoke('tutoring-payments', {
    body,
  });
  if (error || !data?.url) {
    throw new Error(
      'Plățile nu sunt disponibile. Încearcă din nou mai târziu.'
    );
  }
  const url = new URL(data.url);
  if (
    url.protocol !== 'https:' ||
    !['checkout.stripe.com', 'connect.stripe.com'].includes(url.hostname)
  ) {
    throw new Error('Link de plată indisponibil.');
  }
  return data;
}
