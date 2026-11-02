import {
  buildPersonalizedPath,
  type Candidate,
  type RecommendationInput,
} from './personalizedPath';
import { toggleAnswer } from '@/constants/questionnaire';
const course: Candidate = {
  id: 'a',
  type: 'course',
  name: 'Baze',
  domains: ['Tehnologie'],
  skills: [{ id: 'sql', level: 2 }],
  free: true,
  level: 'Începător',
  language: 'Română',
};
const base: RecommendationInput = {
  profile: {
    grade_level: 'XI',
    county: 'Bihor',
    interests: [],
    favorite_subjects: [],
  },
  answers: { domains: ['technology'] },
  candidates: [course],
  savedKeys: [],
  savedSkillIds: [],
  savedCareerIds: [],
  userSkills: [],
  goalSkills: [],
  acceptedKeys: [],
  dismissedKeys: [],
};
const run = (input: Partial<RecommendationInput> = {}) =>
  buildPersonalizedPath({ ...base, ...input });
it('uses a verified goal skill gap and course depth, including partial coverage', () => {
  for (const level of [0, 1]) {
    const result = run({
      goalId: 'career',
      goalSkills: [{ id: 'sql', level: 2 }],
      userSkills: [{ id: 'sql', level }],
    });
    expect(result.items[0].reasons.join(' ')).toContain('Profunzimea');
    expect(result.items[0].score).toBeGreaterThan(run().items[0].score);
  }
  expect(
    run({
      answers: {},
      goalId: 'career',
      goalSkills: [{ id: 'sql', level: 2 }],
      userSkills: [{ id: 'sql', level: 2 }],
    }).items
  ).toEqual([]);
});
it('never treats a saved career as an explicit goal', () => {
  const result = run({ answers: {}, savedCareerIds: ['career'] });
  expect(result.items).toEqual([]);
});
it('uses existing profile selector labels when the questionnaire is skipped', () => {
  expect(
    run({
      answers: {},
      profile: { ...base.profile, interests: ['Științe și tehnologie'] },
    }).items
  ).toHaveLength(1);
  expect(
    run({
      answers: {},
      profile: { ...base.profile, favorite_subjects: ['Limbi străine'] },
      candidates: [{ ...course, domains: ['Limbi'] }],
    }).items
  ).toHaveLength(1);
});
it('excludes accepted, completed and dismissed identities without changing them', () => {
  expect(run({ acceptedKeys: ['course:a'] }).items).toEqual([]);
  expect(run({ dismissedKeys: ['course:a'] }).items).toEqual([]);
});
it('enforces free-only choices and warns about advanced courses without inventing prerequisites', () => {
  expect(
    run({
      answers: { domains: ['technology'], budget: ['free'] },
      candidates: [{ ...course, free: false }],
    }).items
  ).toEqual([]);
  expect(
    run({
      candidates: [{ ...course, level: 'Avansat' }],
    }).items[0].reasons.join(' ')
  ).toContain('Verifică pregătirea');
  expect(
    run({
      candidates: [{ ...course, level: 'Intermediar' }],
      userSkills: [{ id: 'sql', level: 1 }],
    }).items
  ).toHaveLength(1);
  expect(
    run({
      candidates: [{ ...course, level: 'Avansat' }],
      userSkills: [{ id: 'sql', level: 99 }],
    }).items
  ).toEqual(run({ candidates: [{ ...course, level: 'Avansat' }] }).items);
});
it.each([
  'V',
  'VI',
  'VII',
  'VIII',
  'IX',
  'X',
  'XI',
  'XII',
  'student',
  'invalid',
])('filters institutions by stage %s and parent county', (grade) => {
  const school: Candidate = {
    id: 's',
    name: 'Liceu',
    type: 'school',
    county: 'Bihor',
    domains: ['Tehnologie'],
  };
  const program: Candidate = {
    id: 'p',
    name: 'Program',
    type: 'program',
    county: 'Bihor',
    degree: 'bachelor',
    domains: ['Tehnologie'],
  };
  const items = run({
    profile: { ...base.profile, grade_level: grade },
    candidates: [school, program],
  }).items;
  expect(items.some((c) => c.type === 'school')).toBe(
    ['V', 'VI', 'VII', 'VIII'].includes(grade)
  );
  expect(items.some((c) => c.type === 'program')).toBe(
    ['XI', 'XII', 'student'].includes(grade)
  );
  expect(
    run({ profile: { ...base.profile, county: '' }, candidates: [program] })
      .items
  ).toEqual([]);
  expect(run({ candidates: [{ ...program, county: 'Cluj' }] }).items).toEqual(
    []
  );
  expect(run({ candidates: [{ ...program, degree: 'master' }] }).items).toEqual(
    []
  );
});
it('requires completed prerequisites, not just accepted steps', () => {
  const candidate = { ...course, prerequisites: ['skill:sql'] };
  expect(run({ candidates: [candidate] }).items).toEqual([]);
  expect(
    run({ candidates: [candidate], completedKeys: ['skill:sql'] }).items
  ).toHaveLength(1);
  expect(
    run({ candidates: [candidate], acceptedKeys: ['skill:sql'] }).items
  ).toEqual([]);
});
it('has deterministic ties, no duplicate cards, five suggestions and category diversity', () => {
  const candidates = Array.from({ length: 8 }, (_, index) => ({
    ...course,
    id: String(index),
  }));
  const original = JSON.stringify(candidates);
  const forward = run({ candidates: [...candidates, candidates[0]] });
  const backward = run({ candidates: [...candidates].reverse() });
  expect(forward.items).toEqual(backward.items);
  expect(forward.items).toHaveLength(2);
  expect(JSON.stringify(candidates)).toBe(original);
});
it('reports missing mappings rather than declaring full coverage', () => {
  expect(run({ goalId: 'career', goalSkills: [] }).notices.join(' ')).toContain(
    'nu are încă abilități'
  );
});
it('ranks a preferred language ahead of an otherwise equal course', () => {
  const result = run({
    answers: { domains: ['technology'], language: ['en'] },
    candidates: [course, { ...course, id: 'b', language: 'Engleză' }],
  });
  expect(result.items[0].id).toBe('b');
});
it('limits questionnaire selections and keeps unknown exclusive', () => {
  expect(toggleAnswer(['a', 'b'], 'c', 2)).toEqual(['a', 'b']);
  expect(toggleAnswer(['a', 'b'], 'unknown', 2)).toEqual(['unknown']);
  expect(toggleAnswer(['unknown'], 'a', 2)).toEqual(['a']);
  expect(toggleAnswer(['a'], 'b', 1)).toEqual(['b']);
});
