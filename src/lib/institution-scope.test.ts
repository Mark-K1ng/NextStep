import {
  institutionVisible,
  institutionCountyColumn,
} from './institution-scope';
import { institutionMap, institutionMapDocument } from './institution-map';
it('does not expose Bihor institutions to another county, including joined records', () => {
  const cases = [
    ['schools', { county: 'Bihor' }],
    ['universities', { county: 'Bihor' }],
    ['school_profiles', { schools: { county: 'Bihor' } }],
    ['programs', { universities: { county: 'Bihor' } }],
  ] as const;
  for (const [type, item] of cases) {
    expect(institutionVisible(type, item, 'Bihor')).toBe(true);
    expect(institutionVisible(type, item, 'Cluj')).toBe(false);
    expect(institutionVisible(type, item, '')).toBe(false);
  }
  expect(institutionVisible('universities', {}, 'Bihor')).toBe(false);
  expect(institutionVisible('courses', {}, 'Cluj')).toBe(true);
});
it('filters the institution county before pagination, using the parent for child records', () => {
  expect(institutionCountyColumn('schools')).toBe('county');
  expect(institutionCountyColumn('school_profiles')).toBe('schools.county');
  expect(institutionCountyColumn('programs')).toBe('universities.county');
});
it('opens Google Maps with the same institution search used by the embedded preview', () => {
  const urls = institutionMap('Colegiul & Școala', 'Oradea', 'Bihor');
  const search = new URL(urls.search);
  const embed = new URL(urls.embed);
  expect(search.origin).toBe('https://www.google.com');
  expect(search.searchParams.get('query')).toBe(
    'Colegiul & Școala, Oradea, Bihor, România'
  );
  expect(embed.searchParams.get('q')).toBe(search.searchParams.get('query'));
});
it('uses the verified street address to disambiguate schools with generic names', () => {
  const urls = institutionMap(
    'Liceul Tehnologic Nr.1',
    'Cadea',
    'Bihor',
    '  Strada de Jos nr. 48  '
  );
  const query = new URL(urls.search).searchParams.get('query');
  expect(query).toBe(
    'Liceul Tehnologic Nr.1, Strada de Jos nr. 48, Cadea, Bihor, România'
  );
  expect(new URL(urls.embed).searchParams.get('q')).toBe(query);
});
it('does not insert empty street addresses into the fallback search', () => {
  expect(institutionMap('Liceu', 'Oradea', 'Bihor', ' ').search).toBe(
    institutionMap('Liceu', 'Oradea', 'Bihor').search
  );
});
it('escapes the iframe URL and applies dark appearance only when requested', () => {
  const embed = institutionMap('Școală "A & B"', 'Oradea').embed;
  const light = institutionMapDocument(embed);
  const dark = institutionMapDocument(embed, true);
  expect(light).toContain(`src="${embed.replace(/&/g, '&amp;')}"`);
  expect(light).not.toContain('filter:');
  expect(dark).toContain('filter:invert(');
  expect(
    institutionMapDocument('https://maps.google.com/?q="<test>"')
  ).toContain('&quot;&lt;test&gt;&quot;');
});
