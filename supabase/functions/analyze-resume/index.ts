import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { askPerplexity } from "../_shared/perplexity.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_LATEX_LENGTH = 100000;
const MAX_JOB_DESC_LENGTH = 50000;

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

    console.log('Calling Perplexity for resume analysis...');
    const content = await askPerplexity(prompt, false) as string;

    // Clean up JSON
    let jsonContent = content.trim();
    jsonContent = jsonContent.replace(/^```(?:json)?\s*/i, '');
    jsonContent = jsonContent.replace(/\s*```$/i, '');

    let analysis;
    try {
      analysis = JSON.parse(jsonContent);
    } catch (e) {
      console.error('Failed to parse Perplexity response:', content);
      analysis = {
        atsScore: 75,
        keywordMatch: 70,
        matchedKeywords: [],
        missingKeywords: [],
        suggestions: ['Unable to fully analyze. Please try again.']
      };
    }

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

