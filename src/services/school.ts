// Service for school-related data access
import { supabase } from '@/lib/supabase'

export const schoolService = {
  // Get all schools
  async getSchools() {
    const { data, error } = await supabase
      .from('schools')
      .select('*')
      .order('name')

    if (error) throw error
    return data
  },

  // Get school by ID
  async getSchoolById(id: string) {
    const { data, error } = await supabase
      .from('schools')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  // Get schools by county
  async getSchoolsByCounty(county: string) {
    const { data, error } = await supabase
      .from('schools')
      .select('*')
      .eq('county', county)
      .order('name')

    if (error) throw error
    return data
  },

  // Get school profiles for a school
  async getSchoolProfiles(schoolId: string) {
    const { data, error } = await supabase
      .from('school_profiles')
      .select('*')
      .eq('school_id', schoolId)

    if (error) throw error
    return data
  }
}