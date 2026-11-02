import { act, createElement } from 'react';
import { createRoot, type Root } from 'test-renderer';
import GuestIntake from './GuestIntake';
const mockRead = jest.fn();
const mockWrite = jest.fn();
const mockClear = jest.fn();
const mockPush = jest.fn();
jest.mock('react-native', () => ({
  View: 'view',
  StyleSheet: { create: (styles: unknown) => styles },
}));
jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({ accent: '#fff', border: '#555', textSecondary: '#aaa' }),
}));
jest.mock('@/components/design', () => ({
  Screen: 'screen',
  Copy: 'copy',
  Choice: 'choice',
  Panel: 'panel',
  BackHeader: 'header',
}));
jest.mock('@/components', () => ({ Button: 'button' }));
jest.mock('@/components/profile-selectors', () => ({ GradeSelect: 'grade' }));
jest.mock('@/hooks/use-app-router', () => ({
  useAppRouter: () => ({ push: mockPush }),
}));
jest.mock('@/services/education', () => ({
  readGuestIntake: () => mockRead(),
  writeGuestIntake: (...a: unknown[]) => mockWrite(...a),
  clearGuestIntake: () => mockClear(),
  newGuestIntake: () => ({
    id: 'draft',
    grade: '',
    cursor: 0,
    preview: false,
    responses: {},
  }),
}));
let root: Root;
beforeEach(() => {
  jest.clearAllMocks();
  root = createRoot();
  mockRead.mockResolvedValue({
    id: 'draft',
    grade: 'VIII',
    cursor: 0,
    preview: false,
    responses: {},
  });
  mockWrite.mockResolvedValue(undefined);
});
afterEach(async () => act(async () => root.unmount()));
it('does not show a saved selection or advance when local persistence fails', async () => {
  await act(async () => root.render(createElement(GuestIntake)));
  mockWrite.mockRejectedValue(new Error('disk failure'));
  const choice = () =>
    root.container.queryAll(
      (n) => n.type === 'choice' && n.props.children === 'Tehnologie'
    )[0];
  await act(async () => choice().props.onPress());
  expect(choice().props.selected).toBe(false);
  expect(
    root.container.queryAll(
      (n) => n.type === 'copy' && n.props.accessibilityRole === 'alert'
    )
  ).toHaveLength(1);
  expect(mockPush).not.toHaveBeenCalled();
});
it('resumes the preview and passes only the draft binding, grade and Bihor to signup', async () => {
  mockRead.mockResolvedValue({
    id: 'draft',
    grade: 'VIII',
    cursor: 2,
    preview: true,
    responses: { interests: { domains: ['technology'] } },
  });
  await act(async () => root.render(createElement(GuestIntake)));
  expect(mockPush).not.toHaveBeenCalled();
  const button = root.container.queryAll(
    (n) =>
      n.type === 'button' &&
      n.props.children === 'Creează contul și păstrează răspunsurile'
  )[0];
  await act(async () => button.props.onPress());
  expect(mockPush).toHaveBeenCalledWith({
    pathname: '/(auth)/register',
    params: { gradeLevel: 'VIII', county: 'Bihor', intakeId: 'draft' },
  });
});
it('offers recovery for a malformed local draft without silently discarding it', async () => {
  mockRead.mockRejectedValue(new Error('malformed draft'));
  await act(async () => root.render(createElement(GuestIntake)));
  expect(mockClear).not.toHaveBeenCalled();
  const reset = root.container.queryAll(
    (n) => n.type === 'button' && n.props.children === 'Începe din nou'
  )[0];
  await act(async () => reset.props.onPress());
  expect(mockClear).toHaveBeenCalled();
  expect(root.container.queryAll((n) => n.type === 'grade')).toHaveLength(1);
});
