// Recommendation engine functions
// Implements the algorithm from section 9 of the master build prompt

import type { GapAnalysisResult } from './gapAnalysis';

export type DepthLevel = 1 | 2 | 3;

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

export interface SkillGap {
  skill: string;
  missingLevel: number; // 0-3
  requiredLevel: number; // 1-3
}

export interface RecommendationResult {
  skill: string;
  courses: Course[];
}

/**
 * Recommend courses for missing skills
 * @param gapAnalysis Result from analyzeGap function
 * @param courses Array of available courses
 * @returns Array of recommendations for each missing skill
 */
export const recommendCourses = (
  gapAnalysis: GapAnalysisResult,
  _courses: Course[]
): RecommendationResult[] => {
  return gapAnalysis.steps.map((step) => ({
    skill: step.skill,
    courses: step.courses,
  }));
};
