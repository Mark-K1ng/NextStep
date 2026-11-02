import { act, createElement } from 'react';
import { createRoot } from 'test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import TeacherApplication, { teacherFormUrl } from './application';
import TeacherAvailability, { availabilityError } from './availability';

const mockRefresh = jest.fn();
const mockPrepare = jest.fn();
const mockSave = jest.fn();
const mockOpen = jest.fn();
let mockAccess: Record<string, unknown>;
jest.mock('@/providers/account-mode', () => ({
  useAccountMode: () => ({
    access: mockAccess,
    refresh: mockRefresh,
    isPending: false,
    error: false,
    isApprovedTeacher: false,
  }),
}));
jest.mock('@/services/account-access', () => ({
  startTeacherApplication: () => mockPrepare(),
  updateTeacherAvailability: (rows: unknown) => mockSave(rows),
}));
jest.mock('@/providers/auth', () => ({
  useSession: () => ({ session: { user: { id: 'teacher' } } }),
}));
jest.mock('@/lib/supabase', () => ({
  supabase: { auth: { signOut: jest.fn() } },
}));
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));
jest.mock('expo-web-browser', () => ({
  openBrowserAsync: (url: string) => mockOpen(url),
}));
jest.mock('react-native', () => ({ Platform: { OS: 'android' } }));
jest.mock('@/components/design', () => ({
  Screen: 'screen',
  Copy: 'copy',
  BackHeader: 'header',
  Panel: 'panel',
}));
jest.mock('@/components/Button', () => ({ Button: 'button' }));
jest.mock('@/components/SelectField', () => ({ SelectField: 'select' }));
jest.mock('@/components/data-state', () => ({ DataState: 'data-state' }));
jest.mock('./shared', () => ({
  TeacherNote: 'note',
  TeacherPage: 'screen',
  TeacherAccountContent: ({ children }: { children(data: unknown): unknown }) =>
    children({
      id: 'tutor',
      availability: [{ weekday: 1, start_minute: 960, end_minute: 1200 }],
    }),
}));

const originalForm = process.env.EXPO_PUBLIC_TEACHER_APPLICATION_FORM_URL;
beforeEach(() => {
  mockAccess = { teacher_status: 'not_started', application_reference: null };
  mockPrepare.mockReset().mockResolvedValue({});
  mockSave.mockReset();
  mockOpen.mockReset().mockResolvedValue({ type: 'dismiss' });
  mockRefresh.mockReset().mockResolvedValue(undefined);
  process.env.EXPO_PUBLIC_TEACHER_APPLICATION_FORM_URL =
    'https://forms.gle/example';
});
afterAll(() => {
  if (originalForm === undefined)
    delete process.env.EXPO_PUBLIC_TEACHER_APPLICATION_FORM_URL;
  else process.env.EXPO_PUBLIC_TEACHER_APPLICATION_FORM_URL = originalForm;
});

async function mounted(Component: typeof TeacherApplication) {
  const root = createRoot();
  const client = new QueryClient({
    defaultOptions: {
      mutations: { retry: false, gcTime: Infinity },
      queries: { retry: false, gcTime: Infinity },
    },
  });
  await act(async () =>
    root.render(
      createElement(QueryClientProvider, { client }, createElement(Component))
    )
  );
  return root;
}
type Root = Awaited<ReturnType<typeof mounted>>;
const buttons = (root: Root) =>
  root.container.queryAll((node) => node.type === 'button');
const button = (root: Root, title: string) =>
  buttons(root).find((node) => node.props.children === title)!;

it('accepts only configured HTTPS Google form destinations', () => {
  expect(teacherFormUrl(undefined)).toBeNull();
  expect(teacherFormUrl('javascript:alert(1)')).toBeNull();
  expect(
    teacherFormUrl('https://docs.google.com.evil.test/forms/1')
  ).toBeNull();
  expect(teacherFormUrl('https://user:pass@forms.gle/a')).toBeNull();
  expect(teacherFormUrl('https://docs.google.com/forms/d/example/edit')).toBeNull();
  expect(teacherFormUrl('https://forms.gle:444/example')).toBeNull();
  expect(teacherFormUrl('https://docs.google.com/forms/d/e/abc/viewform')).toBe(
    'https://docs.google.com/forms/d/e/abc/viewform'
  );
});

it('keeps preparation disabled when the published form is unavailable', async () => {
  delete process.env.EXPO_PUBLIC_TEACHER_APPLICATION_FORM_URL;
  const root = await mounted(TeacherApplication);
  try {
    expect(button(root, 'Pregătește cererea').props.disabled).toBe(true);
    expect(button(root, 'Deschide formularul')).toBeUndefined();
    expect(mockPrepare).not.toHaveBeenCalled();
  } finally {
    await act(async () => root.unmount());
  }
});

it('opening a prepared form does not declare submission or prepare another reference', async () => {
  mockAccess = {
    teacher_status: 'draft',
    application_reference: 'opaque-reference',
    application_expires_at: '2099-01-01',
  };
  const root = await mounted(TeacherApplication);
  try {
    await act(async () => button(root, 'Deschide formularul').props.onPress());
    expect(mockOpen).toHaveBeenCalledWith('https://forms.gle/example');
    expect(mockPrepare).not.toHaveBeenCalled();
    expect(mockRefresh).not.toHaveBeenCalled();
    expect(button(root, 'Pregătește cererea')).toBeUndefined();
  } finally {
    await act(async () => root.unmount());
  }
});

it.each(['submitted', 'under_review', 'suspended'])(
  'offers no new submission controls for %s accounts',
  async (teacher_status) => {
    mockAccess = { teacher_status, application_reference: 'opaque-reference' };
    const root = await mounted(TeacherApplication);
    try {
      expect(button(root, 'Pregătește cererea')).toBeUndefined();
      expect(button(root, 'Deschide formularul')).toBeUndefined();
    } finally {
      await act(async () => root.unmount());
    }
  }
);

it('validates weekly boundaries and overlapping intervals without blocking adjacent intervals', () => {
  expect(availabilityError([])).toBeNull();
  expect(
    availabilityError([
      { weekday: 1, start_minute: 0, end_minute: 60 },
      { weekday: 1, start_minute: 60, end_minute: 120 },
    ])
  ).toBeNull();
  expect(
    availabilityError([
      { weekday: 1, start_minute: 0, end_minute: 120 },
      { weekday: 1, start_minute: 60, end_minute: 180 },
    ])
  ).toContain('suprapune');
  expect(
    availabilityError([{ weekday: 7, start_minute: 0, end_minute: 60 }])
  ).not.toBeNull();
  expect(
    availabilityError([{ weekday: 0, start_minute: 60, end_minute: 90 }])
  ).not.toBeNull();
});

it('retains edited availability after a failed save and allows a truthful retry', async () => {
  mockSave
    .mockRejectedValueOnce(new Error('offline'))
    .mockResolvedValueOnce([
      { weekday: 2, start_minute: 960, end_minute: 1200 },
    ]);
  const root = await mounted(TeacherAvailability);
  try {
    const field = root.container.queryAll((node) => node.type === 'select')[0];
    await act(async () => field.props.onChange('2'));
    await act(async () => {
      button(root, 'Salvează disponibilitatea').props.onPress();
      await new Promise((resolve) => setTimeout(resolve, 20));
    });
    expect(
      root.container.queryAll((node) => node.type === 'select')[0].props.value
    ).toBe('2');
    expect(button(root, 'Salvează disponibilitatea').props.disabled).toBe(
      false
    );
    await act(async () => {
      button(root, 'Salvează disponibilitatea').props.onPress();
      await new Promise((resolve) => setTimeout(resolve, 20));
    });
    expect(mockSave).toHaveBeenCalledTimes(2);
    expect(button(root, 'Salvează disponibilitatea').props.disabled).toBe(true);
  } finally {
    await act(async () => root.unmount());
  }
});
