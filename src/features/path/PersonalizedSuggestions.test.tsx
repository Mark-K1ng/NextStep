import { act, createElement } from 'react';
import { createRoot, type Root } from 'test-renderer';
import { PersonalizedSuggestions } from './PersonalizedSuggestions';

const mockDecide = jest.fn();
const mockOpen = jest.fn();
const mockPush = jest.fn();
const mockToast = jest.fn();
const mockInvalidate = jest.fn();
const mockItems = [
  {
    id: 'course-id',
    type: 'course',
    name: 'Curs potrivit',
    key: 'course:course-id',
    reasons: ['Motiv verificat.', 'Pregătire de verificat la furnizor.'],
  },
  {
    id: 'career-id',
    type: 'career',
    name: 'Carieră posibilă',
    key: 'career:career-id',
    reasons: ['Domeniu ales de tine.'],
  },
];
jest.mock('react-native', () => ({
  View: 'view',
  Platform: { OS: 'android' },
  StyleSheet: { create: (styles: unknown) => styles },
}));
jest.mock('@/components/design', () => ({
  Screen: 'screen',
  Copy: 'copy',
  Panel: 'panel',
  BackHeader: 'back-header',
  Row: 'row',
  Section: 'section',
}));
jest.mock('@/components', () => ({ Button: 'button' }));
jest.mock('@/components/data-state', () => ({ DataState: 'data-state' }));
jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => require('@/theme/tokens').darkColors,
}));
jest.mock('@/hooks/use-app-router', () => ({
  useAppRouter: () => ({ push: mockPush }),
}));
jest.mock('@/hooks/use-personalized-path', () => ({
  usePersonalizedPath: () => ({
    userId: 'owner',
    items: mockItems,
    notices: [],
    hasDismissed: false,
    loading: false,
    error: false,
  }),
}));
jest.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: mockInvalidate }),
}));
jest.mock('@/services/personalized-path', () => ({
  decideRecommendation: (...args: unknown[]) => mockDecide(...args),
}));
jest.mock('@/lib/option-navigation', () => ({
  openOption: (...args: unknown[]) => mockOpen(...args),
}));
jest.mock('@/lib/supabase', () => ({ supabase: {} }));
jest.mock('@/providers/toast', () => ({ useToast: () => mockToast }));

let root: Root;
const action = (label: string) =>
  root.container.queryAll(
    (node) => node.type === 'button' && node.props.children === label
  )[0];
beforeEach(() => {
  jest.clearAllMocks();
  mockDecide.mockResolvedValue(undefined);
  mockInvalidate.mockResolvedValue(undefined);
  root = createRoot();
});
afterEach(async () => act(async () => root.unmount()));

it('opens details from the disclosure row and preserves every recommendation reason', async () => {
  await act(async () => root.render(createElement(PersonalizedSuggestions)));
  const course = root.container.queryAll(
    (node) => node.type === 'row' && node.props.title === 'Curs potrivit'
  )[0];
  await act(async () => course.props.onPress());
  expect(mockOpen).toHaveBeenCalledWith(expect.anything(), {
    id: 'course-id',
    type: 'courses',
  });
  expect(mockDecide).not.toHaveBeenCalled();
  expect(
    root.container.queryAll(
      (node) =>
        node.type === 'copy' &&
        node.props.children === mockItems[0].reasons.join(' ')
    )
  ).toHaveLength(1);
});

it('keeps explicit account-backed path and goal acceptance', async () => {
  await act(async () => root.render(createElement(PersonalizedSuggestions)));
  await act(async () => action('Adaugă în Traseu').props.onPress());
  expect(mockDecide).toHaveBeenCalledWith(
    'owner',
    'course',
    'course-id',
    'accepted'
  );
  await act(async () =>
    action('Alege obiectiv: Carieră posibilă').props.onPress()
  );
  expect(mockDecide).toHaveBeenLastCalledWith(
    'owner',
    'career',
    'career-id',
    'accepted'
  );
  expect(mockToast).toHaveBeenLastCalledWith('Obiectiv actualizat');
});

it('keeps dismissal separate and reports a failed write without a success toast', async () => {
  mockDecide.mockRejectedValue(new Error('offline'));
  await act(async () => root.render(createElement(PersonalizedSuggestions)));
  await act(async () => action('Nu mi se potrivește').props.onPress());
  expect(mockDecide).toHaveBeenCalledWith(
    'owner',
    'course',
    'course-id',
    'dismissed'
  );
  expect(mockToast).not.toHaveBeenCalled();
  expect(
    root.container.queryAll(
      (node) => node.type === 'copy' && node.props.accessibilityRole === 'alert'
    )
  ).toHaveLength(1);
});
