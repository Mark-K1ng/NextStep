import { ro } from '@/i18n/ro';
export const COUNTIES = [
  'Alba',
  'Arad',
  'Argeș',
  'Bacău',
  'Bihor',
  'Bistrița-Năsăud',
  'Botoșani',
  'Brăila',
  'Brașov',
  'București',
  'Buzău',
  'Călărași',
  'Caraș-Severin',
  'Cluj',
  'Constanța',
  'Covasna',
  'Dâmbovița',
  'Dolj',
  'Galați',
  'Giurgiu',
  'Gorj',
  'Harghita',
  'Hunedoara',
  'Ialomița',
  'Iași',
  'Ilfov',
  'Maramureș',
  'Mehedinți',
  'Mureș',
  'Neamț',
  'Olt',
  'Prahova',
  'Sălaj',
  'Satu Mare',
  'Sibiu',
  'Suceava',
  'Teleorman',
  'Timiș',
  'Tulcea',
  'Vâlcea',
  'Vaslui',
  'Vrancea',
] as const;
export const GRADES = [
  'V',
  'VI',
  'VII',
  'VIII',
  'IX',
  'X',
  'XI',
  'XII',
  'student',
] as const;
export const SECTORS = [1, 2, 3, 4, 5, 6] as const;
export const gradeLabel = (value: string) =>
  value === 'student'
    ? ro.profileChoices.university
    : `${ro.profileChoices.classPrefix}${value}${ro.profileChoices.classSuffix}`;
export function normalizeCounty(value?: string): string {
  const fold = (text: string) =>
    text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  return COUNTIES.find((county) => fold(county) === fold(value || '')) || '';
}
