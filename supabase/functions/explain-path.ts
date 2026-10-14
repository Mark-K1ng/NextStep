import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client with service role for Edge Function
const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Simple caching mechanism (in-memory for demo, would use Redis in production)
const explanationCache = new Map<
  string,
  { result: string; timestamp: number }
>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export default async (req: Request) => {
  try {
    // Get Authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");

    // Verify JWT with Supabase
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Parse request body
    const { gapAnalysis } = await req.json();

    // Validate input
    if (!gapAnalysis) {
      return new Response(
        JSON.stringify({ error: "Missing gapAnalysis in request body" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Create cache key
    const cacheKey = JSON.stringify({
      userId: user.id,
      gapAnalysis,
    });

    // Check cache
    const cached = explanationCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return new Response(JSON.stringify({ explanation: cached.result }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // TODO: Call actual AI provider (OpenAI, Anthropic, etc.)
    // For now, generate a simple explanation based on the gap analysis
    const explanation = generateExplanation(gapAnalysis);

    // Cache the result
    explanationCache.set(cacheKey, {
      result: explanation,
      timestamp: Date.now(),
    });

    return new Response(JSON.stringify({ explanation }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in explain-path function:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

/**
 * Generate a simple explanation in Romanian based on gap analysis
 * @param gapAnalysis The gap analysis result
 * @returns Explanation in Romanian
 */
function generateExplanation(gapAnalysis: any): string {
  const { covered, partial, missing, steps } = gapAnalysis;

  let explanation = `Analiza ta arată că ai ${covered.length} abilități acoperite, `;
  explanation += `${partial.length} abilități parțialemente acoperite și `;
  explanation += `${missing.length} abilități lipsă pentru scopul ales. `;

  if (missing.length === 0) {
    explanation += `Felicitări! Ai toate abilitățile necesare pentru acest scop. `;
    explanation += `Poți continua să dezvolti abilitățile existente sau să explorezi specializări avansate.`;
  } else {
    explanation += `Abilitățile pe care trebuie să le dezvolti sunt: `;
    explanation += missing.map((skill: any) => skill.name).join(", ") + `. `;

    explanation += `Recomandăm să începi cu cursurile sugerate pentru fiecare abilitate lipsă. `;
    explanation += `Fiecare curs a fost selectat pentru a se potrivi cel mai bine cu nevoile tale.`;
  }

  return explanation;
}
