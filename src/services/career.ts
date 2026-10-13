// Service for career-related data access
import { supabase } from '@/lib/supabase'

export const careerService = {
  // Get all careers
  async getCareers() {
    const { data, error } = await supabase
      .from('careers')
      .select('*')
      .order('name')

    if (error) throw error
    return data
  },

  // Get career by ID
  async getCareerById(id: string) {
    const { data, error } = await supabase
      .from('careers')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  // Get careers by domain
  async getCareersByDomain(domain: string) {
    const { data, error } = await supabase
      .from('careers')
      .select('*')
      .eq('domain', domain)
      .order('name')

    if (error) throw error
    return data
  },

  // Get skills for a career
  async getCareerSkills(careerId: string) {
    const { data, error } = await supabase
      .from('career_skills')
      .select(`
        *,
        skills (
          id,
          name,
          category
        )
      `)
      .eq('career_id', careerId)
      .order('importance', { ascending: false })

    if (error) throw error
    return data
  },

  // Get programs for a career
  async getCareerPrograms(careerId: string) {
    const { data, error } = await supabase
      .from('program_careers')
      .select(`
        *,
        programs (
          *,
          universities (
            id,
            name,
            city,
            website
          )
        )
      `)
      .eq('career_id', careerId)

    if (error) throw error
    return data
  }
}