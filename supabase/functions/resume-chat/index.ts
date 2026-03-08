import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

const SYSTEM_PROMPT = `You are a professional resume builder AI assistant. Your job is to have a structured conversation with the user to gather all the information needed to create a complete, ATS-friendly LaTeX resume.

Follow this conversational flow:
1. First, greet the user and ask for their full name, email, phone number, and location (city, state).
2. Ask for their LinkedIn URL and/or portfolio/GitHub URL (optional).
3. Ask for a brief professional summary or objective (2-3 sentences about their career goals).
4. Ask about their work experience - for each position ask: job title, company name, location, start/end dates, and 3-5 key achievements/responsibilities as bullet points.
5. Ask about their education - degree, institution, graduation date, GPA (optional), relevant coursework.
6. Ask about their technical skills, tools, and technologies they're proficient in.
7. Ask about certifications, awards, or notable projects (optional).
8. Ask if they have any other sections they'd like to include.

Guidelines:
- Ask ONE section at a time. Don't overwhelm the user.
- Be encouraging and professional.
- When you have enough information, offer to generate the resume.
- Use markdown formatting in your responses for readability.
- When the user confirms they're ready, generate a COMPLETE LaTeX resume using the gathered information.

When generating the final LaTeX resume, wrap it in a code block with \`\`\`latex tags. The resume should:
- Use a clean, ATS-friendly format
- Include proper LaTeX packages
- Be well-structured with clear sections
- Use professional formatting
- Be immediately compilable

IMPORTANT: When you generate the LaTeX code, say "Here's your generated resume template!" before the code block, so the system can detect it.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("resume-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
