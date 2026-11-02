import { supabase } from '@/lib/supabase';
import { loadGapAnalysis } from './gap-analysis';
jest.mock('@/lib/supabase', () => ({ supabase: { from: jest.fn() } }));
function chain(data: unknown, error: Error | null = null) {
  const query = {
    select: jest.fn(),
    eq: jest.fn(),
    in: jest.fn(),
    order: jest.fn(),
    range: jest.fn(),
    abortSignal: jest.fn(),
  };
  for (const method of ['select', 'eq', 'in', 'order', 'range'] as const)
    query[method].mockReturnValue(query);
  query.abortSignal.mockResolvedValue({ data, error });
  return query;
}
function setup(level = 2, error: Error | null = null) {
  const users = chain([{ skill_id: 'a', level, skills: { name: 'A' } }], error);
  const requirements = chain([
    { skill_id: 'a', importance: 3, skills: { name: 'A' } },
  ]);
  const courses = chain([
    {
      id: 'course',
      title: 'Course',
      provider: 'Provider',
      url: 'https://example.com',
      language: 'română',
      is_free: true,
      level: 'beginner',
      course_skills: [{ skill_id: 'a', depth: 3, skills: { name: 'A' } }],
    },
  ]);
  jest
    .mocked(supabase.from)
    .mockReturnValueOnce(users as never)
    .mockReturnValueOnce(requirements as never)
    .mockReturnValueOnce(courses as never);
  return { users, requirements, courses };
}
afterEach(() => jest.resetAllMocks());
it('fetches only courses for partial or missing skill IDs and preserves real mappings', async () => {
  const { courses } = setup();
  const signal = new AbortController().signal;
  const result = await loadGapAnalysis('user', 'career', signal);
  expect(courses.in).toHaveBeenCalledWith('matched.skill_id', ['a']);
  expect(courses.abortSignal).toHaveBeenCalledWith(signal);
  expect(result.partial[0].id).toBe('a');
  expect(result.steps[0].courses[0].id).toBe('course');
});
it('skips the course request when every requirement is covered', async () => {
  setup(3);
  const result = await loadGapAnalysis('user', 'career');
  expect(supabase.from).toHaveBeenCalledTimes(2);
  expect(result.covered[0].id).toBe('a');
  expect(result.steps).toEqual([]);
});
it('stops on a failed prerequisite query instead of loading unrelated courses', async () => {
  setup(0, new Error('Permission denied'));
  await expect(loadGapAnalysis('user', 'career')).rejects.toThrow(
    'Permission denied'
  );
  expect(supabase.from).toHaveBeenCalledTimes(2);
});

it('continues bounded course pages without losing matching recommendations', async () => {
  const { courses } = setup();
  const course = {
    title: 'Course',
    provider: 'Provider',
    url: 'https://example.com',
    language: 'română',
    is_free: true,
    level: 'beginner',
    course_skills: [{ skill_id: 'a', depth: 3, skills: { name: 'A' } }],
  };
  courses.abortSignal.mockResolvedValue({
    data: Array.from({ length: 200 }, (_, i) => ({
      ...course,
      id: `course-${i}`,
    })),
    error: null,
  });
  const tail = chain([{ ...course, id: 'last-course' }]);
  jest.mocked(supabase.from).mockReturnValueOnce(tail as never);
  const result = await loadGapAnalysis('user', 'career');
  expect(courses.range).toHaveBeenCalledWith(0, 199);
  expect(tail.range).toHaveBeenCalledWith(200, 399);
  expect(result.steps[0].courses).toHaveLength(201);
  expect(
    result.steps[0].courses.some((item) => item.id === 'last-course')
  ).toBe(true);
});
