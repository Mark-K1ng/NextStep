export interface Skill {
  id: string;
  name: string;
  level: number; // 1-3
}

export interface CareerSkill {
  skillId: string;
  importance: number; // 1-3
}

export interface GapResult {
  covered: Skill[];
  partial: Skill[];
  missing: Skill[];
}

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
