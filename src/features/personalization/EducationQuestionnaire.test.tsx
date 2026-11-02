import { act, createElement } from 'react';
import { createRoot, type Root } from 'test-renderer';
import EducationQuestionnaire from './EducationQuestionnaire';
import QuestionnaireLibrary from './QuestionnaireLibrary';
import type { EducationDocument } from '../../../supabase/functions/_shared/education';
let mockDocument: EducationDocument;
const mockSave = jest.fn();
const mockReplace = jest.fn();
const mockPush = jest.fn();
const mockRefetch = jest.fn();
const mockRefresh = jest.fn();
let mockGrade = 'VIII';
jest.mock('react-native', () => ({
  Platform: { OS: 'android' },
  View: 'view',
  StyleSheet: { create: (styles: unknown) => styles },
}));
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: 'interests' }),
}));
jest.mock('lucide-react-native', () => ({
  CircleCheck: 'check',
  CircleDot: 'partial',
  CircleDashed: 'empty',
  Compass: 'icon',
  Users: 'icon',
  Sprout: 'icon',
  ListChecks: 'icon',
}));
jest.mock('@/components/design', () => ({
  Screen: 'screen',
  BackHeader: 'header',
  Copy: 'copy',
  Choice: 'choice',
  Panel: 'panel',
  Row: 'row',
  GroupedList: 'group',
}));
jest.mock('@/components', () => ({ Button: 'button' }));
jest.mock('@/components/data-state', () => ({ DataState: 'data-state' }));
jest.mock('@/hooks/use-app-router', () => ({
  useAppRouter: () => ({ replace: mockReplace, push: mockPush }),
}));
jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({ accentText: '#fff', textSecondary: '#aaa' }),
}));
jest.mock('@/hooks/use-profile', () => ({
  useProfileQuery: () => ({
    data: { grade_level: mockGrade },
    isPending: false,
    isError: false,
  }),
}));
jest.mock('@/hooks/use-education', () => ({
  useEducation: () => ({
    data: mockDocument,
    isPending: false,
    isError: false,
    refetch: mockRefetch,
  }),
  useRefreshEducation: () => mockRefresh,
}));
jest.mock('@/services/education', () => ({
  saveEducation: (...a: unknown[]) => mockSave(...a),
}));
jest.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({
    setQueryData: (_key: unknown, value: EducationDocument) => {
      mockDocument = value;
    },
  }),
}));
let root: Root;
beforeEach(() => {
  jest.clearAllMocks();
  root = createRoot();
  mockGrade = 'VIII';
  mockDocument = {
    user_id: 'owner',
    revision: 4,
    version: 1,
    responses: {
      interests: {
        answers: { domains: ['technology'] },
        skipped: [],
        cursor: 1,
        status: 'draft',
        attempt: 1,
      },
    },
    guest_import_id: null,
  };
  mockSave.mockImplementation(async (document, id, response) => ({
    ...document,
    revision: document.revision + 1,
    responses: { ...document.responses, [id]: response },
  }));
});
afterEach(async () => act(async () => root.unmount()));
const button = (label: string) =>
  root.container.queryAll(
    (n) => n.type === 'button' && n.props.children === label
  )[0];
it('resumes and explicitly skips a question without inventing an answer', async () => {
  await act(async () => root.render(createElement(EducationQuestionnaire)));
  await act(async () => button('Sari întrebarea').props.onPress());
  expect(mockSave).toHaveBeenCalledWith(
    expect.objectContaining({ revision: 4 }),
    'interests',
    expect.objectContaining({
      answers: { domains: ['technology'] },
      skipped: ['subjects'],
      cursor: 2,
    })
  );
});
it('keeps a loaded revision when another device refreshes the cache and displays failure recovery', async () => {
  await act(async () => root.render(createElement(EducationQuestionnaire)));
  mockDocument = { ...mockDocument, revision: 20 };
  await act(async () => root.render(createElement(EducationQuestionnaire)));
  mockSave.mockRejectedValue(new Error('conflict'));
  await act(async () => button('Sari întrebarea').props.onPress());
  expect(mockSave.mock.calls[0][0].revision).toBe(4);
  expect(button('Reîncarcă răspunsurile')).toBeDefined();
  expect(mockReplace).not.toHaveBeenCalled();
});
it('finishes only after every applicable question was answered or skipped', async () => {
  mockDocument.responses.interests = {
    ...mockDocument.responses.interests,
    skipped: ['subjects'],
    cursor: 2,
  };
  await act(async () => root.render(createElement(EducationQuestionnaire)));
  await act(async () => button('Finalizează chestionarul').props.onPress());
  expect(mockSave.mock.calls[0][2]).toMatchObject({
    status: 'completed',
    skipped: ['subjects', 'activities'],
  });
  expect(mockReplace).toHaveBeenCalledWith('/personalize');
});
it('renders distinct not-started, partial and complete library states with a resume destination', async () => {
  mockDocument.responses.work = {
    answers: {},
    skipped: ['environment', 'collaboration', 'format'],
    cursor: 2,
    status: 'completed',
    attempt: 1,
  };
  await act(async () => root.render(createElement(QuestionnaireLibrary)));
  const rows = root.container.queryAll((n) => n.type === 'row');
  expect(rows).toHaveLength(4);
  expect(rows[0].props.subtitle).toContain('În progres · 1/3');
  expect(rows[1].props.subtitle).toContain('Finalizat');
  expect(rows[2].props.subtitle).toContain('Neînceput');
  expect(
    root.container
      .queryAll((node) => node.type === 'button')
      .every((node) => typeof node.props.children === 'string')
  ).toBe(true);
  await act(async () => rows[0].props.onPress());
  expect(mockPush).toHaveBeenCalledWith({
    pathname: '/questionnaire',
    params: { id: 'interests' },
  });
});
it('keeps clearing behind management and confirmation, then preserves other answers', async () => {
  await act(async () => root.render(createElement(QuestionnaireLibrary)));
  const button = (label: string) =>
    root.container.queryAll(
      (n) => n.type === 'button' && n.props.children === label
    )[0];
  expect(button('Șterge: Interese și curiozități')).toBeUndefined();
  await act(async () => button('Gestionează răspunsurile').props.onPress());
  await act(async () =>
    button('Șterge: Interese și curiozități').props.onPress()
  );
  expect(mockSave).not.toHaveBeenCalled();
  await act(async () =>
    button('Confirmă ștergerea răspunsurilor').props.onPress()
  );
  expect(mockSave).toHaveBeenCalledWith(
    expect.objectContaining({ user_id: 'owner', revision: 4 }),
    'interests',
    expect.objectContaining({ answers: {}, skipped: [] }),
    true
  );
});
it('does not expose old-account answers while an account change is being initialized', async () => {
  await act(async () => root.render(createElement(EducationQuestionnaire)));
  mockDocument = { ...mockDocument, user_id: 'other', responses: {} };
  await act(async () => root.render(createElement(EducationQuestionnaire)));
  expect(
    root.container.queryAll((n) => n.type === 'choice' && n.props.selected)
  ).toHaveLength(0);
});
