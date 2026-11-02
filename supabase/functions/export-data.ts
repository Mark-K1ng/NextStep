import { json, withUser } from './_shared/http.ts';
import { createClient } from '@supabase/supabase-js';

export default withUser(async ({ user, token }) => {
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_ANON_KEY');
  if (!url || !key) return json({ error: 'Service is not configured' }, 503);
  // Export reads as the caller so table grants and RLS remain in force.
  const supabase = createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const results = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
    supabase.from('user_skills').select('*, skills(*)').eq('user_id', user.id),
    supabase.from('user_goals').select('*, careers(*)').eq('user_id', user.id),
    supabase.from('user_progress').select('*').eq('user_id', user.id),
    supabase.from('consents').select('*').eq('user_id', user.id),
    supabase.from('user_favorites').select('*').eq('user_id', user.id),
    supabase.from('user_personalization').select('*').eq('user_id', user.id),
    supabase
      .from('user_recommendation_decisions')
      .select('*')
      .eq('user_id', user.id),
    supabase.from('user_bookmark_imports').select('*').eq('user_id', user.id),
    supabase.from('user_bookmark_removals').select('*').eq('user_id', user.id),
    supabase.from('user_education').select('*').eq('user_id', user.id),
    supabase.from('user_exploration_activities').select('*').eq(
      'user_id',
      user.id,
    ),
  ]);
  const failed = results.find((result) => result.error);
  if (failed?.error) throw failed.error;
  const [
    profile,
    skills,
    goals,
    progress,
    consents,
    favorites,
    personalization,
    recommendationDecisions,
    bookmarkImports,
    bookmarkRemovals,
    education,
    explorationActivities,
  ] = results;
  return json(
    {
      userId: user.id,
      exportedAt: new Date().toISOString(),
      profile: profile.data,
      skills: skills.data,
      goals: goals.data,
      progress: progress.data,
      consents: consents.data,
      favorites: favorites.data,
      personalization: personalization.data,
      recommendationDecisions: recommendationDecisions.data,
      bookmarkImports: bookmarkImports.data,
      bookmarkRemovals: bookmarkRemovals.data,
      education: education.data,
      explorationActivities: explorationActivities.data,
    },
    200,
    {
      'Content-Disposition': `attachment; filename="nextstep-export-${
        new Date()
          .toISOString()
          .slice(0, 10)
      }.json"`,
    },
  );
});
