import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
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
const json = (body: unknown, status: number) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const { messages } = await req.json();
    if (!Array.isArray(messages) || messages.length === 0 || messages.length > 100 ||
        messages.some(m => !m || !['user', 'assistant'].includes(m.role) || typeof m.content !== 'string') ||
        messages.reduce((sum, m) => sum + m.content.length, 0) > 200000) {
      return json({ error: 'A valid conversation of up to 100 messages is required' }, 400);
    }
    if (!GEMINI_API_KEY) return json({ error: 'AI service not configured' }, 503);
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${GEMINI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gemini-3.5-flash-lite',
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages.map(m => ({ role: m.role, content: m.content }))],
        stream: true,
      }),
    });
    if (!response.ok || !response.body) {
      console.error('Gemini chat failed:', response.status);
      return json({ error: response.status === 429 ? 'Gemini rate limit or quota exceeded. Please try again shortly.' : 'AI service error' }, response.status === 429 ? 429 : 502);
    }
    // Google emits the same SSE choices[].delta.content format consumed by the UI.
    return new Response(response.body, { headers: { ...corsHeaders, 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' } });
  } catch {
    return json({ error: 'Unable to complete the conversation. Please try again.' }, 500);
  }
});
