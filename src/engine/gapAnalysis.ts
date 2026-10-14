// Gap analysis functions
// Implements the algorithm from section 9 of the master build prompt

export type SkillLevel = 0 | 1 | 2 | 3;
export type ImportanceLevel = 1 | 2 | 3;
export type DepthLevel = 1 | 2 | 3;

export interface UserSkill {
  id: string;
  name: string;
  level: SkillLevel;
}

export interface CareerSkill {
  id: string;
  name: string;
  importance: ImportanceLevel;
}

export interface Course {
  id: string;
  title: string;
  provider: string;
  url: string;
  language: string;
  is_free: boolean;
  level: string;
  skills: {
    id: string;
    name: string;
    depth: DepthLevel;
  }[];
}

export interface GapAnalysisResult {
  covered: UserSkill[];
  partial: Array<UserSkill & { required: ImportanceLevel }>;
  missing: Array<UserSkill & { required: ImportanceLevel }>;
  steps: Array<{
    skill: string;
    courses: Course[];
  }>;
}

/**
 * Analyze the gap between user skills and career requirements
 * @param userSkills Array of user's skills with levels
 * @param careerSkills Array of career's required skills with importance
 * @param courses Array of available courses with the skills they teach
 * @returns Gap analysis result
 */
export const analyzeGap = (
  userSkills: UserSkill[],
  careerSkills: CareerSkill[],
  courses: Course[]
): GapAnalysisResult => {
  // Initialize result arrays
  const covered: UserSkill[] = [];
  const partial: Array<UserSkill & { required: ImportanceLevel }> = [];
  const missing: Array<UserSkill & { required: ImportanceLevel }> = [];

  // Map user skills for quick lookup
  const userSkillsMap = new Map<string, SkillLevel>();
  userSkills.forEach((skill) => {
    userSkillsMap.set(skill.id, skill.level);
  });

  // Process each career skill
  careerSkills.forEach((careerSkill) => {
    const userLevel = userSkillsMap.get(careerSkill.id) || 0;
    const requiredLevel: ImportanceLevel = careerSkill.importance;

    if (userLevel >= requiredLevel) {
      // Skill is covered
      covered.push({
        id: careerSkill.id,
        name: careerSkill.name,
        level: userLevel as SkillLevel,
      });
    } else if (userLevel > 0) {
      // Skill is partially covered
      partial.push({
        id: careerSkill.id,
        name: careerSkill.name,
        level: userLevel as SkillLevel,
        required: requiredLevel,
      });
    } else {
      // Skill is missing
      missing.push({
        id: careerSkill.id,
        name: careerSkill.name,
        level: 0 as SkillLevel,
        required: requiredLevel,
      });
    }
  });

  // Sort by importance (descending) then by name
  covered.sort((a, b) => {
    const importanceA =
      careerSkills.find((s) => s.id === a.id)?.importance || 0;
    const importanceB =
      careerSkills.find((s) => s.id === b.id)?.importance || 0;
    if (importanceB !== importanceA) {
      return importanceB - importanceA;
    }
    return a.name.localeCompare(b.name);
  });

  partial.sort((a, b) => {
    if (b.required !== a.required) {
      return b.required - a.required;
    }
    return a.name.localeCompare(b.name);
  });

  missing.sort((a, b) => {
    if (b.required !== a.required) {
      return b.required - a.required;
    }
    return a.name.localeCompare(b.name);
  });

  // Generate course recommendations for missing skills
  const steps: Array<{
    skill: string;
    courses: Course[];
  }> = [];

  missing.forEach((missingSkill) => {
    // Find courses that teach this skill
    const relevantCourses = courses.filter((course) =>
      course.skills.some((skill) => skill.id === missingSkill.id)
    );

    // Sort courses: free first, then by level, then by language match (Romanian preferred)
    const sortedCourses = [...relevantCourses].sort((a, b) => {
      // Free courses first
      if (a.is_free && !b.is_free) {
        return -1;
      }
      if (!a.is_free && b.is_free) {
        return 1;
      }

      // Then by level (beginner < intermediate < advanced)
      const levelOrder: Record<string, number> = {
        începător: 1,
        beginner: 1,
        intermediar: 2,
        intermediate: 2,
        avansat: 3,
        advanced: 3,
      };

      const levelA = levelOrder[a.level.toLowerCase()] || 99;
      const levelB = levelOrder[b.level.toLowerCase()] || 99;

      if (levelA !== levelB) {
        return levelA - levelB;
      }

      // Then by language (Romanian preferred)
      const langA: number = a.language.toLowerCase() === "română" ? 0 : 1;
      const langB: number = b.language.toLowerCase() === "română" ? 0 : 1;

      if (langA !== langB) {
        return langA - langB;
      }

      return 0;
    });

    steps.push({
      skill: missingSkill.name,
      courses: sortedCourses,
    });
  });

  return {
    covered,
    partial,
    missing,
    steps,
  };
};
