import { act, createElement } from 'react';
import { createRoot, type Root } from 'test-renderer';
import Home from './home';
import { ro } from '@/i18n/ro';
let mockGoal: { name: string } | null;
let mockLoading = false;
let mockPersonalizedLoading = false;
let mockPersonalizedError = false;
let mockEmptyCourses = false;
let mockGapCourses = courses;
let mockGapLoading = false;
let mockStudentError = false;
const mockPush = jest.fn();
const mockNavigate = jest.fn();
const mockRetry = jest.fn();
const mockPersonalizedRetry = jest.fn();
const courses = [
  { id: 'first', title: 'First course', provider: 'Provider' },
  { id: 'second', title: 'Second course', provider: 'Provider' },
];
jest.mock('react-native', () => ({
  View: 'view',
  StyleSheet: { create: (styles: unknown) => styles },
}));
jest.mock('lucide-react-native', () => ({
  CircleUserRound: 'icon',
  Route: 'icon',
  Compass: 'icon',
  Bookmark: 'icon',
}));
jest.mock('@/components/design', () => ({
  Screen: 'screen',
  Copy: 'copy',
  Panel: 'panel',
  Row: 'row',
  Section: 'section',
  IconTile: 'icon-tile',
  GroupedList: 'group',
}));
jest.mock('@/components', () => ({ Button: 'button' }));
jest.mock('@/components/data-state', () => ({ DataState: 'data-state' }));
jest.mock('@/hooks/use-app-router', () => ({
  useAppRouter: () => ({ push: mockPush, navigate: mockNavigate }),
}));
jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => require('@/theme/tokens').darkColors,
}));
jest.mock('@/providers/saved', () => ({ useSaved: () => ({ items: [] }) }));
jest.mock('@/hooks/use-personalized-path', () => ({
  usePersonalizedPath: () => ({
    items: (mockEmptyCourses ? [] : courses).map((course) => ({
      id: course.id,
      type: 'course',
      name: course.title,
      reasons: [course.provider],
    })),
    loading: mockPersonalizedLoading,
    error: mockPersonalizedError,
    retry: mockPersonalizedRetry,
  }),
}));
jest.mock('@/hooks/use-student-data', () => ({
  useStudentData: () => ({
    profile: { display_name: 'Test student' },
    goal: mockGoal,
    gap: {
      steps: [
        { courses: mockGapCourses },
        { courses: mockGapCourses.slice(1) },
      ],
    },
    loading: mockLoading,
    gapLoading: mockGapLoading,
    error: mockStudentError,
    retry: mockRetry,
  }),
}));
let root: Root;
beforeEach(() => {
  jest.clearAllMocks();
  mockGoal = { name: 'Test career' };
  mockLoading = false;
  mockPersonalizedLoading = false;
  mockPersonalizedError = false;
  mockEmptyCourses = false;
  mockGapCourses = courses;
  mockGapLoading = false;
  mockStudentError = false;
  root = createRoot();
});
afterEach(async () => act(async () => root.unmount()));
it('keeps the next-step recommendation independent of the lower course section', async () => {
  mockGapCourses = [];
  await act(async () => root.render(createElement(Home)));
  const primary = root.container.queryAll(
    (node) =>
      node.type === 'button' && node.props.children === ro.visual.continueStep
  )[0];
  expect(primary).toBeDefined();
  await act(async () => primary.props.onPress());
  expect(mockPush).toHaveBeenLastCalledWith({
    pathname: '/course/[id]',
    params: { id: 'first' },
  });
});
it('restores the original course cards from career skill gaps even when exploration suggestions are empty', async () => {
  mockEmptyCourses = true;
  mockGapCourses = [
    {
      id: 'gap-first',
      title: 'Gap first course',
      provider: 'Original provider',
    },
    {
      id: 'gap-second',
      title: 'Gap second course',
      provider: 'Original provider',
    },
    {
      id: 'gap-third',
      title: 'Gap third course',
      provider: 'Original provider',
    },
  ];
  await act(async () => root.render(createElement(Home)));
  expect(
    root.container.queryAll(
      (node) =>
        node.type === 'section' &&
        node.props.title === ro.recommendations.recommendedCourses
    )
  ).toHaveLength(1);
  const rows = root.container.queryAll((node) => node.type === 'row');
  const savedIndex = rows.findIndex(
    (node) => node.props.title === ro.visual.saved
  );
  const courseIndex = rows.findIndex(
    (node) => node.props.title === 'Gap first course'
  );
  expect(courseIndex).toBeGreaterThan(savedIndex);
  expect(rows[courseIndex].props.subtitle).toBe('Original provider');
  expect(rows[courseIndex].props.icon).toBeUndefined();
  expect(
    rows.filter((node) => node.props.title === 'Gap third course')
  ).toHaveLength(0);
  await act(async () => rows[courseIndex].props.onPress());
  expect(mockPush).toHaveBeenLastCalledWith({
    pathname: '/course/[id]',
    params: { id: 'gap-first' },
  });
});
it('does not substitute generic exploration suggestions for failed career course recommendations', async () => {
  mockStudentError = true;
  mockGapCourses = [];
  await act(async () => root.render(createElement(Home)));
  expect(
    root.container.queryAll(
      (node) => node.type === 'row' && node.props.title === 'Second course'
    )
  ).toHaveLength(0);
  const state = root.container.queryAll(
    (node) => node.type === 'data-state'
  )[0];
  await act(async () => state.props.retry());
  expect(mockRetry).toHaveBeenCalledTimes(1);
});
it('keeps the leading recommended course distinct and opens the correct course from either group', async () => {
  await act(async () => root.render(createElement(Home)));
  const primary = root.container.queryAll(
    (node) =>
      node.type === 'button' && node.props.children === ro.visual.continueStep
  )[0];
  await act(async () => primary.props.onPress());
  expect(mockPush).toHaveBeenLastCalledWith({
    pathname: '/course/[id]',
    params: { id: 'first' },
  });
  const secondary = root.container.queryAll(
    (node) => node.type === 'row' && node.props.title === 'Second course'
  );
  expect(secondary).toHaveLength(1);
  await act(async () => secondary[0].props.onPress());
  expect(mockPush).toHaveBeenLastCalledWith({
    pathname: '/course/[id]',
    params: { id: 'second' },
  });
});
it('keeps first-use career discovery and one course recommendation without an icon', async () => {
  mockGoal = null;
  await act(async () => root.render(createElement(Home)));
  const start = root.container.queryAll(
    (node) =>
      node.type === 'button' &&
      node.props.children === ro.visual.recommendations
  )[0];
  await act(async () => start.props.onPress());
  expect(mockPush).toHaveBeenCalledWith('/_tabs/path');
  expect(
    root.container.queryAll(
      (node) =>
        node.type === 'row' &&
        ['First course', 'Second course'].includes(node.props.title)
    )
  ).toHaveLength(1);
});
it('preserves loading recovery', async () => {
  mockLoading = true;
  await act(async () => root.render(createElement(Home)));
  const state = root.container.queryAll(
    (node) => node.type === 'data-state'
  )[0];
  expect(state.props.loading).toBe(true);
  await act(async () => state.props.retry());
  expect(mockRetry).toHaveBeenCalledTimes(1);
});
it('prioritizes failed recommendation recovery over an unresolved bookmark load', async () => {
  mockGoal = null;
  mockPersonalizedError = true;
  mockPersonalizedLoading = true;
  await act(async () => root.render(createElement(Home)));
  const states = root.container.queryAll((node) => node.type === 'data-state');
  expect(states).toHaveLength(1);
  expect(states[0].props.error).toBe(true);
  expect(states[0].props.loading).not.toBe(true);
  await act(async () => states[0].props.retry());
  expect(mockPersonalizedRetry).toHaveBeenCalledTimes(1);
});
it('keeps a next action when a goal has no new course suggestions', async () => {
  mockGapCourses = [];
  mockEmptyCourses = true;
  await act(async () => root.render(createElement(Home)));
  const action = root.container.queryAll(
    (node) => node.type === 'button' && node.props.children === 'Vezi traseul'
  )[0];
  await act(async () => action.props.onPress());
  expect(mockPush).toHaveBeenCalledWith('/_tabs/path');
});
