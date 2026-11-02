import {
  createClient,
  type SupabaseClient,
  type User,
} from '@supabase/supabase-js';
import { corsHeaders } from '@supabase/supabase-js/cors';

export function json(
  data: unknown,
  status = 200,
  headers: Record<string, string> = {},
) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      ...headers,
    },
  });
}

type Context = {
  request: Request;
  supabase: SupabaseClient;
  user: User;
  token: string;
};

export function withUser(action: (context: Context) => Promise<Response>) {
  return async (request: Request) => {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          ...corsHeaders,
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
        },
      });
    }
    if (request.method !== 'POST') {
      return json({ error: 'Method not allowed' }, 405, {
        Allow: 'POST, OPTIONS',
      });
    }
    const token = /^Bearer\s+(\S+)$/i.exec(
      request.headers.get('Authorization') || '',
    )?.[1];
    if (!token) return json({ error: 'Missing bearer token' }, 401);
    const url = Deno.env.get('SUPABASE_URL');
    const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!url || !key) return json({ error: 'Service is not configured' }, 503);
    try {
      const supabase = createClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (error || !user) return json({ error: 'Invalid token' }, 401);
      return await action({ request, supabase, user, token });
    } catch {
      // Provider errors may contain emails, tokens or database row contents.
      console.error('Edge function request failed');
      return json({ error: 'Internal server error' }, 500);
    }
  };
}
