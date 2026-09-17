import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const MAX_LATEX_LENGTH = 100000;
const MAX_JOB_DESC_LENGTH = 50000;
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
});

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const { latex_code, job_description } = await req.json();
    if (!latex_code || !job_description) return json({ error: 'Both latex_code and job_description are required' }, 400);
    if (typeof latex_code !== 'string' || typeof job_description !== 'string') return json({ error: 'Invalid input types' }, 400);
    if (latex_code.length > MAX_LATEX_LENGTH || job_description.length > MAX_JOB_DESC_LENGTH) return json({ error: 'Input exceeds the allowed length' }, 400);
    if (!GEMINI_API_KEY) return json({ error: 'AI service not configured' }, 503);
    const prompt = `Analyze this resume against the job description and provide ATS compatibility metrics.

RESUME (LaTeX):
${latex_code}

JOB DESCRIPTION:
${job_description}

Return a JSON object with atsScore (0-100), keywordMatch (0-100), matchedKeywords (string array), missingKeywords (string array), and suggestions (2-3 brief strings). Return ONLY valid JSON.`;
    // Google's compatibility endpoint preserves the app's existing response format.
    // Requests go directly to Google, not OpenAI or a third-party AI gateway.
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${GEMINI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gemini-3.5-flash-lite',
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: 'You are an expert ATS (Applicant Tracking System) analyzer. Analyze resumes and return structured JSON data. Always return valid JSON only.' },
          { role: 'user', content: prompt },
        ],
      }),
    });
    if (!response.ok) {
      console.error('Gemini analysis failed:', response.status);
      return json({ error: response.status === 429 ? 'Gemini rate limit or quota exceeded. Please try again later.' : 'AI service error' }, response.status === 429 ? 429 : 502);
    }
    const data = await response.json();
    const content = (data.choices?.[0]?.message?.content || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
    const analysis = JSON.parse(content);
    if (!Number.isFinite(analysis.atsScore) || analysis.atsScore < 0 || analysis.atsScore > 100 ||
        !Number.isFinite(analysis.keywordMatch) || analysis.keywordMatch < 0 || analysis.keywordMatch > 100 ||
        ![analysis.matchedKeywords, analysis.missingKeywords, analysis.suggestions].every(v => Array.isArray(v) && v.every(x => typeof x === 'string'))) {
      return json({ error: 'Invalid analysis response. Please try again.' }, 502);
    }
    return json({ success: true, atsScore: analysis.atsScore, keywordMatch: analysis.keywordMatch, matchedKeywords: analysis.matchedKeywords, missingKeywords: analysis.missingKeywords, suggestions: analysis.suggestions });
  } catch (error) {
    console.error('analyze-resume failed:', error instanceof Error ? error.name : 'Unknown error');
    return json({ error: 'Unable to analyze the resume. Please try again.' }, 500);
  }
});
