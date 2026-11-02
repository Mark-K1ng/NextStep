import { COUNTIES, GRADES, normalizeCounty } from '@/constants/profile-options';
import { gradeSchema, locationSchema, registrationSchema } from './validators';
it('offers all 41 counties plus Bucharest and grades V–XII plus university', () => {
  expect(COUNTIES).toHaveLength(42);
  expect(new Set(COUNTIES).size).toBe(42);
  expect(GRADES).toEqual([
    'V',
    'VI',
    'VII',
    'VIII',
    'IX',
    'X',
    'XI',
    'XII',
    'student',
  ]);
  expect(gradeSchema.safeParse('student').success).toBe(true);
  expect(gradeSchema.safeParse('anything').success).toBe(false);
});
it('requires a valid sector for Bucharest and rejects sectors elsewhere', () => {
  for (const sector of [1, 2, 3, 4, 5, 6])
    expect(
      locationSchema.safeParse({ county: 'București', sector }).success
    ).toBe(true);
  for (const sector of [null, 0, 7, 1.5])
    expect(
      locationSchema.safeParse({ county: 'București', sector }).success
    ).toBe(false);
  expect(locationSchema.safeParse({ county: 'Bihor', sector: 1 }).success).toBe(
    false
  );
  expect(
    locationSchema.safeParse({ county: 'Bihor', sector: null }).success
  ).toBe(true);
  expect(locationSchema.safeParse({ county: 'invented' }).success).toBe(false);
});
it('recognizes existing unaccented county values without allowing arbitrary input', () => {
  expect(normalizeCounty('Bucuresti')).toBe('București');
  expect(normalizeCounty('timis')).toBe('Timiș');
  expect(normalizeCounty('other')).toBe('');
});
it('applies the same county/sector validation to registration', () => {
  const form = {
    email: 'student@example.com',
    password: 'long-password',
    confirmPassword: 'long-password',
    gradeLevel: 'student',
    acceptedTerms: true,
  };
  expect(
    registrationSchema.safeParse({ ...form, county: 'București' }).success
  ).toBe(false);
  expect(
    registrationSchema.safeParse({ ...form, county: 'București', sector: 6 })
      .success
  ).toBe(true);
});
