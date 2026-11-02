import { analyzeGap, UserSkill, CareerSkill, Course } from './gapAnalysis';

describe('analyzeGap', () => {
  it('recommends resources for a skill that is partly covered', () => {
    const courses: Course[] = [{ id: 'course', title: 'Programare', provider: 'Provider', url: 'https://example.com/course', language: 'română', is_free: true, level: 'intermediate', skills: [{ id: 'skill', name: 'Programare', depth: 3 }] }];
    const result = analyzeGap([{ id: 'skill', name: 'Programare', level: 1 }], [{ id: 'skill', name: 'Programare', importance: 3 }], courses);
    expect(result.missing).toHaveLength(0);
    expect(result.partial).toHaveLength(1);
    expect(result.steps[0].courses[0].id).toBe('course');
  });
  it('should correctly identify covered, partial, and missing skills', () => {
    const userSkills: UserSkill[] = [
      { id: '1', name: 'Programare', level: 3 },
      { id: '2', name: 'Analiză de date', level: 2 },
      { id: '3', name: 'Gestiune de proiecte', level: 1 },
    ];

    const careerSkills: CareerSkill[] = [
      { id: '1', name: 'Programare', importance: 3 },
      { id: '2', name: 'Analiză de date', importance: 2 },
      { id: '3', name: 'Gestiune de proiecte', importance: 3 },
      { id: '4', name: 'Comunicare', importance: 3 },
    ];

    const courses: Course[] = []; // Not used in this test

    const result = analyzeGap(userSkills, careerSkills, courses);

    // Check covered skills
    expect(result.covered).toHaveLength(2);
    expect(result.covered[0].name).toBe('Programare');
    expect(result.covered[0].level).toBe(3);
    expect(result.covered[1].name).toBe('Analiză de date');
    expect(result.covered[1].level).toBe(2);

    // Check partial skills
    expect(result.partial).toHaveLength(1);
    expect(result.partial[0].name).toBe('Gestiune de proiecte');
    expect(result.partial[0].level).toBe(1);
    expect(result.partial[0].required).toBe(3);

    // Check missing skills
    expect(result.missing).toHaveLength(1);
    expect(result.missing[0].name).toBe('Comunicare');
    expect(result.missing[0].level).toBe(0);
    expect(result.missing[0].required).toBe(3);
  });

  it('should handle empty inputs', () => {
    const result = analyzeGap([], [], []);
    expect(result.covered).toHaveLength(0);
    expect(result.partial).toHaveLength(0);
    expect(result.missing).toHaveLength(0);
    expect(result.steps).toHaveLength(0);
  });

  it('should sort by importance', () => {
    const userSkills: UserSkill[] = [
      { id: '1', name: 'Skill A', level: 1 },
      { id: '2', name: 'Skill B', level: 1 },
    ];

    const careerSkills: CareerSkill[] = [
      { id: '1', name: 'Skill A', importance: 1 },
      { id: '2', name: 'Skill B', importance: 3 },
    ];

    const courses: Course[] = [];

    const result = analyzeGap(userSkills, careerSkills, courses);

    // Skill B should come first in partial because it has higher importance
    expect(result.partial[0].name).toBe('Skill B');
  });
});
