import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { askPerplexity } from "../_shared/perplexity.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

    const conversationHistory = messages.map((m: any) => `${m.role.toUpperCase()}: ${m.content}`).join('\n');
    const fullQuery = `${SYSTEM_PROMPT}\n\nCONVERSATION HISTORY:\n${conversationHistory}\n\nBased on the history above, provide the next logical response to the user.`;

    console.log('Calling Perplexity for resume chat...');
    const stream = await askPerplexity(fullQuery, true) as ReadableStream;

    return new Response(stream, {
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

