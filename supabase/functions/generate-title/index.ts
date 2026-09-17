import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const json = (title: string) => new Response(JSON.stringify({ title }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const { job_description } = await req.json();
    if (!job_description) return json('Untitled Resume');
    if (typeof job_description !== 'string') return json('Resume');
    if (!GEMINI_API_KEY) {
      const roleMatch = job_description.match(/(?:software|senior|junior|lead|principal|staff|frontend|backend|full.?stack|data|devops|cloud|mobile|web|ui|ux|product)\s*(?:engineer|developer|designer|architect|manager|analyst)/i);
      return json(roleMatch ? roleMatch[0] : 'Resume');
    }
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${GEMINI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gemini-3.5-flash-lite',
        messages: [
          { role: 'system', content: 'Generate a short, descriptive resume title (3-6 words max) based on the job description. Include the job role and company if mentioned. Output only the title, nothing else. Examples: "Software Engineer at Google", "Senior React Developer", "Data Scientist - Startup"' },
          { role: 'user', content: `Generate a resume title for this job:\n\n${job_description.substring(0, 1000)}` },
        ],
      }),
    });
    if (!response.ok) {
      console.error('Gemini title generation failed:', response.status);
      return json('Resume');
    }
    const data = await response.json();
    const title = data.choices?.[0]?.message?.content?.trim() || 'Resume';
    return json(title.replace(/['"]/g, '').substring(0, 50));
  } catch {
    return json('Resume');
  }
});
