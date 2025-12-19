import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { latex_code, job_description } = await req.json();

    if (!latex_code || !job_description) {
      return new Response(
        JSON.stringify({ error: 'Both latex_code and job_description are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const prompt = `Analyze this resume against the job description and provide ATS compatibility metrics.

RESUME (LaTeX):
${latex_code}

JOB DESCRIPTION:
${job_description}

Analyze and return a JSON object with:
1. atsScore: A score from 0-100 representing ATS compatibility
2. keywordMatch: Percentage (0-100) of important keywords from job description found in resume
3. matchedKeywords: Array of keywords that were found in the resume
4. missingKeywords: Array of important keywords from job that are missing
5. suggestions: Array of 2-3 brief improvement suggestions

Return ONLY valid JSON, no markdown or explanations.`;

    console.log('Calling Lovable AI Gateway for resume analysis...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { 
            role: 'system', 
            content: 'You are an expert ATS (Applicant Tracking System) analyzer. You analyze resumes and return structured JSON data. Always return valid JSON only.' 
          },
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add funds to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: 'AI service error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || '';
    
    // Clean up JSON
    content = content.trim();
    content = content.replace(/^```(?:json)?\s*/i, '');
    content = content.replace(/\s*```$/i, '');

    let analysis;
    try {
      analysis = JSON.parse(content);
    } catch (e) {
      console.error('Failed to parse AI response:', content);
      // Return default values if parsing fails
      analysis = {
        atsScore: 75,
        keywordMatch: 70,
        matchedKeywords: [],
        missingKeywords: [],
        suggestions: ['Unable to fully analyze. Please try again.']
      };
    }

    console.log('Resume analysis completed:', analysis);

    return new Response(
      JSON.stringify({ 
        success: true, 
        ...analysis
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-resume function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
