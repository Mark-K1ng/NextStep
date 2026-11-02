import {
  admissionAverage,
  admissionVariant,
  currentAdmissions,
  readableSourceUrl,
} from './school-admissions';

it('keeps unpublished averages distinct from valid historical results', () => {
  for (const value of [null, undefined, 0, NaN, 10.1, '', '-', 'bad']) {
    expect(admissionAverage(value)).toBe('—');
  }
  expect(admissionAverage(9.1)).toBe('9,10');
  expect(admissionAverage(10)).toBe('10,00');
  expect(admissionAverage('8.50')).toBe('8,50');
});

it('shows the latest active offer in numeric code order without mutating input', () => {
  const profiles = [
    {
      id: 'ten',
      specialization: 'A',
      admission_year: 2026,
      admission_code: '10',
    },
    { id: 'old', specialization: 'A', admission_year: 2025 },
    {
      id: 'archived',
      specialization: 'A',
      admission_year: 2027,
      is_current: false,
    },
    {
      id: 'two',
      specialization: 'B',
      admission_year: 2026,
      admission_code: '2',
    },
  ];
  expect(currentAdmissions(profiles).map((p) => p.id)).toEqual(['two', 'ten']);
  expect(profiles[0].id).toBe('ten');
  expect(currentAdmissions([])).toEqual([]);
});

it('distinguishes language and dual variants with the same specialization', () => {
  expect(
    admissionVariant({
      teaching_language: 'Română',
      bilingual_language: 'Engleză',
      is_dual: true,
    })
  ).toContain('Engleză');
  expect(admissionVariant({ teaching_language: 'Maghiară' })).toBe('Maghiară');
  expect(admissionVariant({})).toBe('');
});

it('replaces Ministry data files with readable reports and blocks other JSON links', () => {
  expect(
    readableSourceUrl(
      'https://static.admitere.edu.ro/2026/repartizare/BH/data/specialization.json'
    )
  ).toBe(
    'https://static.admitere.edu.ro/2026/repartizare/BH/index.html#specialization'
  );
  expect(
    readableSourceUrl('https://example.com/data.json?download=1')
  ).toBeUndefined();
  expect(readableSourceUrl('javascript:alert(1)')).toBeUndefined();
  expect(readableSourceUrl('broken')).toBeUndefined();
  expect(readableSourceUrl('https://example.com/admitere')).toBe(
    'https://example.com/admitere'
  );
});
