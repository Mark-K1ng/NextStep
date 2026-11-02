export const QUESTIONNAIRE_VERSION = 1;
export type Answers = Partial<
  Record<
    'domains' | 'subjects' | 'activities' | 'language' | 'budget' | 'pace',
    string[]
  >
>;
export const QUESTIONS: {
  id: keyof Answers;
  title: string;
  limit: number;
  options: readonly (readonly [string, string])[];
}[] = [
  {
    id: 'domains',
    title: 'Ce domenii îți stârnesc curiozitatea?',
    limit: 3,
    options: [
      ['technology', 'Tehnologie'],
      ['science', 'Științe'],
      ['business', 'Economie și afaceri'],
      ['arts', 'Arte și media'],
      ['people', 'Lucrul cu oamenii'],
      ['engineering', 'Inginerie'],
    ],
  },
  {
    id: 'subjects',
    title: 'Ce materii îți plac?',
    limit: 3,
    options: [
      ['math', 'Matematică'],
      ['informatics', 'Informatică'],
      ['science', 'Științe ale naturii'],
      ['languages', 'Limbi și literatură'],
      ['social', 'Științe sociale'],
      ['arts', 'Arte'],
    ],
  },
  {
    id: 'activities',
    title: 'Ce ți-ar plăcea să faci mai des?',
    limit: 2,
    options: [
      ['solve', 'Să rezolv probleme'],
      ['create', 'Să creez ceva'],
      ['help', 'Să ajut oameni'],
      ['organize', 'Să organizez proiecte'],
      ['build', 'Să construiesc lucruri'],
    ],
  },
  {
    id: 'language',
    title: 'În ce limbă preferi cursurile?',
    limit: 1,
    options: [
      ['ro', 'Română'],
      ['en', 'Engleză'],
      ['either', 'Oricare'],
    ],
  },
  {
    id: 'budget',
    title: 'Ce cursuri vrei să vezi?',
    limit: 1,
    options: [
      ['free', 'Doar cursuri gratuite'],
      ['any', 'Gratuite și cu plată'],
    ],
  },
  {
    id: 'pace',
    title: 'Cu ce ai vrea să începi?',
    limit: 1,
    options: [
      ['explore', 'Să explorez opțiuni'],
      ['practice', 'Să exersez abilități'],
      ['study', 'Să aleg ce voi studia'],
    ],
  },
];
export function toggleAnswer(
  current: string[],
  value: string,
  limit: number
): string[] {
  if (current.includes(value)) {
    return current.filter((item) => item !== value);
  }
  if (value === 'unknown' || limit === 1) {
    return [value];
  }
  const values = current.filter((item) => item !== 'unknown');
  return values.length < limit ? [...values, value] : current;
}
