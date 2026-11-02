import { openExternalUrl } from '@/lib/open-external-url';
import type { Lesson } from '@/types/tutoring';

// The backend only projects classroom links for an authorized, paid relationship.
// Future Google API operations belong in a server integration, never in screens.
export function classroomUrl(lesson: Lesson): string | null {
  if (
    lesson.classroom_status !== 'active' ||
    !['paid', 'partially_refunded'].includes(lesson.payment_status) ||
    !lesson.classroom_url
  ) {
    return null;
  }
  try {
    const url = new URL(lesson.classroom_url);
    return url.protocol === 'https:' && url.hostname === 'classroom.google.com'
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}
export async function openClassroom(lesson: Lesson) {
  const url = classroomUrl(lesson);
  if (url) {
    await openExternalUrl(url);
  }
}
