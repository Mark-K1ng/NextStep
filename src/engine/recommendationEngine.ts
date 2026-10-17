import { analyzeGaps, Skill } from './gapAnalysis';

/**
 * Course interface
 * Represents a learning course that teaches specific skills
 */
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

/**
 * Course skill interface
 * Represents a skill taught by a course with depth level
 */
export interface CourseSkill {
  skillId: string;
  depth: number; // 1-3, where 1 = basic coverage, 2 = good coverage, 3 = comprehensive
}

/**
 * Recommendation step interface
 * Maps a skill to recommended courses for learning it
 */
export interface RecommendationStep {
  skill: Skill;
  courses: Course[];
}

/**
 * Recommendation result interface
 * Contains gap analysis and course recommendations
 */
export interface RecommendationResult {
  covered: Skill[];
  partial: Skill[];
  missing: Skill[];
  steps: RecommendationStep[];
}

/**
 * Generates course recommendations based on skill gaps
 * 
 * This function performs gap analysis between user skills and career requirements,
 * then maps courses to missing and partial skills. Courses are sorted by:
 * 1. Free courses first
 * 2. Skill depth (higher depth = more comprehensive coverage)
 * 3. Course level (beginner courses first)
 * 
 * @param userSkills - Array of skills the user currently has
 * @param careerSkills - Array of skill requirements for the target career
 * @param courses - Array of available courses
 * @returns RecommendationResult with gap analysis and course recommendations
 * 
 * @example
 * ```ts
 * const userSkills = [{ id: '1', name: 'JavaScript', level: 1 }];
 * const careerSkills = [{ skillId: '1', importance: 3 }];
 * const courses = [{ id: 'c1', title: 'JS Basics', skills: [{ skillId: '1', depth: 2 }], isFree: true }];
 * const result = generateRecommendations(userSkills, careerSkills, courses);
 * // result.steps will contain recommended courses for partial/missing skills
 * ```
 */
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

/**
 * Finds and sorts courses relevant to a specific skill
 * 
 * @param skillId - The ID of the skill to find courses for
 * @param courses - Array of available courses
 * @returns Sorted array of relevant courses
 * 
 * Sorting priority:
 * 1. Free courses first
 * 2. Higher skill depth (more comprehensive coverage)
 * 3. Beginner-level courses first
 */
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
