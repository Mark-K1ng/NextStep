import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client with service role for Edge Function
const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

    // Fetch all user data from relevant tables
    const [
      profileData,
      userSkillsData,
      userGoalsData,
      userProgressData,
      consentsData,
    ] = await Promise.all([
      // Profile data
      supabase.from("profiles").select("*").eq("id", user.id).single(),

      // User skills
      supabase
        .from("user_skills")
        .select("*, skills(*)")
        .eq("user_id", user.id),

      // User goals
      supabase
        .from("user_goals")
        .select("*, careers(*)")
        .eq("user_id", user.id),

      // User progress
      supabase.from("user_progress").select("*").eq("user_id", user.id),

      // Consents
      supabase.from("consents").select("*").eq("user_id", user.id),
    ]);

    // Check for errors
    const errors = [
      profileData,
      userSkillsData,
      userGoalsData,
      userProgressData,
      consentsData,
    ]
      .map((result) => result.error)
      .filter(Boolean) as Error[];

    if (errors.length > 0) {
      throw errors[0]; // Throw the first error
    }

    // Prepare the export data
    const exportData = {
      userId: user.id,
      exportedAt: new Date().toISOString(),
      profile: profileData.data,
      skills: userSkillsData.data,
      goals: userGoalsData.data,
      progress: userProgressData.data,
      consents: consentsData.data,
    };

    return new Response(JSON.stringify(exportData), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; export-data-${user.id}-${new Date().toISOString().split("T")[0]}.json`,
      },
    });
  } catch (error) {
    console.error("Error in export-data function:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
