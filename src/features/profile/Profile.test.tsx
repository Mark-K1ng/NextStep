jest.mock('@/components/ascii-skin', () => ({ AsciiContentGate: 'icon-skin' }));
import { act, createElement } from 'react';
import { createRoot } from 'test-renderer';
import Profile from './Profile';
import { ro } from '@/i18n/ro';
const mockData = {
  display_name: 'Test student',
  grade_level: 'XI',
  county: 'Bihor',
  favorite_subjects: ['Matematică'],
  interests: ['Programare'],
};
const mockUpdate = jest.fn();
jest.mock('react-native', () => ({
  View: 'view',
  StyleSheet: { create: (styles: unknown) => styles },
}));
jest.mock('@/components/motion', () => ({
  MotionContent: 'content',
  MotionPressable: 'pressable',
}));
jest.mock('@/components/design', () => ({
  Screen: 'screen',
  Copy: 'copy',
  Panel: 'panel',
  Row: 'row',
  Choice: 'choice',
  GroupedList: 'group',
  design: {},
}));
jest.mock('@/components', () => ({ Button: 'button', Input: 'input' }));
jest.mock('@/components/profile-selectors', () => ({
  GradeSelect: 'grade-select',
  CountySelect: 'county-select',
}));
jest.mock('@/components/data-state', () => ({ DataState: 'data-state' }));
jest.mock('lucide-react-native', () => ({
  Backpack: 'icon',
  BrainCircuit: 'icon',
  Bookmark: 'icon',
  LockKeyhole: 'icon',
  Palette: 'icon',
  CircleUserRound: 'icon',
  Settings: 'icon',
  CircleHelp: 'icon',
}));
jest.mock('@/hooks/use-app-router', () => ({
  useAppRouter: () => ({ push: jest.fn() }),
}));
jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => require('@/theme/tokens').darkColors,
}));
jest.mock('@/providers/auth', () => ({
  useSession: () => ({
    session: { user: { id: 'test-user', email: 'test@example.com' } },
  }),
}));
jest.mock('@/providers/saved', () => ({ useSaved: () => ({ items: [] }) }));
jest.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ data: mockData, isLoading: false }),
  useQueryClient: () => ({ invalidateQueries: jest.fn() }),
}));
jest.mock('@/lib/supabase', () => ({
  supabase: { from: () => ({ update: mockUpdate }) },
}));
jest.mock('@/lib/show-message', () => ({ showMessage: jest.fn() }));

it('shows interests as readable facts and retains editing with fixed selectors and cancel', async () => {
  const root = createRoot();
  try {
    await act(async () => root.render(createElement(Profile)));
    expect(
      root.container.queryAll(
        (node) => node.type === 'copy' && node.props.children === 'Programare'
      )
    ).toHaveLength(1);
    expect(
      root.container.queryAll((node) => node.type === 'choice')
    ).toHaveLength(0);
    const edit = root.container.queryAll(
      (node) =>
        node.type === 'pressable' &&
        node.queryAll(
          (child) =>
            child.type === 'copy' && child.props.children === ro.visual.edit
        ).length > 0
    )[0];
    await act(async () => edit.props.onPress());
    expect(
      root.container.queryAll((node) => node.type === 'grade-select')[0].props
        .value
    ).toBe('XI');
    expect(
      root.container.queryAll((node) => node.type === 'county-select')[0].props
        .county
    ).toBe('Bihor');
    const cancel = root.container.queryAll(
      (node) =>
        node.type === 'button' && node.props.children === ro.common.cancel
    )[0];
    await act(async () => cancel.props.onPress());
    expect(
      root.container.queryAll((node) => node.type === 'grade-select')
    ).toHaveLength(0);
    expect(
      root.container.queryAll((node) => node.type === 'county-select')
    ).toHaveLength(0);
    expect(
      root.container.queryAll(
        (node) => node.type === 'copy' && node.props.children === 'Programare'
      )
    ).toHaveLength(1);
    expect(mockUpdate).not.toHaveBeenCalled();
  } finally {
    await act(async () => root.unmount());
  }
});
