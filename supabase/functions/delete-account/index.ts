// @ts-ignore - Deno Edge Function with Deno-specific imports
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore - Deno Edge Function with Deno-specific imports
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

// @ts-ignore - Deno Edge Function
serve(async (req: Request) => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Verify the request is authenticated
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get Supabase service role key from environment
    // @ts-ignore - Deno.env is Deno-specific
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    // @ts-ignore - Deno.env is Deno-specific
    const supabaseServiceKey = Deno.env.get('SERVICE_ROLE_KEY')!;

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Missing Supabase environment variables' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Extract user ID from JWT token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const userId = user.id;

    // Delete user's data from all user-owned tables (explicit cleanup)
    const { error: favoritesError } = await supabase
      .from('user_favorites')
      .delete()
      .eq('user_id', userId);

    if (favoritesError) {
      console.error('Favorites deletion error:', favoritesError);
      // Continue even if favorites deletion fails
    }

    const { error: skillsError } = await supabase
      .from('user_skills')
      .delete()
      .eq('user_id', userId);

    if (skillsError) {
      console.error('Skills deletion error:', skillsError);
      // Continue even if skills deletion fails
    }

    const { error: goalsError } = await supabase
      .from('user_goals')
      .delete()
      .eq('user_id', userId);

    if (goalsError) {
      console.error('Goals deletion error:', goalsError);
      // Continue even if goals deletion fails
    }

    const { error: progressError } = await supabase
      .from('user_progress')
      .delete()
      .eq('user_id', userId);

    if (progressError) {
      console.error('Progress deletion error:', progressError);
      // Continue even if progress deletion fails
    }

    const { error: consentsError } = await supabase
      .from('consents')
      .delete()
      .eq('user_id', userId);

    if (consentsError) {
      console.error('Consents deletion error:', consentsError);
      // Continue even if consents deletion fails
    }

    // Delete user's profile (will cascade to other tables with FKs)
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (profileError) {
      console.error('Profile deletion error:', profileError);
      // Continue even if profile deletion fails
    }

    // Delete the auth account using admin API
    const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);

    if (deleteError) {
      return new Response(
        JSON.stringify({ error: deleteError.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Account deleted successfully' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Delete account error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
