import { supabase } from '@/lib/supabase';
import { searchCatalogue } from './catalogue';
jest.mock('@/lib/supabase', () => ({ supabase: { rpc: jest.fn() } }));
afterEach(() => jest.resetAllMocks());
it('uses one bounded server request with search, county, filter and pagination', async () => {
  const abortSignal = jest
    .fn()
    .mockResolvedValue({
      data: Array.from({ length: 21 }, (_, i) => ({
        id: String(i),
        type: 'schools',
        name: 'School',
      })),
      error: null,
    });
  jest.mocked(supabase.rpc).mockReturnValue({ abortSignal } as never);
  const signal = new AbortController().signal;
  const result = await searchCatalogue({
    section: 'schools',
    search: ' Gojdu ',
    filter: ' real ',
    county: 'Bihor',
    page: 2,
    signal,
  });
  expect(supabase.rpc).toHaveBeenCalledTimes(1);
  expect(supabase.rpc).toHaveBeenCalledWith('search_catalogue', {
    p_section: 'schools',
    p_search: 'Gojdu',
    p_filter: 'real',
    p_county: 'Bihor',
    p_offset: 40,
    p_limit: 21,
  });
  expect(abortSignal).toHaveBeenCalledWith(signal);
  expect(result.items).toHaveLength(20);
  expect(result.more).toBe(true);
});
it('does not offer an extra page at the exact boundary and normalizes source links', async () => {
  jest
    .mocked(supabase.rpc)
    .mockResolvedValue({
      data: Array.from({ length: 20 }, (_, i) => ({
        id: String(i),
        type: 'schools',
        sourceUrl:
          'https://static.admitere.edu.ro/2026/repartizare/BH/data/highschool.json',
      })),
      error: null,
    } as never);
  const result = await searchCatalogue({
    section: '',
    search: 'a',
    filter: '',
    county: '',
    page: 0,
  });
  expect(result.more).toBe(false);
  expect(result.items[0].sourceUrl).toContain('index.html#highschool');
});
it('surfaces a server error rather than treating it as an empty catalogue', async () => {
  jest
    .mocked(supabase.rpc)
    .mockResolvedValue({ data: null, error: new Error('Network') } as never);
  await expect(
    searchCatalogue({
      section: 'schools',
      search: '',
      filter: '',
      county: 'Bihor',
      page: 0,
    })
  ).rejects.toThrow('Network');
});
