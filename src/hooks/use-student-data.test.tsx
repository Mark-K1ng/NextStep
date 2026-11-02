import { act, createElement } from 'react';
import { createRoot } from 'test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useStudentData } from './use-student-data';

const mockProfile = jest.fn();
const mockGoal = jest.fn();
const mockGap = jest.fn();
const mockPath = jest.fn();
jest.mock('expo-router', () => ({ useFocusEffect: () => {} }));
jest.mock('@/providers/auth', () => ({
  useSession: () => ({ session: { user: { id: 'student' } } }),
}));
jest.mock('@/hooks/use-profile', () => ({
  useProfileQuery: () =>
    require('@tanstack/react-query').useQuery({
      queryKey: ['profile', 'student'],
      staleTime: 60_000,
      queryFn: mockProfile,
    }),
}));
jest.mock('@/services/gap-analysis', () => ({
  loadGapAnalysis: (...args: unknown[]) => mockGap(...args),
}));
jest.mock('@/services/path', () => ({
  loadPathSteps: (...args: unknown[]) => mockPath(...args),
}));
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => {
      const q = {
        select: () => q,
        eq: () => q,
        order: () => q,
        limit: () => q,
        abortSignal: () => mockGoal(),
      };
      return q;
    },
  },
}));
const states: Record<string, ReturnType<typeof useStudentData>> = {};
function Probe({
  name,
  pathOnly = false,
}: {
  name: string;
  pathOnly?: boolean;
}) {
  states[name] = useStudentData({
    includeGap: !pathOnly,
    includePath: pathOnly,
  });
  return null;
}
afterEach(() => jest.resetAllMocks());
it('shares profile/goal requests and lets Home and Path finish while recommendations are pending', async () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const root = createRoot();
  let resolveGap!: (value: unknown) => void;
  mockProfile.mockResolvedValue({
    id: 'student',
    county: 'Bihor',
    display_name: 'Student',
  });
  mockGoal.mockResolvedValue({
    data: [{ careers: { id: 'career', name: 'Career' } }],
    error: null,
  });
  mockGap.mockReturnValue(
    new Promise((resolve) => {
      resolveGap = resolve;
    })
  );
  mockPath.mockResolvedValue([{ id: 'step', name: 'Saved school' }]);
  try {
    await act(async () =>
      root.render(
        createElement(QueryClientProvider, { client }, [
          createElement(Probe, { key: 'home', name: 'home' }),
          createElement(Probe, { key: 'path', name: 'path', pathOnly: true }),
        ])
      )
    );
    for (let i = 0; i < 4; i++)
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 15));
      });
    expect(mockProfile).toHaveBeenCalledTimes(1);
    expect(mockGoal).toHaveBeenCalledTimes(1);
    expect(mockGap).toHaveBeenCalledTimes(1);
    expect(mockPath).toHaveBeenCalledTimes(1);
    expect(states.home.loading).toBe(false);
    expect(states.home.gapLoading).toBe(true);
    expect(states.path.pathLoading).toBe(false);
    expect(states.path.steps[0].name).toBe('Saved school');
    expect(states.path.gap).toBeNull();
    await act(async () =>
      resolveGap({ covered: [], partial: [], missing: [], steps: [] })
    );
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 15));
    });
    expect(states.home.gapLoading).toBe(false);
  } finally {
    await act(async () => root.unmount());
    client.clear();
  }
});
