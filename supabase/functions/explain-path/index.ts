import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface ExplanationRequest {
  gapResult: {
    covered: Array<{ id: string; name: string; level: number }>;
    partial: Array<{ id: string; name: string; level: number }>;
    missing: Array<{ id: string; name: string; level: number }>;
  };
  careerName: string;
}

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

    // Parse request body
    const { gapResult, careerName }: ExplanationRequest = await req.json();

    // Validate input
    if (!gapResult || !careerName) {
      return new Response('Invalid input', { status: 400 });
    }

    // Check cache (simple implementation using supabase KV)
    const cacheKey = `explanation:${user.id}:${careerName}:${JSON.stringify(gapResult)}`;
    // Note: In production, use proper caching with Redis or Supabase cache

    // Generate explanation
    const explanation = await generateExplanation(gapResult, careerName);

    // Rate limiting check (simple implementation)
    // In production, use proper rate limiting with Redis or similar

    return new Response(
      JSON.stringify({
        explanation,
        cached: false,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in explain-path:', error);
    return new Response('Internal server error', { status: 500 });
  }
});

async function generateExplanation(
  gapResult: ExplanationRequest['gapResult'],
  careerName: string
): Promise<string> {
  // In production, call an AI provider (OpenAI, Anthropic, etc.)
  // For now, return a structured explanation based on the gap result

  const coveredCount = gapResult.covered.length;
  const partialCount = gapResult.partial.length;
  const missingCount = gapResult.missing.length;

  let explanation = `Pentru cariera de ${careerName}, `;

  if (missingCount === 0 && partialCount === 0) {
    explanation += `ai deja toate abilitățile necesare (${coveredCount} abilități acoperite). Poți începe să aplici pentru joburi în acest domeniu.`;
  } else if (missingCount === 0) {
    explanation += `ai o bază solidă cu ${coveredCount} abilități acoperite, dar mai ai ${partialCount} abilități care necesită îmbunătățire. `;

    if (gapResult.partial.length > 0) {
      const partialNames = gapResult.partial.map((s) => s.name).join(', ');
      explanation += `Concentrează-te pe: ${partialNames}.`;
    }
  } else {
    explanation += `ai ${coveredCount} abilități acoperite, dar îți lipsesc ${missingCount} abilități esențiale și mai ai ${partialCount} care necesită îmbunătățire. `;

    if (gapResult.missing.length > 0) {
      const missingNames = gapResult.missing.slice(0, 3).map((s) => s.name).join(', ');
      explanation += `Prioritizează învățarea: ${missingNames}.`;
    }
  }

  explanation += ' Recomandările de cursuri de mai sus te vor ajuta să acoperi aceste lacune.';

  return explanation;
}
