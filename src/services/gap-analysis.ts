import { supabase } from '@/lib/supabase';
import {
  analyzeGap,
  type CareerSkill,
  type Course,
  type UserSkill,
} from '@/engine/gapAnalysis';
import type { CourseRaw } from '@/types/models';

export async function loadGapAnalysis(
  userId: string,
  careerId: string,
  signal?: AbortSignal
) {
  const [userResult, careerResult] = await Promise.all([
    supabase
      .from('user_skills')
      .select('skill_id, level, skills(id, name)')
      .eq('user_id', userId)
      .abortSignal(signal || new AbortController().signal),
    supabase
      .from('career_skills')
      .select('skill_id, importance, skills(id, name)')
      .eq('career_id', careerId)
      .abortSignal(signal || new AbortController().signal),
  ]);
  for (const result of [userResult, careerResult]) {
    if (result.error) {
      throw result.error;
    }
  }
  const userRows = userResult.data as unknown as {
    skill_id: string;
    level: UserSkill['level'];
    skills: { name: string } | null;
  }[];
  const careerRows = careerResult.data as unknown as {
    skill_id: string;
    importance: CareerSkill['importance'];
    skills: { name: string } | null;
  }[];
  const userSkills: UserSkill[] = (userRows || []).map((row) => ({
    id: row.skill_id,
    name: row.skills?.name || '',
    level: row.level,
  }));
  const careerSkills: CareerSkill[] = (careerRows || []).map((row) => ({
    id: row.skill_id,
    name: row.skills?.name || '',
    importance: row.importance,
  }));
  const levels = new Map(userSkills.map((skill) => [skill.id, skill.level]));
  const unmet = careerSkills
    .filter((skill) => (levels.get(skill.id) || 0) < skill.importance)
    .map((skill) => skill.id);
  if (!unmet.length) {
    return analyzeGap(userSkills, careerSkills, []);
  }
  // Filter parents by relevant skills while retaining their full skill mappings.
  const courseRows: CourseRaw[] = [];
  const batchSize = 200;
  for (let offset = 0; ; offset += batchSize) {
    const courseResult = await supabase
      .from('courses')
      .select(
        'id,title,provider,url,language,is_free,level,course_skills(skill_id,depth,skills(id,name)),matched:course_skills!inner(skill_id)'
      )
      .in('matched.skill_id', unmet)
      .order('id')
      .range(offset, offset + batchSize - 1)
      .abortSignal(signal || new AbortController().signal);
    if (courseResult.error) {
      throw courseResult.error;
    }
    const batch = (courseResult.data || []) as unknown as CourseRaw[];
    courseRows.push(...batch);
    if (batch.length < batchSize) {
      break;
    }
  }
  const courses: Course[] = courseRows.map((course) => ({
    ...course,
    skills: (course.course_skills || []).map((row) => ({
      id: row.skill_id,
      name: row.skills?.name || '',
      depth: row.depth,
    })),
  }));
  return analyzeGap(userSkills, careerSkills, courses);
}
