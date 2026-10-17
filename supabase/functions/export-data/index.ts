// @ts-ignore - Deno Edge Function with Deno-specific imports
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
// @ts-ignore - Deno Edge Function with Deno-specific imports
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// @ts-ignore - Deno.env is Deno-specific
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
// @ts-ignore - Deno.env is Deno-specific
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// @ts-ignore - Deno Edge Function
serve(async (req: Request) => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    // Verify JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response('Unauthorized', { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Fetch all user data
    const [profileResult, skillsResult, goalsResult, progressResult, consentsResult, favoritesResult] =
      await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('user_skills').select('*').eq('user_id', user.id),
        supabase.from('user_goals').select('*').eq('user_id', user.id),
        supabase.from('user_progress').select('*').eq('user_id', user.id),
        supabase.from('consents').select('*').eq('user_id', user.id),
        supabase.from('user_favorites').select('*').eq('user_id', user.id),
      ]);

    const exportData = {
      profile: profileResult.data,
      skills: skillsResult.data,
      goals: goalsResult.data,
      progress: progressResult.data,
      consents: consentsResult.data,
      favorites: favoritesResult.data,
      exportedAt: new Date().toISOString(),
    };

    return new Response(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="nextstep-export-${user.id}.json"`,
      },
    });
  } catch (error) {
    console.error('Error in export-data:', error);
    return new Response('Internal server error', { status: 500 });
  }
});
