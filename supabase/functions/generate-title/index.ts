import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { askPerplexity } from "../_shared/perplexity.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_JOB_DESC_LENGTH = 50000;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { job_description } = await req.json();

    if (!job_description) {
      return new Response(
        JSON.stringify({ title: 'Untitled Resume' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Generating title for job description using Perplexity...');

    const prompt = `Generate a short, descriptive resume title (3-6 words max) based on the job description. Include the job role and company if mentioned. Output only the title, nothing else. Examples: "Software Engineer at Google", "Senior React Developer", "Data Scientist - Startup".\n\nJOB DESCRIPTION:\n${job_description.substring(0, 1000)}`;

    const titleRaw = await askPerplexity(prompt, false) as string;
    let title = titleRaw.trim();

    // Clean up the title
    title = title.replace(/['"]/g, '').substring(0, 50);

    console.log('Generated title:', title);

    return new Response(
      JSON.stringify({ title }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating title:', error);
    return new Response(
      JSON.stringify({ title: 'Resume' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

