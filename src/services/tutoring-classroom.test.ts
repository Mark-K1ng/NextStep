import { classroomUrl } from './tutoring-classroom';
import type { Lesson } from '@/types/tutoring';
jest.mock('@/lib/open-external-url', () => ({ openExternalUrl: jest.fn() }));
const lesson = {
  classroom_status: 'active',
  payment_status: 'paid',
  classroom_url: 'https://classroom.google.com/c/real',
} as Lesson;
it('only opens a real Google Classroom for a paid relationship', () => {
  expect(classroomUrl(lesson)).toBe(lesson.classroom_url);
});
it.each([
  { payment_status: 'unpaid' },
  { payment_status: 'refunded' },
  { classroom_status: 'pending' },
  { classroom_url: 'https://classroom.google.com.attacker.test/c/test' },
  { classroom_url: 'javascript:alert(1)' },
  { classroom_url: null },
])('rejects inaccessible classrooms %j', (override) => {
  expect(classroomUrl({ ...lesson, ...override } as Lesson)).toBeNull();
});
