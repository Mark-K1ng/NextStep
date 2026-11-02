import { supabase } from '@/lib/supabase';
import { loadComparisonOptions } from './comparison';
jest.mock('@/lib/supabase', () => ({ supabase: { from: jest.fn() } }));

function query(data: unknown[], error: Error | null = null) {
  const request = {
    select: jest.fn(),
    eq: jest.fn(),
    in: jest.fn(),
    abortSignal: jest.fn().mockResolvedValue({ data, error }),
  };
  for (const method of ['select', 'eq', 'in'] as const)
    request[method].mockReturnValue(request);
  jest.mocked(supabase.from).mockReturnValue(request as never);
  return request;
}
afterEach(() => jest.resetAllMocks());
it.each([false, true])(
  'hydrates both schools in selection order, reversed=%s',
  async (reverse) => {
    const selected = ['one', 'two'].map((id) => ({ id, type: 'schools' }));
    if (reverse) selected.reverse();
    const rows = ['two', 'one'].map((id) => ({
      id,
      name: id,
      county: 'Bihor',
      description: `${id} description`,
      school_profiles: [
        { specialization: `${id} profile`, is_current: true },
        { specialization: 'Archived', is_current: false },
      ],
    }));
    const request = query(rows);
    const signal = new AbortController().signal;
    const result = await loadComparisonOptions(selected, 'Bihor', signal);
    expect(result.map((item) => item.id)).toEqual(
      selected.map((item) => item.id)
    );
    expect(result.map((item) => item.specialization)).toEqual(
      selected.map((item) => `${item.id} profile`)
    );
    expect(result.map((item) => item.description)).toEqual(
      selected.map((item) => `${item.id} description`)
    );
    expect(request.eq).toHaveBeenCalledWith('county', 'Bihor');
    expect(request.in).toHaveBeenCalledWith(
      'id',
      selected.map((item) => item.id)
    );
    expect(request.abortSignal).toHaveBeenCalledWith(signal);
  }
);
it('normalizes program facts and scopes through its university', async () => {
  const request = query([
    {
      id: 'one',
      name: 'Program',
      degree_level: 'Licență',
      duration_years: 3,
      universities: { name: 'University', county: 'Bihor' },
    },
  ]);
  const result = await loadComparisonOptions(
    [{ id: 'one', type: 'programs' }],
    'Bihor'
  );
  expect(result[0]).toMatchObject({
    county: 'Bihor',
    provider: 'University',
    degreeLevel: 'Licență',
    duration: '3 ani',
  });
  expect(request.eq).toHaveBeenCalledWith('universities.county', 'Bihor');
});
it('preserves paid course facts without treating false as missing', async () => {
  query([
    {
      id: 'one',
      title: 'Course',
      provider: 'Provider',
      language: 'Română',
      is_free: false,
      level: 'Intermediar',
    },
  ]);
  const result = await loadComparisonOptions(
    [{ id: 'one', type: 'courses' }],
    ''
  );
  expect(result[0]).toMatchObject({
    name: 'Course',
    provider: 'Provider',
    language: 'Română',
    isFree: false,
    level: 'Intermediar',
  });
});
it.each(['missing', 'county', 'archived'])(
  'does not revive an unavailable %s selection from stale UI metadata',
  async (mode) => {
    query(
      mode === 'missing'
        ? []
        : [
            {
              id: 'one',
              county: mode === 'county' ? 'Cluj' : 'Bihor',
              is_current: mode !== 'archived',
            },
          ]
    );
    await expect(
      loadComparisonOptions(
        [
          {
            id: 'one',
            type: 'schools',
            name: 'Cached name',
            description: 'Stale description',
          },
        ],
        'Bihor'
      )
    ).rejects.toThrow('Comparison option unavailable');
  }
);
it('propagates fetch failures for retry', async () => {
  query([], new Error('Offline'));
  await expect(
    loadComparisonOptions([{ id: 'one', type: 'schools' }], 'Bihor')
  ).rejects.toThrow('Offline');
});
