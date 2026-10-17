import { analyzeGaps, GapResult, Skill } from './gapAnalysis';

export interface Course {
  id: string;
  title: string;
  provider: string;
  url: string;
  language: string;
  isFree: boolean;
  level: string;
  skills: CourseSkill[];
}

export interface CourseSkill {
  skillId: string;
  depth: number; // 1-3
}

export interface RecommendationStep {
  skill: Skill;
  courses: Course[];
}

export interface RecommendationResult {
  covered: Skill[];
  partial: Skill[];
  missing: Skill[];
  steps: RecommendationStep[];
}

export function generateRecommendations(
  userSkills: Skill[],
  careerSkills: { skillId: string; importance: number }[],
  courses: Course[]
): RecommendationResult {
  // Run gap analysis
  const gapResult = analyzeGaps(userSkills, careerSkills);

  // Map courses to missing and partial skills
  const steps: RecommendationStep[] = [];

  // Process missing skills first
  for (const missingSkill of gapResult.missing) {
    const relevantCourses = findRelevantCourses(missingSkill.id, courses);
    steps.push({
      skill: missingSkill,
      courses: relevantCourses,
    });
  }

  // Process partial skills
  for (const partialSkill of gapResult.partial) {
    const relevantCourses = findRelevantCourses(partialSkill.id, courses);
    steps.push({
      skill: partialSkill,
      courses: relevantCourses,
    });
  }

  return {
    covered: gapResult.covered,
    partial: gapResult.partial,
    missing: gapResult.missing,
    steps,
  };
}

function findRelevantCourses(skillId: string, courses: Course[]): Course[] {
  // Find courses that teach this skill
  const relevantCourses = courses.filter((course) =>
    course.skills.some((cs) => cs.skillId === skillId)
  );

  // Sort by:
  // 1. Free first
  // 2. Skill depth match (higher depth first)
  // 3. Level (beginner first)
  return relevantCourses.sort((a, b) => {
    // Free courses first
    if (a.isFree && !b.isFree) return -1;
    if (!a.isFree && b.isFree) return 1;

    // Skill depth match
    const aDepth = a.skills.find((cs) => cs.skillId === skillId)?.depth || 0;
    const bDepth = b.skills.find((cs) => cs.skillId === skillId)?.depth || 0;
    if (aDepth !== bDepth) return bDepth - aDepth;

    // Level (beginner < intermediate < advanced)
    const levelOrder = { 'Începător': 0, 'Mediu': 1, 'Avansat': 2 };
    const aLevel = levelOrder[a.level as keyof typeof levelOrder] ?? 1;
    const bLevel = levelOrder[b.level as keyof typeof levelOrder] ?? 1;
    return aLevel - bLevel;
  });
}
