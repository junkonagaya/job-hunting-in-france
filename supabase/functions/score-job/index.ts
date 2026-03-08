import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { job_id } = await req.json();

    if (!job_id) {
      return new Response(JSON.stringify({ error: "job_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch the job
    const { data: job, error: jobError } = await supabase
      .from("saved_jobs")
      .select("*")
      .eq("id", job_id)
      .eq("user_id", user.id)
      .single();

    if (jobError || !job) {
      return new Response(JSON.stringify({ error: "Job not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!profile || (!profile.cv_text && !profile.skills_summary)) {
      return new Response(JSON.stringify({ error: "Please complete your profile with a resume or skills summary first." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!job.job_description) {
      return new Response(JSON.stringify({ error: "Job has no description to analyze." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `You are an expert recruiter AI. You will be given a candidate's profile (resume/skills and French language level) and a job posting. 
    
Your task is to analyze the match and return a structured result using the provided tool.

Scoring criteria:
- Skills & experience match (0-40 points): How well the candidate's skills align with job requirements
- French language fit (0-20 points): Compare candidate's French level with the job's requirements. If the job requires fluent French and candidate has none, score 0. If no French required, give full points.
- Role relevance (0-20 points): How well the candidate's target role and career trajectory match
- Overall fit (0-20 points): Location preferences, seniority level, industry alignment

The total score should be 0-100.`;

    const userPrompt = `## Candidate Profile
- Name: ${profile.full_name || "Not provided"}
- Target Role: ${profile.target_job_title || "Not specified"}
- French Level: ${profile.french_level || "Not specified"}
- Skills Summary: ${profile.skills_summary || "Not provided"}
- Resume/CV:
${profile.cv_text || "Not provided"}

## Job Posting
- Title: ${job.job_title}
- Company: ${job.company_name}
- Location: ${job.location || "Not specified"}
- French Required: ${job.french_level_required || "Unknown"}
- Description:
${job.job_description}

Analyze the match and return the score and analysis.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "score_relevance",
              description: "Return the relevance score and analysis for a job match.",
              parameters: {
                type: "object",
                properties: {
                  relevance_score: {
                    type: "integer",
                    description: "Overall relevance score from 0-100",
                  },
                  french_level_required: {
                    type: "string",
                    enum: ["none", "A1", "A2", "B1", "B2", "C1", "C2", "native", "unknown"],
                    description: "Detected French level requirement from the job posting",
                  },
                  skills_match: {
                    type: "string",
                    description: "Brief analysis of skills match (1-2 sentences)",
                  },
                  french_match: {
                    type: "string",
                    description: "Brief analysis of French language fit (1 sentence)",
                  },
                  summary: {
                    type: "string",
                    description: "Overall 2-3 sentence summary of the match quality",
                  },
                },
                required: ["relevance_score", "french_level_required", "skills_match", "french_match", "summary"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "score_relevance" } },
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      return new Response(JSON.stringify({ error: "AI analysis failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      console.error("No tool call in AI response:", JSON.stringify(aiData));
      return new Response(JSON.stringify({ error: "AI did not return structured data" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = JSON.parse(toolCall.function.arguments);
    const score = Math.max(0, Math.min(100, result.relevance_score));

    // Update the job with score and detected french level
    const { error: updateError } = await supabase
      .from("saved_jobs")
      .update({
        relevance_score: score,
        french_level_required: result.french_level_required,
        notes: job.notes
          ? `${job.notes}\n\n--- AI Analysis ---\n${result.summary}\n\nSkills: ${result.skills_match}\nFrench: ${result.french_match}`
          : `--- AI Analysis ---\n${result.summary}\n\nSkills: ${result.skills_match}\nFrench: ${result.french_match}`,
      })
      .eq("id", job_id);

    if (updateError) {
      console.error("Update error:", updateError);
      return new Response(JSON.stringify({ error: "Failed to save score" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      relevance_score: score,
      french_level_required: result.french_level_required,
      skills_match: result.skills_match,
      french_match: result.french_match,
      summary: result.summary,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Score error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
