// Service for course-related data access
import { supabase } from '@/lib/supabase';

export const courseService = {
  // Get all courses
  async getCourses() {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .order('title');

    if (error) {
      throw error;
    }
    return data;
  },

  // Get course by ID
  async getCourseById(id: string) {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }
    return data;
  },

  // Get courses by skill
  async getCoursesBySkill(skillId: string) {
    const { data, error } = await supabase
      .from('course_skills')
      .select(
        `
        *,
        courses (
          id,
          title,
          provider,
          url,
          language,
          is_free,
          level,
          source_url,
          verified_at
        )
      `
      )
      .eq('skill_id', skillId)
      .order('is_free', { ascending: false }); // Free courses first

    if (error) {
      throw error;
    }
    return data;
  },

  // Get free courses
  async getFreeCourses() {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('is_free', true)
      .order('title');

    if (error) {
      throw error;
    }
    return data;
  },

  // Get courses by language
  async getCoursesByLanguage(language: string) {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('language', language)
      .order('title');

    if (error) {
      throw error;
    }
    return data;
  },

  // Get courses by level
  async getCoursesByLevel(level: string) {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('level', level)
      .order('title');

    if (error) {
      throw error;
    }
    return data;
  },
};
