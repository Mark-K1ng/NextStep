import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
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
    const [profileResult, skillsResult, goalsResult, progressResult, consentsResult] =
      await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('user_skills').select('*').eq('user_id', user.id),
        supabase.from('user_goals').select('*').eq('user_id', user.id),
        supabase.from('user_progress').select('*').eq('user_id', user.id),
        supabase.from('consents').select('*').eq('user_id', user.id),
      ]);

    const exportData = {
      profile: profileResult.data,
      skills: skillsResult.data,
      goals: goalsResult.data,
      progress: progressResult.data,
      consents: consentsResult.data,
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
