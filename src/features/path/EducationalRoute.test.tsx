import { act, createElement } from 'react';
import { createRoot, type Root } from 'test-renderer';
import { EducationalRoute } from './EducationalRoute';
const mockSave = jest.fn();
const mockRefresh = jest.fn();
const mockDecide = jest.fn();
let mockData: any;
jest.mock('@/components/design', () => ({
  Copy: 'copy',
  Panel: 'panel',
  Row: 'row',
  GroupedList: 'group',
  Section: 'section',
}));
jest.mock('@/components', () => ({ Button: 'button' }));
jest.mock('@/components/data-state', () => ({ DataState: 'data-state' }));
jest.mock('lucide-react-native', () => ({
  Compass: 'icon',
  Check: 'icon',
  BookOpen: 'icon',
}));
jest.mock('@/providers/auth', () => ({
  useSession: () => ({ session: { user: { id: 'owner' } } }),
}));
jest.mock('@/hooks/use-app-router', () => ({
  useAppRouter: () => ({ push: jest.fn() }),
}));
jest.mock('@/hooks/use-education', () => ({
  useEducationRoute: () => ({
    data: mockData,
    isError: false,
    isPending: false,
  }),
  useRefreshEducation: () => mockRefresh,
}));
jest.mock('@/services/education', () => ({
  saveExplorationActivity: (...args: unknown[]) => mockSave(...args),
}));
jest.mock('@/services/personalized-path', () => ({
  decideRecommendation: (...args: unknown[]) => mockDecide(...args),
}));
jest.mock('@/lib/option-navigation', () => ({ openOption: jest.fn() }));
let root: Root;
beforeEach(() => {
  jest.clearAllMocks();
  root = createRoot();
  mockData = {
    context: 'Explorează în Bihor',
    activities: [],
    notices: [],
    directions: [
      {
        id: 'technology',
        name: 'Tehnologie',
        reasons: ['Ai ales acest domeniu.'],
        activity: {
          id: 'technology:try',
          directionId: 'technology',
          title: 'Încearcă',
          text: 'Un exercițiu practic.',
          minutes: 10,
        },
        options: [
          {
            id: 'course',
            key: 'course:course',
            name: 'Curs introductiv',
            type: 'course',
            reasons: ['Legătură verificată.'],
          },
        ],
      },
    ],
  };
});
afterEach(async () => act(async () => root.unmount()));
const button = (name: string) =>
  root.container.queryAll(
    (n) => n.type === 'button' && n.props.children === name
  )[0];
it('requires a student choice and supplies native-safe labels for all buttons', async () => {
  await act(async () => root.render(createElement(EducationalRoute)));
  expect(mockSave).not.toHaveBeenCalled();
  expect(mockDecide).not.toHaveBeenCalled();
  expect(
    root.container
      .queryAll((n) => n.type === 'button')
      .every((n) => typeof n.props.children === 'string')
  ).toBe(true);
  await act(async () => button('Adaugă experiența în traseu').props.onPress());
  expect(mockSave).toHaveBeenCalledWith(
    'owner',
    mockData.directions[0].activity,
    'accepted',
    null,
    -1
  );
  expect(mockRefresh).toHaveBeenCalled();
});
it('does not rewrite accepted work when new suggestions arrive', async () => {
  const original = {
    ...mockData.directions[0].activity,
    text: 'Original accepted exercise',
  };
  mockData.activities = [
    {
      activity_id: original.id,
      direction_id: 'technology',
      status: 'completed',
      reflection: 'more',
      revision: 2,
      proposal: original,
    },
  ];
  await act(async () => root.render(createElement(EducationalRoute)));
  mockData = {
    ...mockData,
    directions: [
      {
        ...mockData.directions[0],
        activity: { ...original, text: 'Changed suggestion' },
      },
    ],
  };
  await act(async () => root.render(createElement(EducationalRoute)));
  expect(
    root.container.queryAll(
      (n) => n.type === 'copy' && n.props.children === original.text
    )
  ).toHaveLength(1);
  expect(mockSave).not.toHaveBeenCalled();
});
it('retains the chosen proposal and displays retry recovery when acceptance fails', async () => {
  mockSave.mockRejectedValueOnce(new Error('offline'));
  await act(async () => root.render(createElement(EducationalRoute)));
  await act(async () => button('Adaugă experiența în traseu').props.onPress());
  expect(button('Reîncarcă traseul')).toBeDefined();
  expect(mockRefresh).not.toHaveBeenCalled();
});
