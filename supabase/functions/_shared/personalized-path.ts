type Answers = Partial<
  Record<
    'domains' | 'subjects' | 'activities' | 'language' | 'budget' | 'pace',
    string[]
  >
>;
type Profile = {
  grade_level: string;
  county: string;
  interests: string[];
  favorite_subjects: string[];
};
export const ALGORITHM_VERSION = 'interests-v1';
export type RecommendationType =
  | 'school'
  | 'university'
  | 'program'
  | 'career'
  | 'course'
  | 'skill';
export type SkillMapping = { id: string; level: number };
export interface Candidate {
  id: string;
  type: RecommendationType;
  name: string;
  county?: string;
  domains: string[];
  subjects?: string[];
  skills?: SkillMapping[];
  careerIds?: string[];
  degree?: string;
  language?: string;
  free?: boolean;
  level?: string;
  prerequisites?: string[];
  schoolProfileIds?: string[];
}
export interface Recommendation extends Candidate {
  key: string;
  score: number;
  reasons: string[];
}
export interface RecommendationInput {
  profile: Pick<
    Profile,
    'grade_level' | 'county' | 'interests' | 'favorite_subjects'
  >;
  answers: Answers;
  candidates: Candidate[];
  savedKeys: string[];
  savedSkillIds: string[];
  savedCareerIds: string[];
  userSkills: SkillMapping[];
  goalId?: string;
  goalSkills: SkillMapping[];
  acceptedKeys: string[];
  completedKeys?: string[];
  dismissedKeys: string[];
}
export const fold = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
const domains: Record<string, string[]> = {
  technology: ['Tehnologie'],
  science: ['Științe', 'Medicină'],
  business: ['Business', 'Economie'],
  arts: ['Arte', 'Media', 'Arhitectură'],
  people: ['Educație', 'Soft Skills', 'Drept', 'Medicină'],
  engineering: ['Inginerie', 'Matematică'],
};
const subjects: Record<string, string[]> = {
  math: ['Matematică'],
  informatics: ['Informatică', 'Tehnologie'],
  science: ['Biologie', 'Chimie', 'Fizică', 'Științe'],
  languages: ['Limba română', 'Limba engleză', 'Limbi', 'Română', 'Engleză'],
  social: ['Istorie', 'Geografie', 'Științe sociale'],
  arts: ['Arte', 'Desen', 'Muzică'],
};
const activities: Record<string, string[]> = {
  solve: ['Matematică', 'Tehnologie', 'Științe'],
  create: ['Arte', 'Media', 'Arhitectură'],
  help: ['Educație', 'Medicină', 'Soft Skills'],
  organize: ['Business', 'Economie'],
  build: ['Inginerie', 'Tehnologie'],
};
// Exact aliases from the existing signup/profile selectors, not inferred facts.
const profileAliases: Record<string, string[]> = {
  [fold('Științe și tehnologie')]: ['Științe', 'Tehnologie', 'Inginerie'],
  [fold('Arte și umanități')]: ['Arte', 'Media', 'Limbi'],
  [fold('Sănătate și medicină')]: ['Medicină', 'Științe'],
  [fold('Afaceri')]: ['Business', 'Economie'],
  [fold('Limbi străine')]: ['Limbi'],
};
const profileLabels = (values: string[]) =>
  values.flatMap((value) => profileAliases[fold(value)] || [value]).map(fold);
const validLevel = (level: number) =>
  Number.isInteger(level) && level >= 0 && level <= 3;
const expanded = (values: string[], mapping: Record<string, string[]>) =>
  values.flatMap((value) => mapping[value] || []).map(fold);
const tableToType: Record<string, string> = {
  schools: 'school',
  universities: 'university',
  programs: 'program',
  careers: 'career',
  courses: 'course',
  skills: 'skill',
};
export const recommendationKey = (type: string, id: string) =>
  `${tableToType[type] || type}:${id}`;

/** Deterministic preferences ranking, not a psychometric or admission score.
 * Only catalogue relationships connect skills, courses, programs and careers.
 * Scores order suggestions internally; they never represent probabilities.
 */
export function buildPersonalizedPath(input: RecommendationInput): {
  items: Recommendation[];
  notices: string[];
} {
  const { profile, answers } = input;
  const middle = ['V', 'VI', 'VII', 'VIII'].includes(profile.grade_level);
  const late = ['XI', 'XII', 'student'].includes(profile.grade_level);
  const validGrade = middle || late ||
    ['IX', 'X'].includes(profile.grade_level);
  const notices: string[] = [];
  if (!validGrade) {
    notices.push(
      'Completează clasa în Profil pentru sugestii potrivite etapei tale.',
    );
  }
  if (!profile.county) {
    notices.push('Alege județul în Profil pentru recomandări de instituții.');
  }
  if (
    !Object.values(answers).some((values) =>
      values?.some((v) => v !== 'unknown')
    )
  ) {
    notices.push('Completează preferințele pentru recomandări mai relevante.');
  }
  if (input.goalId && !input.goalSkills.length) {
    notices.push(
      'Obiectivul ales nu are încă abilități asociate în catalog; nu putem calcula lipsurile.',
    );
  }
  const wantedDomains = new Set([
    ...expanded(answers.domains || [], domains),
    ...expanded(answers.activities || [], activities),
    ...profileLabels((answers.domains?.length ? [] : profile.interests) || []),
  ]);
  const wantedSubjects = new Set([
    ...expanded(answers.subjects || [], subjects),
    ...profileLabels(
      !answers.subjects?.length ? profile.favorite_subjects : [],
    ),
  ]);
  const levels = new Map(
    input.userSkills
      .filter((s) => validLevel(s.level))
      .map((s) => [s.id, s.level]),
  );
  const gaps = input.goalSkills.filter(
    (s) =>
      Number.isInteger(s.level) &&
      s.level >= 1 &&
      s.level <= 3 &&
      (levels.get(s.id) || 0) < s.level,
  );
  const saved = new Set(input.savedKeys),
    accepted = new Set(input.acceptedKeys),
    dismissed = new Set(input.dismissedKeys);
  const ranked: Recommendation[] = [];
  const seen = new Set<string>();
  for (const candidate of input.candidates) {
    const c = candidate,
      key = recommendationKey(c.type, c.id);
    if (seen.has(key) || accepted.has(key) || dismissed.has(key)) {
      continue;
    }
    seen.add(key);
    if (
      c.prerequisites?.some(
        (required) => !input.completedKeys?.includes(required),
      )
    ) {
      continue;
    }
    if (
      ['school', 'university', 'program'].includes(c.type) &&
      (!profile.county || fold(c.county || '') !== fold(profile.county))
    ) {
      continue;
    }
    if (c.type === 'school' && !middle) {
      continue;
    }
    if (['program', 'university'].includes(c.type) && !late) {
      continue;
    }
    if (c.type === 'program' && c.degree !== 'bachelor') {
      continue;
    }
    if (c.type === 'career' && (!late || !!input.goalId)) {
      continue;
    }
    if (
      c.type === 'course' &&
      answers.budget?.includes('free') &&
      c.free !== true
    ) {
      continue;
    }
    const mappings = (c.skills || []).filter(
      (s) => Number.isInteger(s.level) && s.level >= 1 && s.level <= 3,
    );
    const courseLevel = fold(c.level || '');
    if (
      c.type === 'course' &&
      courseLevel === 'liceu' &&
      (middle || !validGrade)
    ) {
      continue;
    }
    let score = 0;
    const reasons: string[] = [];
    const add = (points: number, reason: string) => {
      score += points;
      reasons.push(reason);
    };
    const relevantGaps = mappings.filter((s) =>
      gaps.some((g) => g.id === s.id)
    );
    if (c.type === 'course' && relevantGaps.length) {
      const importance = Math.max(
        ...relevantGaps.map((s) => gaps.find((g) => g.id === s.id)!.level),
      );
      add(
        12 + importance,
        'Exersează abilități de explorat pentru obiectivul ales.',
      );
      if (
        relevantGaps.some(
          (s) => s.level >= (gaps.find((g) => g.id === s.id)?.level || 4),
        )
      ) {
        add(
          2,
          'Profunzimea din catalog acoperă nivelul cerut pentru cel puțin o abilitate.',
        );
      }
    }
    if (c.type === 'skill' && gaps.some((g) => g.id === c.id)) {
      add(15, 'Autoevaluează această abilitate cerută de obiectivul tău.');
    }
    if (
      c.type === 'program' &&
      input.goalId &&
      c.careerIds?.includes(input.goalId)
    ) {
      add(16, 'Programul este asociat în catalog cu obiectivul ales.');
    }
    if (c.domains.some((domain) => wantedDomains.has(fold(domain)))) {
      add(4, 'Are legătură cu domeniile sau activitățile alese de tine.');
    }
    if (
      [...(c.subjects || []), ...c.domains].some((subject) =>
        wantedSubjects.has(fold(subject))
      )
    ) {
      add(3, 'Se leagă de materiile care îți plac.');
    }
    if (saved.has(key)) {
      add(2, 'Ai salvat această opțiune ca interes.');
    }
    if (mappings.some((s) => input.savedSkillIds.includes(s.id))) {
      add(5, 'Se leagă de abilități asociate opțiunilor tale salvate.');
    }
    if (
      c.type === 'program' &&
      c.careerIds?.some((id) => input.savedCareerIds.includes(id))
    ) {
      add(5, 'Se leagă de o carieră salvată de tine.');
    }
    if (score === 0) {
      continue;
    }
    if (c.type === 'course') {
      if (['incepator', 'beginner'].includes(courseLevel)) {
        score += 2;
      }
      if (
        ['avansat', 'advanced', 'intermediar', 'intermediate'].includes(
          courseLevel,
        )
      ) {
        const minimum = ['avansat', 'advanced'].includes(courseLevel) ? 2 : 1;
        if (
          mappings.length &&
          mappings.every((s) => (levels.get(s.id) || 0) >= minimum)
        ) {
          score += 1;
        } else {
          reasons.push(
            'Curs de nivel ' +
              (c.level || '') +
              '. Verifică pregătirea necesară la furnizor.',
          );
        }
      }
    }
    if (
      c.type === 'skill' &&
      (levels.get(c.id) || 0) > 0 &&
      !gaps.some((g) => g.id === c.id)
    ) {
      continue;
    }
    if (
      answers.pace?.includes('practice') &&
      ['course', 'skill'].includes(c.type)
    ) {
      score++;
    }
    if (
      answers.pace?.includes('study') &&
      ['school', 'program', 'university'].includes(c.type)
    ) {
      score++;
    }
    if (c.type === 'course') {
      const language = fold(c.language || '');
      if (
        (answers.language?.includes('ro') && language === 'romana') ||
        (answers.language?.includes('en') && language === 'engleza')
      ) {
        add(1, 'Disponibil în limba preferată.');
      }
    }
    ranked.push({ ...c, key, score, reasons });
  }
  ranked.sort(
    (a, b) =>
      b.score - a.score ||
      Number(b.free === true) - Number(a.free === true) ||
      a.key.localeCompare(b.key, 'en'),
  );
  const counts = new Map<string, number>();
  const items = ranked
    .filter((item) => {
      const count = counts.get(item.type) || 0;
      counts.set(item.type, count + 1);
      return count < 2;
    })
    .slice(0, 5);
  notices.push(
    'Sugestiile sunt orientative. Verifică cerințele de admitere și ale cursurilor la sursă; catalogul nu conține toate condițiile de acces.',
  );
  return { items, notices };
}
