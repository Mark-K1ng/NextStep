import { supabase } from '@/lib/supabase';
import { loadCatalogueKeywords } from './catalogue-filters';
jest.mock('@/lib/supabase', () => ({ supabase: { from: jest.fn() } }));
const request = (data: unknown[], error: Error | null = null) => {
  const result = { data, error };
  const chain = {
    select: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    abortSignal: jest.fn().mockResolvedValue(result),
    then: (resolve: (value: unknown) => unknown) =>
      Promise.resolve(result).then(resolve),
  };
  jest.mocked(supabase.from).mockReturnValue(chain as never);
  return chain;
};
beforeEach(() => jest.clearAllMocks());
it('bounds requests and applies current-school and county constraints before collecting keyword choices', async () => {
  const chain = request([
    { specialization: 'Filologie' },
    { specialization: 'Filologie' },
    { specialization: 'Matematică-Informatică' },
  ]);
  const signal = new AbortController().signal;
  const result = await loadCatalogueKeywords('schools', 'Bihor', signal);
  expect(supabase.from).toHaveBeenCalledWith('school_profiles');
  expect(chain.select).toHaveBeenCalledWith(
    'specialization,schools!inner(county)'
  );
  expect(chain.eq).toHaveBeenCalledWith('schools.county', 'Bihor');
  expect(chain.eq).toHaveBeenCalledWith('is_current', true);
  expect(chain.limit).toHaveBeenCalledWith(501);
  expect(chain.abortSignal).toHaveBeenCalledWith(signal);
  expect(result.values).toEqual(['Filologie', 'Matematică-Informatică']);
});
it('does not request an unscoped institution list', async () => {
  expect(await loadCatalogueKeywords('programs', '')).toEqual({
    values: [],
    limited: false,
  });
  expect(supabase.from).not.toHaveBeenCalled();
});
it('keeps request failures distinct from an empty keyword list', async () => {
  request([], new Error('Offline'));
  await expect(loadCatalogueKeywords('careers', '')).rejects.toThrow('Offline');
});
