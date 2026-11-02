import { act, createElement } from 'react';
import { createRoot } from 'test-renderer';
import OptionDetail from './OptionDetail';
jest.mock('@/components/career-goal-action', () => ({
  CareerGoalAction: 'goal-action',
}));
import SkillDetail from './SkillDetail';
import { saveSkillLevel } from '@/services/skills';
import { ro } from '@/i18n/ro';
jest.mock('@/components/navigation-surface', () => ({
  NavigationSurface: 'surface',
}));
import { setPathSelection } from '@/services/option-path';
import { showMessage } from '@/lib/show-message';

let mockData: unknown;
let mockLoading = true;
let mockPlatform = 'ios';
let mockFontScale = 1;
let mockPathSelected = false;
let mockPathSuccess = true;
let mockPreview = false;
const mockDetailQuery = jest.fn();
jest.mock('@/providers/account-mode', () => ({
  useAccountMode: () => ({
    isPreview: mockPreview,
    isTeacher: mockPreview,
    previewCounty: 'Cluj',
  }),
}));
const mockPush = jest.fn();
const mockCompare = jest.fn();
const mockToast = jest.fn();
const mockSetQueryData = jest.fn();
const mockInvalidate = jest.fn().mockResolvedValue(undefined);
jest.mock('react-native', () => ({
  View: 'view',
  StyleSheet: { create: (styles: unknown) => styles },
  Platform: {
    get OS() {
      return mockPlatform;
    },
  },
  Share: { share: jest.fn() },
  useWindowDimensions: () => ({ fontScale: mockFontScale }),
}));
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: 'course' }),
}));
jest.mock('@/hooks/use-app-router', () => ({
  useAppRouter: () => ({ back: jest.fn(), push: mockPush }),
}));
jest.mock('@tanstack/react-query', () => ({
  useQuery: ({ queryKey, ...options }: any) => {
    mockDetailQuery({ queryKey, ...options });
    return queryKey[0] === 'path-selection'
      ? { data: mockPathSelected, isSuccess: mockPathSuccess }
      : { data: mockData, isLoading: mockLoading };
  },
  useQueryClient: () => ({
    setQueryData: mockSetQueryData,
    invalidateQueries: mockInvalidate,
  }),
}));
jest.mock('@/providers/auth', () => ({
  useSession: () => ({ session: { user: { id: 'test' } } }),
}));
jest.mock('@/hooks/use-profile', () => ({
  useProfileQuery: () => ({ isSuccess: true, data: { county: 'Bihor' } }),
}));
jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => require('@/theme/tokens').darkColors,
}));
jest.mock('@/providers/toast', () => ({ useToast: () => mockToast }));
jest.mock('@/providers/journey', () => ({
  useJourney: () => ({ beginComparison: mockCompare }),
}));
jest.mock('@/components/design', () => ({
  GroupedList: 'group',
  BackHeader: ({ title, trailing }: any) =>
    require('react').createElement('back-header', { title }, trailing),
  Screen: ({ children, nativeActions, ...props }: any) =>
    require('react').createElement(
      'screen',
      { ...props, nativeActions },
      nativeActions,
      children
    ),
  Copy: 'copy',
  Row: 'row',
  Panel: 'panel',
  Section: 'section',
  Choice: 'choice',
  design: {},
}));
jest.mock('@/components/motion', () => ({
  MotionPressable: 'pressable',
  MotionContent: 'content',
  StateFeedback: ({ children }: any) => children,
}));
jest.mock('@/components', () => ({ Button: 'button' }));
jest.mock('@/components/data-state', () => ({ DataState: 'data-state' }));
jest.mock('@/components/save-button', () => ({ SaveButton: 'save-button' }));
jest.mock('@/components/InstitutionMap', () => ({ InstitutionMap: 'map' }));
jest.mock('./school-admissions', () => ({
  SchoolAdmissions: 'admissions',
  AdmissionFacts: 'facts',
}));
jest.mock('@/lib/supabase', () => ({ supabase: {} }));
jest.mock('@/lib/open-external-url', () => ({ openExternalUrl: jest.fn() }));
jest.mock('@/lib/option-navigation', () => ({ openOption: jest.fn() }));
jest.mock('@/lib/show-message', () => ({ showMessage: jest.fn() }));
jest.mock('@/services/option-path', () => ({
  isOnPath: jest.fn(),
  setPathSelection: jest.fn(),
}));
jest.mock('@/services/skills', () => ({ saveSkillLevel: jest.fn() }));
jest.mock('lucide-react-native', () => ({
  ArrowLeft: 'icon',
  Share2: 'icon',
  BookOpen: 'icon',
  Briefcase: 'icon',
  Info: 'icon',
  GraduationCap: 'icon',
  Bookmark: 'bookmark',
  Columns2: 'icon',
}));

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(saveSkillLevel).mockResolvedValue(undefined);
  mockPathSelected = false;
  mockPathSuccess = true;
  mockPreview = false;
  (setPathSelection as jest.Mock).mockResolvedValue(undefined);
});

it('keeps teacher skill preview read-only while retaining public practice resources', async () => {
  mockPreview = true;
  mockLoading = false;
  mockData = {
    level: 2,
    skill: {
      id: 'course',
      name: 'Programare',
      category: 'Tehnologie',
      course_skills: [],
      career_skills: [],
    },
  };
  const root = createRoot();
  try {
    await act(async () => root.render(createElement(SkillDetail)));
    expect(
      root.container.queryAll((node) => node.type === 'choice')
    ).toHaveLength(0);
    expect(
      root.container.queryAll(
        (node) =>
          node.type === 'button' && node.props.children === ro.common.save
      )
    ).toHaveLength(0);
    expect(
      root.container.queryAll(
        (node) =>
          node.type === 'copy' &&
          node.props.children === 'Autoevaluarea elevilor'
      )
    ).toHaveLength(1);
    expect(saveSkillLevel).not.toHaveBeenCalled();
  } finally {
    await act(async () => root.unmount());
  }
});

it('scopes teacher institutional details to the ephemeral preview county', async () => {
  mockPreview = true;
  mockLoading = false;
  mockData = { id: 'course', name: 'Liceu', county: 'Cluj' };
  const root = createRoot();
  try {
    await act(async () =>
      root.render(createElement(OptionDetail, { kind: 'schools' }))
    );
    const options = mockDetailQuery.mock.calls.find(
      ([value]) => value.queryKey[0] === 'option'
    )![0];
    expect(options.queryKey).toEqual([
      'option',
      'test',
      'schools',
      'course',
      'Cluj',
      'preview',
    ]);
  } finally {
    await act(async () => root.unmount());
  }
});

it.each(['ios', 'android'])(
  'keeps %s skill actions in the header and preserves the assessment save action',
  async (platform) => {
    mockPlatform = platform;
    mockLoading = false;
    mockData = {
      skill: {
        id: 'course',
        name: 'Programare',
        category: 'Tehnologie',
        course_skills: [],
        career_skills: [],
      },
      level: 1,
    };
    const root = createRoot();
    try {
      await act(async () => root.render(createElement(SkillDetail)));
      const screen = root.container.queryAll(
        (node) => node.type === 'screen'
      )[0];
      expect(screen.props.nativeTitle).toBe(ro.common.skills);
      expect(!!screen.props.nativeActions).toBe(platform === 'ios');
      expect(
        root.container.queryAll((node) => node.type === 'save-button')
      ).toHaveLength(1);
      const compare = root.container.queryAll(
        (node) =>
          node.type === 'pressable' &&
          node.props.accessibilityLabel === ro.visual.compare
      )[0];
      await act(async () => compare.props.onPress());
      expect(mockCompare).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'skills', name: 'Programare' })
      );
      expect(mockPush).toHaveBeenCalledWith('/compare');
      expect(
        root.container.queryAll(
          (node) =>
            node.type === 'button' && node.props.children === ro.visual.compare
        )
      ).toHaveLength(0);
      const choice = root.container.queryAll(
        (node) => node.type === 'choice'
      )[2];
      await act(async () => choice.props.onPress());
      const save = root.container.queryAll(
        (node) =>
          node.type === 'button' && node.props.children === ro.common.save
      )[0];
      await act(async () => save.props.onPress());
      expect(saveSkillLevel).toHaveBeenCalledWith('course', 2);
      expect(mockToast).toHaveBeenCalledWith(ro.visual.skillLevelSaved);
    } finally {
      await act(async () => root.unmount());
    }
  }
);

it.each([true, false])(
  'confirms the ability level only after a successful save (%s)',
  async (succeeds) => {
    mockLoading = false;
    mockData = {
      skill: {
        id: 'course',
        name: 'Programare',
        category: 'Tehnologie',
        course_skills: [],
        career_skills: [],
      },
      level: 1,
    };
    let resolve!: () => void;
    let reject!: (error: Error) => void;
    jest.mocked(saveSkillLevel).mockImplementationOnce(
      () =>
        new Promise<void>((done, fail) => {
          resolve = done;
          reject = fail;
        })
    );
    const root = createRoot();
    try {
      await act(async () => root.render(createElement(SkillDetail)));
      // Choosing a different level changes the same button back to Save.
      await act(async () =>
        root.container
          .queryAll((node) => node.type === 'choice')[2]
          .props.onPress()
      );
      const save = root.container.queryAll(
        (node) =>
          node.type === 'button' && node.props.children === ro.common.save
      )[0];
      let pending!: Promise<void>;
      await act(async () => {
        pending = save.props.onPress();
      });
      expect(mockToast).not.toHaveBeenCalled();
      await act(async () => {
        if (succeeds) resolve();
        else reject(new Error('offline'));
        await pending;
      });
      if (succeeds)
        expect(mockToast).toHaveBeenCalledWith(ro.visual.skillLevelSaved);
      else {
        expect(mockToast).not.toHaveBeenCalled();
        expect(
          root.container.queryAll(
            (node) =>
              node.type === 'copy' && node.props.accessibilityRole === 'alert'
          )[0].props.children
        ).toBe(ro.errors.serverError);
      }
    } finally {
      await act(async () => root.unmount());
    }
  }
);

it.each([true, false])(
  'clears only the saved ability level after persistence (%s)',
  async (succeeds) => {
    mockLoading = false;
    mockData = {
      skill: {
        id: 'course',
        name: 'Programare',
        category: 'Tehnologie',
        course_skills: [],
        career_skills: [],
      },
      level: 2,
    };
    if (!succeeds)
      jest.mocked(saveSkillLevel).mockRejectedValueOnce(new Error('offline'));
    const root = createRoot();
    try {
      await act(async () => root.render(createElement(SkillDetail)));
      const clear = root.container.queryAll(
        (node) =>
          node.type === 'button' &&
          node.props.children === ro.visual.unsaveSkillLevel
      )[0];
      await act(async () => clear.props.onPress());
      expect(saveSkillLevel).toHaveBeenCalledWith('course', 0);
      expect(
        root.container.queryAll((node) => node.type === 'save-button')
      ).toHaveLength(1);
      if (succeeds) {
        expect(mockToast).toHaveBeenCalledWith(ro.visual.skillLevelCleared);
        expect(mockSetQueryData).toHaveBeenCalledWith(
          ['skill', 'test', 'course', 'student'],
          expect.objectContaining({ level: 0 })
        );
        mockData = { ...mockData, level: 0 };
        await act(async () => root.render(createElement(SkillDetail)));
        expect(
          root.container.queryAll((node) => node.type === 'choice')[0].props
            .selected
        ).toBe(true);
        expect(
          root.container.queryAll(
            (node) =>
              node.type === 'button' &&
              node.props.children === ro.visual.unsaveSkillLevel
          )
        ).toHaveLength(0);
        const save = root.container.queryAll(
          (node) =>
            node.type === 'button' && node.props.children === ro.common.save
        );
        expect(save).toHaveLength(1);
        expect(save[0].props.disabled).toBe(true);
      } else {
        expect(mockToast).not.toHaveBeenCalled();
        expect(mockSetQueryData).not.toHaveBeenCalled();
        expect(
          root.container.queryAll((node) => node.type === 'choice')[2].props
            .selected
        ).toBe(true);
      }
    } finally {
      await act(async () => root.unmount());
    }
  }
);

it.each(['ios', 'android'])(
  'renders %s course loading and content safely at both text sizes',
  async (platform) => {
    mockPlatform = platform;
    const root = createRoot();
    try {
      mockData = undefined;
      mockLoading = true;
      await act(async () =>
        root.render(createElement(OptionDetail, { kind: 'courses' }))
      );
      expect(
        root.container.queryAll((node) => node.type === 'data-state')[0].props
          .loading
      ).toBe(true);
      mockLoading = false;
      mockData = {
        id: 'course',
        title: 'Test course',
        provider: 'Provider',
        language: 'Română',
        level: 'Începător',
        course_skills: [{ skills: { id: 'skill', name: 'Skill' } }],
      };
      for (const scale of [1, 2]) {
        mockFontScale = scale;
        await act(async () =>
          root.render(createElement(OptionDetail, { kind: 'courses' }))
        );
        expect(
          root.container.queryAll(
            (node) => node.type === 'row' && node.props.title === 'Skill'
          )
        ).toHaveLength(1);
        expect(
          root.container.queryAll(
            (node) =>
              node.type === 'copy' &&
              node.props.children === 'Română · Începător'
          )
        ).toHaveLength(1);
        expect(
          root.container.queryAll(
            (node) => node.type === 'copy' && node.props.kind === 'label'
          )
        ).toHaveLength(0);
        expect(
          root.container.queryAll((node) => node.type === 'back-header')
        ).toHaveLength(platform === 'android' ? 1 : 0);
        expect(
          root.container.queryAll((node) => node.type === 'save-button')
        ).toHaveLength(1);
        expect(
          root.container.queryAll((node) => node.type === 'screen')[0].props
            .nativeActions !== undefined
        ).toBe(platform === 'ios');
      }
    } finally {
      mockFontScale = 1;
      await act(async () => root.unmount());
    }
  }
);

it.each([
  ['android', 'schools'],
  ['android', 'school_profiles'],
  ['android', 'universities'],
  ['android', 'programs'],
  ['android', 'careers'],
  ['android', 'courses'],
  ['ios', 'schools'],
  ['ios', 'school_profiles'],
  ['ios', 'universities'],
  ['ios', 'programs'],
  ['ios', 'careers'],
  ['ios', 'courses'],
] as const)(
  'keeps %s %s shared bookmark and comparison in the header',
  async (platform, kind) => {
    mockPlatform = platform;
    mockLoading = false;
    mockData = {
      id: 'course',
      name: 'Test school',
      county: 'Bihor',
      schools: { id: 'parent-school', name: 'Parent', county: 'Bihor' },
    };
    const root = createRoot();
    try {
      await act(async () => root.render(createElement(OptionDetail, { kind })));
      const action = (label: string) =>
        root.container.queryAll(
          (node) =>
            node.type === 'pressable' && node.props.accessibilityLabel === label
        )[0];
      expect(
        root.container.queryAll((node) => node.type === 'save-button')
      ).toHaveLength(1);
      const title = root.container.queryAll(
        (node) =>
          node.type === 'copy' &&
          node.props.kind === 'title' &&
          node.props.children === 'Test school'
      )[0];
      if (platform === 'android') {
        expect(title.props.style).toEqual({ fontSize: 20, lineHeight: 24 });
      } else {
        expect(title.props.style).toBeFalsy();
      }
      expect(title.props.numberOfLines).toBeUndefined();
      expect(title.props.allowFontScaling).toBeUndefined();
      expect(
        root.container.queryAll(
          (node) =>
            node.type === 'button' &&
            [
              ro.visual.compare,
              ro.visual.addToPath,
              ro.profileChoices.removeFromPath,
            ].includes(node.props.children)
        )
      ).toHaveLength(0);
      await act(async () => action(ro.visual.compare).props.onPress());
      expect(mockCompare).toHaveBeenCalledWith(
        expect.objectContaining({ type: kind, id: 'course' })
      );
      expect(mockPush).toHaveBeenCalledWith('/compare');
    } finally {
      await act(async () => root.unmount());
    }
  }
);
