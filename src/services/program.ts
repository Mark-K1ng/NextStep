// Service for program-related data access
import { supabase } from "@/lib/supabase";

export const programService = {
  // Get all programs
  async getPrograms() {
    const { data, error } = await supabase
      .from("programs")
      .select(
        `
        *,
        universities (
          id,
          name,
          city,
          website
        )
      `
      )
      .order("name");

    if (error) {
      throw error;
    }
    return data;
  },

  // Get program by ID
  async getProgramById(id: string) {
    const { data, error } = await supabase
      .from("programs")
      .select(
        `
        *,
        universities (
          id,
          name,
          city,
          website
        )
      `
      )
      .eq("id", id)
      .single();

    if (error) {
      throw error;
    }
    return data;
  },

  // Get programs by university
  async getProgramsByUniversity(universityId: string) {
    const { data, error } = await supabase
      .from("programs")
      .select(
        `
        *,
        universities (
          id,
          name,
          city,
          website
        )
      `
      )
      .eq("university_id", universityId)
      .order("name");

    if (error) {
      throw error;
    }
    return data;
  },

  // Get programs by degree level
  async getProgramsByDegreeLevel(level: string) {
    const { data, error } = await supabase
      .from("programs")
      .select(
        `
        *,
        universities (
          id,
          name,
          city,
          website
        )
      `
      )
      .eq("degree_level", level)
      .order("name");

    if (error) {
      throw error;
    }
    return data;
  },

  // Get skills for a program
  async getProgramSkills(programId: string) {
    const { data, error } = await supabase
      .from("program_skills")
      .select(
        `
        *,
        skills (
          id,
          name,
          category
        )
      `
      )
      .eq("program_id", programId);

    if (error) {
      throw error;
    }
    return data;
  },

  // Get careers for a program
  async getProgramCareers(programId: string) {
    const { data, error } = await supabase
      .from("program_careers")
      .select(
        `
        *,
        careers (
          id,
          name,
          description,
          domain,
          source_url,
          verified_at
        )
      `
      )
      .eq("program_id", programId);

    if (error) {
      throw error;
    }
    return data;
  },
};
