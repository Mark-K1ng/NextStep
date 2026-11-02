jest.mock('react-native-reanimated', () => ({}));
jest.mock('@/constants/education-rollout', () => ({
  EDUCATION_ROUTES_ENABLED: false,
}));
jest.mock('./EducationalRoute', () => ({ EducationalRoute: () => null }));
jest.mock('react-native-worklets', () => ({}));
import { act, createElement } from 'react';
import { createRoot, type Root } from 'test-renderer';
import Path from './Path';
import { supabase } from '@/lib/supabase';
jest.mock('@/providers/auth', () => ({
  useSession: () => ({ session: { user: { id: 'owner' } } }),
}));
jest.mock('@/lib/supabase', () => ({ supabase: { rpc: jest.fn() } }));
jest.mock('./PersonalizedSuggestions', () => ({
  PersonalizedSuggestions: () => null,
}));
import { ro } from '@/i18n/ro';
import type { PathStep } from '@/types/models';

let mockSteps: PathStep[];
const mockPush = jest.fn();
const mockUpdate = jest.fn();
const mockInvalidate = jest.fn();
const mockMessage = jest.fn();
let mockError = false;
jest.mock('react-native', () => ({
  View: 'view',
  StyleSheet: { create: (styles: unknown) => styles },
}));
jest.mock('lucide-react-native', () => ({
  Target: 'icon',
  Check: 'icon',
  ChevronDown: 'icon',
  Trash2: 'icon',
}));
jest.mock('@/components/design', () => ({
  Screen: 'screen',
  Copy: 'copy',
  Panel: 'panel',
  Row: 'row',
  GroupedList: 'group',
  Section: 'section',
}));
jest.mock('@/components', () => ({ Button: 'button' }));
jest.mock('@/components/motion', () => ({
  AnimatedProgress: 'progress',
  MotionLayout: 'layout',
  MotionContent: 'content',
  MotionChevron: 'chevron',
  MotionPressable: 'pressable',
}));
jest.mock('@/components/data-state', () => ({ DataState: 'data-state' }));
jest.mock('@/hooks/use-app-router', () => ({
  useAppRouter: () => ({ push: mockPush }),
}));
jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => require('@/theme/tokens').darkColors,
}));
jest.mock('@/hooks/use-student-data', () => ({
  useStudentData: () => ({
    goal: { name: 'Test goal' },
    steps: mockSteps,
    loading: false,
    pathLoading: false,
    error: mockError,
    retry: jest.fn(),
  }),
}));
jest.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: mockInvalidate }),
}));
jest.mock('@/services/progress', () => ({
  updateProgress: (...args: unknown[]) => mockUpdate(...args),
}));
jest.mock('@/lib/show-message', () => ({
  showMessage: (...args: unknown[]) => mockMessage(...args),
}));
let root: Root;
const headers = () =>
  root.container.queryAll(
    (node) =>
      node.type === 'pressable' &&
      typeof node.props.accessibilityState?.expanded === 'boolean'
  );
const removeAction = () =>
  root.container.queryAll(
    (node) =>
      node.type === 'pressable' &&
      node.props.accessibilityLabel === 'Șterge pasul: Test skill'
  )[0];
const action = (label: string) =>
  root.container.queryAll(
    (node) => node.type === 'button' && node.props.children === label
  )[0];
beforeEach(() => {
  jest.clearAllMocks();
  mockSteps = [
    {
      id: 'school-step',
      type: 'school',
      refId: 'school-id',
      name: 'Test school',
      status: 'in_progress',
    },
    {
      id: 'course-step',
      type: 'course',
      refId: 'course-id',
      title: 'Test course',
      status: 'not_started',
    },
    {
      id: 'skill-step',
      type: 'skill',
      refId: 'skill-id',
      name: 'Test skill',
      status: 'completed',
    },
  ];
  mockError = false;
  mockUpdate.mockResolvedValue(undefined);
  mockInvalidate.mockResolvedValue(undefined);
  jest.mocked(supabase.rpc).mockReturnValue({
    abortSignal: jest.fn().mockResolvedValue({ error: null }),
  } as never);
  root = createRoot();
});
afterEach(async () => act(async () => root.unmount()));
const renderPath = async () =>
  act(async () => root.render(createElement(Path)));

it('shows every step with only the first unfinished step expanded and keeps true progress', async () => {
  await renderPath();
  expect(headers()).toHaveLength(3);
  expect(
    headers().map((node) => node.props.accessibilityState.expanded)
  ).toEqual([true, false, false]);
  expect(action(ro.refinement.viewPathStep.school)).toBeDefined();
  expect(action(ro.refinement.viewPathStep.course)).toBeUndefined();
  expect(
    root.container.queryAll((node) => node.type === 'progress')[0].props
  ).toMatchObject({ value: 1, total: 3 });
  expect(mockUpdate).not.toHaveBeenCalled();
});

it('opens the correct school and course routes, with accurate action labels', async () => {
  await renderPath();
  await act(async () =>
    action(ro.refinement.viewPathStep.school).props.onPress()
  );
  expect(mockPush).toHaveBeenLastCalledWith({
    pathname: '/school/[id]',
    params: { id: 'school-id' },
  });
  await act(async () => headers()[1].props.onPress());
  expect(
    headers().map((node) => node.props.accessibilityState.expanded)
  ).toEqual([false, true, false]);
  await act(async () =>
    action(ro.refinement.viewPathStep.course).props.onPress()
  );
  expect(mockPush).toHaveBeenLastCalledWith({
    pathname: '/course/[id]',
    params: { id: 'course-id' },
  });
  await act(async () => headers()[1].props.onPress());
  expect(action(ro.visual.markDone)).toBeUndefined();
  expect(mockUpdate).not.toHaveBeenCalled();
});

it('lets completed steps open their details without offering completion again', async () => {
  await renderPath();
  await act(async () => headers()[2].props.onPress());
  expect(action(ro.visual.markDone)).toBeUndefined();
  await act(async () =>
    action(ro.refinement.viewPathStep.skill).props.onPress()
  );
  expect(mockPush).toHaveBeenLastCalledWith({
    pathname: '/skill/[id]',
    params: { id: 'skill-id' },
  });
});
it('lets the owner delete a completed step through the account-bound removal action', async () => {
  await renderPath();
  await act(async () => headers()[2].props.onPress());
  expect(removeAction()).toBeDefined();
  await act(async () => removeAction().props.onPress());
  expect(supabase.rpc).toHaveBeenCalledWith('remove_path_step', {
    step_id: 'skill-step',
    expected_user: 'owner',
  });
  expect(mockInvalidate).toHaveBeenCalledWith({ queryKey: ['student'] });
  expect(mockInvalidate).toHaveBeenCalledWith({
    queryKey: ['personalized-path'],
  });
  expect(mockUpdate).not.toHaveBeenCalled();
});
it('keeps a completed step when deletion fails and allows retry', async () => {
  jest.mocked(supabase.rpc).mockReturnValue({
    abortSignal: jest.fn().mockResolvedValue({ error: new Error('offline') }),
  } as never);
  await renderPath();
  await act(async () => headers()[2].props.onPress());
  await act(async () => removeAction().props.onPress());
  expect(mockMessage).toHaveBeenCalledWith(ro.errors.serverError);
  expect(mockSteps[2].status).toBe('completed');
  expect(removeAction().props.disabled).toBe(false);
});

it('advances disclosure only after the mocked progress service confirms completion', async () => {
  mockUpdate.mockImplementation(async () => {
    mockSteps = mockSteps.map((step) =>
      step.id === 'school-step' ? { ...step, status: 'completed' } : step
    );
  });
  await renderPath();
  await act(async () => action(ro.visual.markDone).props.onPress());
  expect(mockUpdate).toHaveBeenCalledWith('school-step', 'completed');
  // Publish the refreshed query fixture; the real query client notifies subscribers.
  await renderPath();
  expect(
    headers().map((node) => node.props.accessibilityState.expanded)
  ).toEqual([false, true, false]);
});

it('preserves progress and the expanded step when the mocked completion fails', async () => {
  mockUpdate.mockRejectedValue(new Error('offline'));
  await renderPath();
  await act(async () => action(ro.visual.markDone).props.onPress());
  expect(mockMessage).toHaveBeenCalledWith(ro.errors.serverError);
  expect(headers()[0].props.accessibilityState.expanded).toBe(true);
  expect(action(ro.visual.markDone).props.loading).toBe(false);
  expect(mockSteps[0].status).toBe('in_progress');
});

it('blocks a second completion while pending and preserves a newly selected step', async () => {
  let resolveUpdate!: () => void;
  mockUpdate.mockImplementation(
    () =>
      new Promise<void>((resolve) => {
        resolveUpdate = resolve;
      })
  );
  await renderPath();
  await act(async () => {
    action(ro.visual.markDone).props.onPress();
  });
  expect(action(ro.visual.markDone).props.loading).toBe(true);
  await act(async () => headers()[1].props.onPress());
  expect(action(ro.visual.markDone).props.disabled).toBe(true);
  expect(action(ro.visual.markDone).props.loading).toBe(false);
  await act(async () => resolveUpdate());
  expect(headers()[1].props.accessibilityState.expanded).toBe(true);
  expect(mockUpdate).toHaveBeenCalledTimes(1);
});

it('retains loading/error recovery and an actionable empty path', async () => {
  mockError = true;
  await renderPath();
  expect(
    root.container.queryAll((node) => node.type === 'data-state')[0].props.error
  ).toBe(true);
  mockError = false;
  mockSteps = [];
  await renderPath();
  expect(headers()).toHaveLength(0);
  expect(
    root.container.queryAll((node) => node.type === 'progress')
  ).toHaveLength(0);
  await act(async () => action(ro.visual.alternatives).props.onPress());
  expect(mockPush).toHaveBeenCalledWith('/_tabs/explore');
});
