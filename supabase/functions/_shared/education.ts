// Shared by Expo, the authenticated endpoint and database definition generation.
// These are exploration preferences, never psychological or ability measurements.
export const EDUCATION_VERSION = 'bihor-exploration-v1';
export const DEFINITION_VERSION = 1;
export type EducationAnswers = Record<string, string[]>;
export type Question = {
  id: string;
  title: string;
  limit: number;
  options: readonly (readonly [string, string])[];
  universityOnly?: boolean;
};
export type QuestionnaireDefinition = {
  id: string;
  title: string;
  purpose: string;
  minutes: string;
  questions: Question[];
};
const activities = [
  ['solve', 'Să rezolv probleme'],
  ['create', 'Să creez ceva'],
  ['help', 'Să ajut oameni'],
  ['organize', 'Să organizez proiecte'],
  ['build', 'Să construiesc lucruri'],
] as const;
export const QUESTIONNAIRES: QuestionnaireDefinition[] = [
  {
    id: 'interests',
    title: 'Interese și curiozități',
    minutes: '2–3 min',
    purpose: 'Descoperă domenii și activități pe care ai vrea să le explorezi.',
    questions: [
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
        options: activities,
      },
    ],
  },
  {
    id: 'work',
    title: 'Cum îmi place să lucrez',
    minutes: '2 min',
    purpose: 'Alege experiențe potrivite felului în care preferi să lucrezi.',
    questions: [
      {
        id: 'environment',
        title: 'În ce fel de activitate ai vrea să te implici?',
        limit: 2,
        options: activities,
      },
      {
        id: 'collaboration',
        title: 'Cum ai prefera să încerci o activitate nouă?',
        limit: 1,
        options: [['alone', 'În ritmul meu'], [
          'together',
          'Împreună cu cineva',
        ], ['either', 'Oricare variantă']],
      },
      {
        id: 'format',
        title: 'Cum ai vrea să începi explorarea?',
        limit: 1,
        options: [
          ['read', 'Citesc și compar'],
          ['try', 'Încerc ceva practic'],
          ['talk', 'Discut cu cineva despre experiența sa'],
        ],
      },
    ],
  },
  {
    id: 'confidence',
    title: 'Abilități și încredere',
    minutes: '2 min',
    purpose:
      'Separă ce ai încercat deja de ce ai vrea să exersezi. Nu măsoară aptitudini.',
    questions: [
      {
        id: 'tried',
        title: 'Ce ai avut ocazia să încerci?',
        limit: 3,
        options: activities,
      },
      {
        id: 'confidence',
        title: 'Câtă încredere ai când începi o activitate nouă?',
        limit: 1,
        options: [['supported', 'Prefer îndrumare la început'], [
          'independent',
          'Încerc singur și cer ajutor când am nevoie',
        ], ['varies', 'Depinde de activitate']],
      },
      {
        id: 'practice',
        title: 'Ce ai vrea să exersezi?',
        limit: 2,
        options: activities,
      },
    ],
  },
  {
    id: 'practical',
    title: 'Obiective și condiții practice',
    minutes: '2–3 min',
    purpose:
      'Alege următorul pas în funcție de etapa, timpul și resursele tale.',
    questions: [
      {
        id: 'pace',
        title: 'Cu ce ai vrea să începi?',
        limit: 1,
        options: [['explore', 'Să explorez opțiuni'], [
          'practice',
          'Să exersez abilități',
        ], ['study', 'Să aleg ce voi studia']],
      },
      {
        id: 'language',
        title: 'În ce limbă preferi cursurile?',
        limit: 1,
        options: [['ro', 'Română'], ['en', 'Engleză'], ['either', 'Oricare']],
      },
      {
        id: 'budget',
        title: 'Ce cursuri vrei să vezi?',
        limit: 1,
        options: [['free', 'Doar cursuri gratuite'], [
          'any',
          'Gratuite și cu plată',
        ]],
      },
      {
        id: 'time',
        title: 'Cât timp ai pentru următoarea activitate?',
        limit: 1,
        options: [['short', 'Aproximativ 10 minute'], [
          'medium',
          'Aproximativ 30 de minute',
        ], ['long', 'O oră sau mai mult']],
      },
      {
        id: 'field',
        title: 'Care este domeniul studiilor tale actuale?',
        limit: 1,
        universityOnly: true,
        options: [
          ['technology', 'Tehnologie'],
          ['science', 'Științe / sănătate'],
          ['business', 'Economie'],
          ['arts', 'Arte / umanități'],
          ['people', 'Educație / social'],
          ['engineering', 'Inginerie'],
          ['other', 'Alt domeniu'],
        ],
      },
      {
        id: 'degree',
        title: 'La ce nivel studiezi?',
        limit: 1,
        universityOnly: true,
        options: [['bachelor', 'Licență'], ['master', 'Master'], [
          'doctorate',
          'Doctorat',
        ], ['other', 'Altă formă de studiu']],
      },
      {
        id: 'year',
        title: 'În ce an ești?',
        limit: 1,
        universityOnly: true,
        options: [['1', 'Anul I'], ['2', 'Anul II'], ['3', 'Anul III'], [
          '4+',
          'Anul IV sau mai mare',
        ]],
      },
      {
        id: 'goal',
        title: 'Ce ai vrea să clarifici în această etapă?',
        limit: 1,
        universityOnly: true,
        options: [['deepen', 'Aprofundez domeniul actual'], [
          'alternatives',
          'Explorez alte direcții',
        ], ['work', 'Mă pregătesc pentru muncă']],
      },
    ],
  },
];
export type QuestionnaireResponse = {
  answers: EducationAnswers;
  skipped: string[];
  cursor: number;
  status: 'draft' | 'completed';
  attempt: number;
};
export type EducationDocument = {
  user_id: string;
  revision: number;
  version: number;
  responses: Record<string, QuestionnaireResponse>;
  guest_import_id: string | null;
};
export type ActivityState = {
  activity_id: string;
  direction_id: string;
  status: 'accepted' | 'completed' | 'dismissed';
  reflection: 'enjoyed' | 'more' | 'unsure' | 'not_for_me' | null;
};
export const questionsFor = (
  definition: QuestionnaireDefinition,
  grade: string,
) =>
  definition.questions.filter((q) => !q.universityOnly || grade === 'student');
export function questionnaireProgress(
  response: QuestionnaireResponse | undefined,
  questions: Question[],
) {
  const answered =
    questions.filter((q) => response?.answers[q.id]?.length).length;
  const visited =
    questions.filter((q) =>
      response?.answers[q.id]?.length || response?.skipped.includes(q.id)
    ).length;
  return {
    answered,
    visited,
    total: questions.length,
    completed: response?.status === 'completed' && visited === questions.length,
  };
}
export function validateAnswers(
  definition: QuestionnaireDefinition,
  answers: EducationAnswers,
) {
  return !!answers && typeof answers === 'object' && !Array.isArray(answers) &&
    Object.entries(answers).every(([key, values]) => {
      const q = definition.questions.find((question) => question.id === key);
      return q && Array.isArray(values) && values.length <= q.limit &&
        new Set(values).size === values.length &&
        values.every((v) =>
          v === 'unknown' || q.options.some(([id]) => id === v)
        ) &&
        (!values.includes('unknown') || values.length === 1);
    });
}
export function legacyResponses(
  answers: EducationAnswers,
): EducationDocument['responses'] {
  const result: EducationDocument['responses'] = {};
  for (
    const definition of QUESTIONNAIRES.filter((q) =>
      ['interests', 'practical'].includes(q.id)
    )
  ) {
    const matching = Object.fromEntries(
      definition.questions.filter((q) => answers[q.id]?.length).map((
        q,
      ) => [q.id, answers[q.id]]),
    );
    if (Object.keys(matching).length) {
      result[definition.id] = {
        answers: matching,
        cursor: 0,
        skipped: [],
        status: 'draft',
        attempt: 1,
      };
    }
  }
  return result;
}
export const DIRECTIONS = [
  {
    id: 'technology',
    name: 'Tehnologie și informatică',
    activities: ['solve', 'build'],
    subjects: ['informatics', 'math'],
    tags: ['Tehnologie', 'Informatică'],
  },
  {
    id: 'science',
    name: 'Științe și sănătate',
    activities: ['solve', 'help'],
    subjects: ['science'],
    tags: ['Științe', 'Medicină'],
  },
  {
    id: 'business',
    name: 'Economie și organizare',
    activities: ['organize'],
    subjects: ['math', 'social'],
    tags: ['Business', 'Economie'],
  },
  {
    id: 'arts',
    name: 'Arte și comunicare',
    activities: ['create'],
    subjects: ['arts', 'languages'],
    tags: ['Arte', 'Media', 'Arhitectură', 'Limbi'],
  },
  {
    id: 'people',
    name: 'Educație și lucrul cu oamenii',
    activities: ['help'],
    subjects: ['social', 'languages'],
    tags: ['Educație', 'Soft Skills', 'Drept'],
  },
  {
    id: 'engineering',
    name: 'Inginerie și construcție',
    activities: ['build', 'solve'],
    subjects: ['math', 'science'],
    tags: ['Inginerie'],
  },
];
export function rankDirections(
  responses: EducationDocument['responses'],
  reflections: ActivityState[] = [],
  context: {
    interests?: string[];
    subjects?: string[];
    goalDomains?: string[];
    grade?: string;
  } = {},
) {
  const interests = responses.interests?.answers || {};
  const work = responses.work?.answers || {};
  const practice = responses.confidence?.answers.practice || [];
  const study = responses.practical?.answers || {};
  return DIRECTIONS.map((direction) => {
    let score = 0;
    const reasons: string[] = [];
    const add = (points: number, reason: string) => {
      score += points;
      reasons.push(reason);
    };
    const fold = (text: string) =>
      text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const profileDomains: Record<string, string[]> = {
      'stiinte si tehnologie': ['science', 'technology', 'engineering'],
      'arte si umanitati': ['arts'],
      'sanatate si medicina': ['science'],
      'afaceri': ['business'],
    };
    const profileSubjects: Record<string, string[]> = {
      'matematica': ['math'],
      'informatica': ['informatics'],
      'limbi straine': ['languages'],
      'biologie': ['science'],
      'chimie': ['science'],
      'fizica': ['science'],
      'istorie': ['social'],
      'geografie': ['social'],
      'arte': ['arts'],
    };
    if (
      !interests.domains?.length &&
      (context.interests || []).some((value) =>
        profileDomains[fold(value)]?.includes(direction.id) ||
        direction.tags.map(fold).includes(fold(value))
      )
    ) add(4, 'Ai selectat acest interes în profil.');
    if (
      !interests.subjects?.length &&
      (context.subjects || []).some((value) =>
        profileSubjects[fold(value)]?.some((subject) =>
          direction.subjects.includes(subject)
        )
      )
    ) add(3, 'Se leagă de materiile selectate în profil.');
    if (
      context.goalDomains?.some((value) =>
        direction.tags.map(fold).includes(fold(value))
      )
    ) add(4, 'Se leagă de obiectivul profesional ales de tine.');
    if (interests.domains?.includes(direction.id)) {
      add(4, 'Ai ales acest domeniu ca interes.');
    }
    if (direction.subjects.some((s) => interests.subjects?.includes(s))) {
      add(3, 'Se leagă de materiile care îți plac.');
    }
    if (direction.activities.some((a) => interests.activities?.includes(a))) {
      add(2, 'Include activități pe care ai vrea să le încerci.');
    }
    if (direction.activities.some((a) => work.environment?.includes(a))) {
      add(1, 'Se leagă de activitățile de lucru preferate.');
    }
    if (direction.activities.some((a) => practice.includes(a))) {
      add(1, 'Include ceva ce ai ales să exersezi.');
    }
    if (
      context.grade === 'student' && study.goal?.includes('deepen') &&
      study.field?.includes(direction.id)
    ) {
      add(1, 'Ai ales să aprofundezi domeniul studiilor actuale.');
    }
    const feedback = reflections.filter((r) =>
      r.direction_id === direction.id && r.status === 'completed'
    );
    if (
      feedback.some((r) => ['enjoyed', 'more'].includes(r.reflection || ''))
    ) {
      add(
        2,
        'Ai cerut să continui sau ai apreciat o activitate din această direcție.',
      );
    }
    if (feedback.some((r) => r.reflection === 'not_for_me')) {
      add(
        -2,
        'Ai indicat că o activitate nu ți s-a potrivit; poți reexplora direcția.',
      );
    }
    return { ...direction, score, reasons };
  }).filter((d) => d.score > 0).sort((a, b) =>
    b.score - a.score || a.id.localeCompare(b.id)
  ).slice(0, 3);
}
export function stageCopy(grade: string) {
  if (['V', 'VI', 'VII', 'VIII'].includes(grade)) {
    return 'Explorează materii și activități, apoi compară profiluri de liceu din Bihor.';
  }
  if (['IX', 'X'].includes(grade)) {
    return 'Încearcă direcții diferite și construiește baze prin activități și cursuri introductive.';
  }
  if (['XI', 'XII'].includes(grade)) {
    return 'Compară opțiuni de studiu din Bihor și verifică pregătirea și condițiile la sursă.';
  }
  if (grade === 'student') {
    return 'Leagă explorarea de studiile actuale, alternative sau pregătirea pentru muncă.';
  }
  return 'Alege etapa educațională pentru pași mai potriviți.';
}
export function activityFor(
  directionId: string,
  grade: string,
  responses: EducationDocument['responses'],
) {
  const direction = DIRECTIONS.find((d) => d.id === directionId)!;
  const work = responses.work?.answers || {};
  const practical = responses.practical?.answers || {};
  const supported = responses.confidence?.answers.confidence?.includes(
    'supported',
  );
  const format = work.format?.[0] || 'try';
  const task: Record<string, string> = {
    technology:
      'Schițează pașii unei soluții pentru o problemă din viața de zi cu zi. Testează pașii cu un exemplu.',
    science:
      'Alege un fenomen care te intrigă. Scrie o întrebare, caută o explicație într-o resursă educațională și notează ce ai aflat.',
    business:
      'Planifică o mică activitate: scop, trei sarcini și un buget imaginar. Ce ai prioritiza?',
    arts:
      'Creează un text scurt, un desen sau o schiță vizuală care transmite o idee aleasă de tine.',
    people:
      'Explică unui coleg sau unei persoane apropiate un lucru pe care îl cunoști. Întreabă ce a fost clar și ce ai putea explica altfel.',
    engineering:
      'Desenează un obiect util și propune o îmbunătățire. Explică materialele și cum ai verifica ideea, fără unelte sau experimente riscante.',
  };
  const text = format === 'read'
    ? `Compară două opțiuni din direcția ${direction.name.toLowerCase()}: ce vei învăța, ce activități implică și ce întrebări rămân?`
    : format === 'talk'
    ? `Discută cu un profesor sau o persoană cunoscută despre ${direction.name.toLowerCase()}. Întreabă ce face concret, ce îi place și ce este dificil.`
    : task[directionId];
  const context = grade === 'student'
    ? practical.goal?.[0] === 'work'
      ? 'Notează cum ai putea folosi experiența într-un proiect sau la muncă.'
      : practical.goal?.[0] === 'deepen'
      ? 'Leagă exercițiul de un subiect din studiile actuale.'
      : 'Compară experiența cu domeniul studiilor tale actuale.'
    : ['V', 'VI', 'VII', 'VIII'].includes(grade)
    ? 'Leagă experiența de o materie și de un profil de liceu pe care ai vrea să îl explorezi.'
    : ['XI', 'XII'].includes(grade)
    ? 'Notează o întrebare de verificat despre un program de studiu din Bihor.'
    : 'Notează ce ai vrea să mai exersezi înainte de o alegere de studiu.';
  return {
    id: `${directionId}:${format}`,
    directionId,
    title: `Încearcă: ${direction.name}`,
    text: `${text} ${context}${
      supported
        ? ' Poți cere unui profesor sau unei persoane apropiate să te ghideze.'
        : ''
    }${
      work.collaboration?.includes('together')
        ? ' Invită pe cineva cunoscut să participe.'
        : ''
    }`,
    minutes: practical.time?.[0] === 'long'
      ? 60
      : practical.time?.[0] === 'medium'
      ? 30
      : 10,
  };
}
