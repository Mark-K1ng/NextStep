import {
  QUESTIONNAIRES,
  questionsFor,
  questionnaireProgress,
  validateAnswers,
  rankDirections,
  activityFor,
  stageCopy,
  legacyResponses,
  type EducationDocument,
  type QuestionnaireResponse,
} from '../../supabase/functions/_shared/education';
const response = (
  answers: Record<string, string[]>
): QuestionnaireResponse => ({
  answers,
  skipped: [],
  cursor: 0,
  status: 'draft',
  attempt: 1,
});
it('does not invent a direction from absent, skipped or unknown answers', () => {
  expect(rankDirections({})).toEqual([]);
  expect(
    rankDirections({ interests: response({ domains: ['unknown'] }) })
  ).toEqual([]);
});
it('keeps existing profile and explicit-goal signals useful without forcing another questionnaire', () => {
  expect(
    rankDirections({}, [], {
      interests: ['Științe și tehnologie'],
      subjects: ['Informatică'],
    })[0].id
  ).toBe('technology');
  expect(rankDirections({}, [], { goalDomains: ['Inginerie'] })[0].id).toBe(
    'engineering'
  );
  expect(
    rankDirections(
      { interests: response({ domains: ['unknown'], subjects: ['unknown'] }) },
      [],
      { interests: ['Științe și tehnologie'], subjects: ['Informatică'] }
    )
  ).toEqual([]);
});
it('retains the 4/3/2 interest baseline, deterministic ties and explainable signals without mutating inputs', () => {
  const input = {
    interests: response({
      domains: ['technology'],
      subjects: ['math'],
      activities: ['build'],
    }),
  };
  const original = JSON.stringify(input);
  const ranked = rankDirections(input);
  expect(ranked[0].id).toBe('technology');
  expect(ranked[0].score).toBe(9);
  expect(ranked[0].reasons).toHaveLength(3);
  expect(rankDirections(input)).toEqual(ranked);
  expect(JSON.stringify(input)).toBe(original);
});
it('uses desired practice as a signal but never treats self-reported confidence or past exposure as measured ability', () => {
  expect(
    rankDirections({
      confidence: response({ confidence: ['independent'], tried: ['solve'] }),
    })
  ).toEqual([]);
  expect(
    rankDirections({ confidence: response({ practice: ['build'] }) }).map(
      (d) => d.id
    )
  ).toContain('engineering');
});
it('uses completed reflections, keeps uncertainty neutral and permits re-exploration', () => {
  const input = { interests: response({ domains: ['technology'] }) };
  const activity = {
    activity_id: 'technology:try',
    direction_id: 'technology',
    status: 'completed' as const,
    reflection: 'more' as const,
  };
  expect(rankDirections(input, [activity])[0].score).toBe(6);
  expect(
    rankDirections(input, [{ ...activity, reflection: 'unsure' }])[0].score
  ).toBe(4);
  expect(
    rankDirections(input, [{ ...activity, reflection: 'not_for_me' }])[0].score
  ).toBe(2);
  expect(
    rankDirections(input, [{ ...activity, status: 'accepted' }])[0].score
  ).toBe(4);
});
it('migrates only semantically identical legacy fields and never marks new questionnaires complete', () => {
  expect(legacyResponses({ domains: ['arts'], budget: ['free'] })).toEqual({
    interests: response({ domains: ['arts'] }),
    practical: response({ budget: ['free'] }),
  });
  expect(legacyResponses({})).toEqual({});
});
it('distinguishes a skipped question from an unknown answer and requires all applicable questions to finish', () => {
  const qs = questionsFor(QUESTIONNAIRES[0], 'VIII');
  const state = {
    ...response({ domains: ['unknown'] }),
    skipped: ['subjects'],
    status: 'completed' as const,
  };
  expect(questionnaireProgress(state, qs)).toEqual({
    answered: 1,
    visited: 2,
    total: 3,
    completed: false,
  });
  expect(
    questionnaireProgress({ ...state, skipped: ['subjects', 'activities'] }, qs)
      .completed
  ).toBe(true);
});
it.each(['V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'])(
  'keeps university context out of %s intake',
  (grade) => {
    expect(questionsFor(QUESTIONNAIRES[3], grade)).toHaveLength(4);
    expect(stageCopy(grade)).not.toContain('actuale');
  }
);
it('collects university field, degree, year and goal without inferring eligibility', () => {
  expect(questionsFor(QUESTIONNAIRES[3], 'student').map((q) => q.id)).toEqual([
    'pace',
    'language',
    'budget',
    'time',
    'field',
    'degree',
    'year',
    'goal',
  ]);
});
it.each([
  { domains: ['unknown', 'arts'] },
  { domains: ['arts', 'arts'] },
  { domains: ['not-a-domain'] },
  { domains: ['science', 'people', 'arts', 'technology'] },
  { fake: ['arts'] },
])('rejects invalid or contradictory choices %p', (answers) => {
  expect(validateAnswers(QUESTIONNAIRES[0], answers)).toBe(false);
});
it('adapts practical experiences by stage, time, work preference and university goal without claiming a result', () => {
  const responses: EducationDocument['responses'] = {
    practical: response({ time: ['medium'], goal: ['work'] }),
    work: response({ collaboration: ['together'], format: ['read'] }),
    confidence: response({ confidence: ['supported'] }),
  };
  expect(activityFor('technology', 'student', responses)).toMatchObject({
    id: 'technology:read',
    minutes: 30,
  });
  expect(activityFor('technology', 'student', responses).text).toContain(
    'muncă'
  );
  expect(activityFor('technology', 'VIII', responses).text).toContain(
    'profil de liceu'
  );
});
