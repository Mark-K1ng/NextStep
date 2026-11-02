import { act, createElement } from 'react';
import { createRoot, type Root } from 'test-renderer';
import Questionnaire from './Questionnaire';
import type { Personalization } from '@/hooks/use-personalization';
let mockDocument: Personalization;
const mockPersist = jest.fn();
const mockReplace = jest.fn();
const mockRefetch = jest.fn();
jest.mock('react-native', () => ({
  Platform: { OS: 'android' },
  View: 'view',
  StyleSheet: { create: (styles: unknown) => styles },
}));
jest.mock('lucide-react-native', () => ({ Check: 'icon' }));
jest.mock('@/components/design', () => ({
  Screen: 'screen',
  Copy: 'text',
  Panel: 'panel',
  BackHeader: 'header',
}));
jest.mock('@/components', () => ({ Button: 'button' }));
jest.mock('@/components/motion', () => ({
  MotionPressable: 'choice',
  AnimatedProgress: 'progress',
}));
jest.mock('@/components/data-state', () => ({ DataState: 'data-state' }));
jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => require('@/theme/tokens').darkColors,
}));
jest.mock('@/hooks/use-app-router', () => ({
  useAppRouter: () => ({ replace: mockReplace }),
}));
jest.mock('@/hooks/use-personalization', () => ({
  usePersonalization: () => ({
    data: mockDocument,
    isFetching: false,
    isPending: false,
    isError: false,
    refetch: mockRefetch,
  }),
  persistPersonalization: (...args: unknown[]) => mockPersist(...args),
  personalizationKey: (id: string) => ['personalization', id, 1],
}));
jest.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({
    setQueryData: (_key: unknown, data: Personalization) => {
      mockDocument = data;
    },
    invalidateQueries: jest.fn().mockResolvedValue(undefined),
  }),
}));
let root: Root;
beforeEach(() => {
  jest.clearAllMocks();
  root = createRoot();
  mockDocument = {
    user_id: 'owner',
    version: 1,
    answers: { domains: ['technology'] },
    status: 'draft',
    cursor: 1,
    revision: 4,
    onboarding_required: true,
  };
  mockPersist.mockImplementation(async (current, answers, status, cursor) => ({
    ...current,
    answers,
    status,
    cursor,
    revision: current.revision + 1,
    onboarding_required: status === 'draft',
  }));
});
afterEach(async () => act(async () => root.unmount()));
async function mount() {
  await act(async () => root.render(createElement(Questionnaire)));
}
function button(label: string) {
  return root.container.queryAll(
    (node) => node.type === 'button' && node.props.children === label
  )[0];
}
it('resumes the stored question and skips without losing existing responses', async () => {
  await mount();
  expect(
    root.container.queryAll((node) => node.type === 'progress')[0].props.value
  ).toBe(2);
  await act(async () => button('Mai târziu').props.onPress());
  expect(mockPersist).toHaveBeenCalledWith(
    expect.objectContaining({ revision: 4 }),
    { domains: ['technology'] },
    'skipped',
    1
  );
  expect(mockReplace).toHaveBeenCalledWith('/_tabs/path');
});
it('keeps the current question and shows retry recovery on a failed save', async () => {
  await mount();
  mockPersist.mockRejectedValue(new Error('offline'));
  await act(async () => button('Continuă').props.onPress());
  expect(
    root.container.queryAll((node) => node.type === 'progress')[0].props.value
  ).toBe(2);
  expect(button('Reîncarcă răspunsurile')).toBeDefined();
  expect(mockReplace).not.toHaveBeenCalled();
});
it('finishes the final question and retains the versioned answers', async () => {
  mockDocument = { ...mockDocument, cursor: 5 };
  await mount();
  await act(async () => button('Vezi recomandările').props.onPress());
  expect(mockPersist).toHaveBeenCalledWith(
    expect.objectContaining({ version: 1 }),
    { domains: ['technology'] },
    'completed',
    5
  );
});
it('keeps its loaded revision if another device updates the shared query cache', async () => {
  await mount();
  mockDocument = {
    ...mockDocument,
    revision: 9,
    answers: { domains: ['arts'] },
  };
  await act(async () => root.render(createElement(Questionnaire)));
  await act(async () => button('Continuă').props.onPress());
  expect(mockPersist).toHaveBeenCalledWith(
    expect.objectContaining({ revision: 4 }),
    { domains: ['technology'] },
    'draft',
    2
  );
});
it('clears questionnaire responses without touching bookmark or progress services', async () => {
  await mount();
  await act(async () =>
    button('Șterge răspunsurile și continuă fără ele').props.onPress()
  );
  expect(mockPersist).toHaveBeenCalledWith(
    expect.objectContaining({ user_id: 'owner' }),
    {},
    'skipped',
    0
  );
});
