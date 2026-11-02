import { supabase } from '@/lib/supabase';
import {
  ALGORITHM_VERSION,
  type Candidate,
  type RecommendationType,
  type SkillMapping,
} from '@/engine/personalizedPath';
import type { ExploreItem } from '@/types/models';
import { accountRequest } from '@/lib/account-request';
import { EDUCATION_ROUTES_ENABLED } from '@/constants/education-rollout';
import { EDUCATION_VERSION } from '../../supabase/functions/_shared/education';

type MappingRow = { skill_id: string; depth?: number; importance?: number };
type CareerLink = { career_id: string };
type SchoolProfile = {
  id: string;
  is_current: boolean;
  key_subjects: string[];
};
type SkillRow = { id: string; name: string; category: string };
type CareerRow = {
  id: string;
  name: string;
  domain: string;
  career_skills: MappingRow[];
};
type CourseRow = {
  id: string;
  title: string;
  is_free: boolean;
  language: string;
  level: string;
  course_skills: MappingRow[];
};
type ProgramRow = {
  id: string;
  name: string;
  degree_level: string;
  university_id: string;
  universities: { county: string } | null;
  program_skills: MappingRow[];
  program_careers: CareerLink[];
};
type SchoolRow = {
  id: string;
  name: string;
  county: string;
  school_profiles: SchoolProfile[];
};
type UniversityRow = { id: string; name: string; county: string };
async function allRows<T>(
  table: string,
  selection: string,
  signal?: AbortSignal,
  county?: string
): Promise<T[]> {
  const rows: T[] = [];
  for (let offset = 0; ; offset += 200) {
    let request = supabase
      .from(table)
      .select(selection)
      .order('id')
      .range(offset, offset + 199);
    if (county) {
      request = request.eq(
        table === 'programs' ? 'universities.county' : 'county',
        county
      );
    }
    const result = await request.abortSignal(
      signal || new AbortController().signal
    );
    if (result.error) {
      throw result.error;
    }
    rows.push(...((result.data || []) as unknown as T[]));
    if ((result.data || []).length < 200) {
      return rows;
    }
  }
}
export async function loadRecommendationCatalogue(
  county: string,
  signal?: AbortSignal
) {
  const [skills, careers, courses, programs, schools, universities] =
    await Promise.all([
      allRows<SkillRow>('skills', 'id,name,category', signal),
      allRows<CareerRow>(
        'careers',
        'id,name,domain,career_skills(skill_id,importance)',
        signal
      ),
      allRows<CourseRow>(
        'courses',
        'id,title,is_free,language,level,course_skills(skill_id,depth)',
        signal
      ),
      county
        ? allRows<ProgramRow>(
            'programs',
            'id,name,degree_level,university_id,universities!inner(county),program_skills(skill_id,depth),program_careers(career_id)',
            signal,
            county
          )
        : Promise.resolve([] as ProgramRow[]),
      county
        ? allRows<SchoolRow>(
            'schools',
            'id,name,county,school_profiles(id,is_current,key_subjects)',
            signal,
            county
          )
        : Promise.resolve([] as SchoolRow[]),
      county
        ? allRows<UniversityRow>(
            'universities',
            'id,name,county',
            signal,
            county
          )
        : Promise.resolve([] as UniversityRow[]),
    ]);
  const skillDomains = new Map(
    skills.map((row) => [row.id, row.category as string])
  );
  const careerDomains = new Map(
    careers.map((row) => [row.id, row.domain as string])
  );
  const mapping = (
    rows: MappingRow[],
    field: 'depth' | 'importance'
  ): SkillMapping[] =>
    rows.map((row) => ({ id: row.skill_id, level: row[field] || 0 }));
  const candidates: Candidate[] = [
    ...skills.map((row) => ({
      id: row.id,
      type: 'skill' as const,
      name: row.name,
      domains: [row.category],
      skills: [{ id: row.id, level: 1 }],
    })),
    ...careers.map((row) => ({
      id: row.id,
      type: 'career' as const,
      name: row.name,
      domains: [row.domain],
      skills: mapping(row.career_skills, 'importance'),
    })),
    ...courses.map((row) => ({
      id: row.id,
      type: 'course' as const,
      name: row.title,
      domains: row.course_skills
        .map((s: MappingRow) => skillDomains.get(s.skill_id))
        .filter((value): value is string => !!value),
      skills: mapping(row.course_skills, 'depth'),
      language: row.language,
      free: row.is_free,
      level: row.level,
    })),
    ...programs.map((row) => ({
      id: row.id,
      type: 'program' as const,
      name: row.name,
      county: row.universities?.county,
      degree: row.degree_level,
      domains: row.program_careers
        .map((r: CareerLink) => careerDomains.get(r.career_id))
        .filter((value): value is string => !!value),
      skills: mapping(row.program_skills, 'depth'),
      careerIds: row.program_careers.map((r: CareerLink) => r.career_id),
    })),
    ...schools.map((row) => ({
      id: row.id,
      type: 'school' as const,
      name: row.name,
      county: row.county,
      domains: [],
      subjects: row.school_profiles
        .filter((p: SchoolProfile) => p.is_current !== false)
        .flatMap((p: SchoolProfile) => p.key_subjects || []),
    })),
    ...universities.map((row) => ({
      id: row.id,
      type: 'university' as const,
      name: row.name,
      county: row.county,
      domains: programs
        .filter((p) => p.university_id === row.id)
        .flatMap((p) =>
          p.program_careers
            .map((r: CareerLink) => careerDomains.get(r.career_id))
            .filter((value): value is string => !!value)
        ),
    })),
  ];
  return { candidates, schools };
}
export async function loadRecommendationState(
  userId: string,
  signal?: AbortSignal
) {
  const [skills, decisions, progress] = await Promise.all([
    supabase
      .from('user_skills')
      .select('skill_id,level')
      .eq('user_id', userId)
      .abortSignal(signal || new AbortController().signal),
    supabase
      .from('user_recommendation_decisions')
      .select('item_type,item_id,decision')
      .eq('user_id', userId)
      .abortSignal(signal || new AbortController().signal),
    supabase
      .from('user_progress')
      .select('step_type,ref_id,status')
      .eq('user_id', userId)
      .abortSignal(signal || new AbortController().signal),
  ]);
  for (const result of [skills, decisions, progress]) {
    if (result.error) {
      throw result.error;
    }
  }
  return {
    skills: (skills.data || []).map((row) => ({
      id: row.skill_id,
      level: row.level,
    })),
    decisions: decisions.data || [],
    progress: progress.data || [],
  };
}
export async function decideRecommendation(
  userId: string,
  type: RecommendationType,
  id: string,
  decision: 'accepted' | 'dismissed'
) {
  const result = await accountRequest((signal) =>
    supabase
      .rpc('decide_recommendation', {
        kind: type,
        ref: id,
        choice: decision,
        algorithm: EDUCATION_ROUTES_ENABLED
          ? EDUCATION_VERSION
          : ALGORITHM_VERSION,
        expected_user: userId,
      })
      .abortSignal(signal)
  );
  if (result.error) {
    throw result.error;
  }
}
export function recommendationSavedKeys(
  items: ExploreItem[],
  schools: SchoolRow[]
) {
  return items.map((item) => {
    if (item.type === 'school_profiles') {
      const parent = schools.find((s) =>
        s.school_profiles.some((p: SchoolProfile) => p.id === item.id)
      );
      return { type: 'schools', id: parent?.id || item.id };
    }
    return item;
  });
}
