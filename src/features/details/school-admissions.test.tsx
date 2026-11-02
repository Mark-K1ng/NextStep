import { act, createElement } from 'react';
import { createRoot } from 'test-renderer';
import { AdmissionFacts, SchoolAdmissions } from './school-admissions';
import { ro } from '@/i18n/ro';

const mockPresses: (() => void)[] = [];
jest.mock('@/components/motion', () => ({
  MotionPressable: (props: { onPress(): void; children: unknown }) => {
    mockPresses.push(props.onPress);
    return require('react').createElement('pressable', props, props.children);
  },
}));
jest.mock('react-native', () => ({
  View: 'view',
  Pressable: (props: { onPress(): void; children: unknown }) => {
    mockPresses.push(props.onPress);
    return require('react').createElement('pressable', props, props.children);
  },
  StyleSheet: { create: (styles: unknown) => styles },
}));
jest.mock('lucide-react-native', () => ({ ChevronRight: 'chevron' }));
jest.mock('@/components/design', () => ({
  Copy: 'copy',
  Panel: 'panel',
  Section: 'section',
}));
jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => require('@/theme/tokens').darkColors,
}));

it('opens the selected active profile and shows its year, places and missing-average state', async () => {
  mockPresses.length = 0;
  const root = createRoot();
  const onSelect = jest.fn();
  const profile = {
    id: 'option',
    specialization: 'Filologie',
    admission_year: 2026,
    seats_total: 28,
    admission_code: '131',
    last_admission_average: null,
  };
  try {
    await act(async () =>
      root.render(
        createElement(SchoolAdmissions, {
          profiles: [
            profile,
            { id: 'retired', specialization: 'Retired', is_current: false },
          ],
          onSelect,
        })
      )
    );
    const rendered = JSON.stringify(root.container.toJSON());
    expect(rendered).toContain('2026');
    expect(rendered).toContain('28');
    expect(rendered).toContain('—');
    expect(rendered).not.toContain('Retired');
    expect(mockPresses).toHaveLength(1);
    mockPresses[0]();
    expect(onSelect).toHaveBeenCalledWith(profile);
  } finally {
    await act(async () => root.unmount());
  }
});

it('labels the comparison average with the previous year and handles an empty catalogue', async () => {
  const root = createRoot();
  try {
    await act(async () =>
      root.render(
        createElement(AdmissionFacts, {
          expanded: true,
          profile: {
            id: 'a',
            specialization: 'A',
            admission_year: 2026,
            previous_admission_average: 8.5,
            seats_occupied: 0,
          },
        })
      )
    );
    const rendered = JSON.stringify(root.container.toJSON());
    expect(rendered).toContain('2025');
    expect(rendered).toContain('8,50');
    expect(rendered).toContain('"0"');
    await act(async () =>
      root.render(
        createElement(SchoolAdmissions, { profiles: [], onSelect: jest.fn() })
      )
    );
    expect(JSON.stringify(root.container.toJSON())).toContain(
      ro.admissions.empty
    );
  } finally {
    await act(async () => root.unmount());
  }
});
