import { recommendCourses, Course } from './recommendationEngine';
import { analyzeGap, UserSkill, CareerSkill } from './gapAnalysis';

describe('recommendCourses', () => {
  it('should recommend courses for missing skills', () => {
    const userSkills: UserSkill[] = [
      { id: '1', name: 'Programare', level: 3 },
      { id: '2', name: 'Analiză de date', level: 2 },
    ];

    const careerSkills: CareerSkill[] = [
      { id: '1', name: 'Programare', importance: 3 },
      { id: '2', name: 'Analiză de date', importance: 2 },
      { id: '3', name: 'Comunicare', importance: 3 },
    ];

    const courses: Course[] = [
      {
        id: '1',
        title: 'Comunicare eficientă',
        provider: 'LinkedIn Learning',
        url: 'https://example.com',
        language: 'română',
        is_free: true,
        level: 'intermediar',
        skills: [{ id: '3', name: 'Comunicare', depth: 3 }],
      },
      {
        id: '2',
        title: 'Abilități de prezentare',
        provider: 'Coursera',
        url: 'https://example.com',
        language: 'engleză',
        is_free: true,
        level: 'incepator',
        skills: [{ id: '3', name: 'Comunicare', depth: 2 }],
      },
    ];

    const gapAnalysis = analyzeGap(userSkills, careerSkills, courses);
    const recommendations = recommendCourses(gapAnalysis, courses);

    expect(recommendations).toHaveLength(1);
    expect(recommendations[0].skill).toBe('Comunicare');
    expect(recommendations[0].courses).toHaveLength(2);
    // Free course should come first
    expect(recommendations[0].courses[0].is_free).toBe(true);
    expect(recommendations[0].courses[0].title).toBe('Comunicare eficientă');
  });
});
