import { normalizeCounty } from '@/constants/profile-options';
export const institutionTables = [
  'schools',
  'school_profiles',
  'universities',
  'programs',
] as const;
export function institutionCounty(
  table: string,
  item: {
    county?: string;
    schools?: { county?: string };
    universities?: { county?: string };
  }
) {
  return normalizeCounty(
    table === 'school_profiles'
      ? item.schools?.county
      : table === 'programs'
        ? item.universities?.county
        : item.county
  );
}
export function institutionVisible(
  table: string,
  item: {
    county?: string;
    schools?: { county?: string };
    universities?: { county?: string };
  },
  county: string
) {
  return (
    !(institutionTables as readonly string[]).includes(table) ||
    (!!normalizeCounty(county) &&
      institutionCounty(table, item) === normalizeCounty(county))
  );
}
export function institutionCountyColumn(table: string) {
  return table === 'school_profiles'
    ? 'schools.county'
    : table === 'programs'
      ? 'universities.county'
      : 'county';
}
