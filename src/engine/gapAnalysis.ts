/**
 * User skill interface
 * Represents a skill the user has acquired
 */
export interface Skill {
  id: string;
  name: string;
  level: number; // 1-3, where 1 = beginner, 2 = intermediate, 3 = advanced
}

/**
 * Career skill requirement interface
 * Represents a skill required for a specific career
 */
export interface CareerSkill {
  skillId: string;
  importance: number; // 1-3, where 1 = nice to have, 2 = recommended, 3 = required
}

/**
 * Gap analysis result interface
 * Categorizes skills based on user's current level vs career requirements
 */
export interface GapResult {
  covered: Skill[]; // Skills user has at sufficient level
  partial: Skill[]; // Skills user has but at insufficient level
  missing: Skill[]; // Skills user doesn't have at all
}

/**
 * Analyzes skill gaps between user's current skills and career requirements
 * 
 * This function compares user skills against career skill requirements and categorizes
 * them into three groups:
 * - covered: user has the skill at or above the required level
 * - partial: user has the skill but below the required level
 * - missing: user doesn't have the skill at all
 * 
 * Results are sorted by importance within each category (highest importance first)
 * 
 * @param userSkills - Array of skills the user currently has
 * @param careerSkills - Array of skill requirements for the target career
 * @returns GapResult with categorized skills
 * 
 * @example
 * ```ts
 * const userSkills = [{ id: '1', name: 'JavaScript', level: 2 }];
 * const careerSkills = [{ skillId: '1', importance: 3 }];
 * const result = analyzeGaps(userSkills, careerSkills);
 * // result.partial will contain the JavaScript skill
 * ```
 */
export function analyzeGaps(
  userSkills: Skill[],
  careerSkills: CareerSkill[]
): GapResult {
  const result: GapResult = {
    covered: [],
    partial: [],
    missing: [],
  };

  // Create a map of user skills for quick lookup
  const userSkillMap = new Map(userSkills.map((s) => [s.id, s.level]));

  // Analyze each career skill
  for (const careerSkill of careerSkills) {
    const userLevel = userSkillMap.get(careerSkill.skillId);

    if (userLevel === undefined) {
      // User doesn't have this skill at all
      result.missing.push({
        id: careerSkill.skillId,
        name: '', // Will be filled by caller
        level: 0,
      });
    } else if (userLevel >= careerSkill.importance) {
      // User has sufficient level
      result.covered.push({
        id: careerSkill.skillId,
        name: '', // Will be filled by caller
        level: userLevel,
      });
    } else {
      // User has partial level
      result.partial.push({
        id: careerSkill.skillId,
        name: '', // Will be filled by caller
        level: userLevel,
      });
    }
  }

  // Sort by importance (missing first, then partial, then covered)
  // Within each group, sort by career skill importance descending
  result.missing.sort((a, b) => {
    const aImportance = careerSkills.find((cs) => cs.skillId === a.id)?.importance || 0;
    const bImportance = careerSkills.find((cs) => cs.skillId === b.id)?.importance || 0;
    return bImportance - aImportance;
  });

  result.partial.sort((a, b) => {
    const aImportance = careerSkills.find((cs) => cs.skillId === a.id)?.importance || 0;
    const bImportance = careerSkills.find((cs) => cs.skillId === b.id)?.importance || 0;
    return bImportance - aImportance;
  });

  result.covered.sort((a, b) => {
    const aImportance = careerSkills.find((cs) => cs.skillId === a.id)?.importance || 0;
    const bImportance = careerSkills.find((cs) => cs.skillId === b.id)?.importance || 0;
    return bImportance - aImportance;
  });

  return result;
}
