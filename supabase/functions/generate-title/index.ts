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
    const { job_description } = await req.json();

    if (!job_description) {
      return new Response(
        JSON.stringify({ title: 'Untitled Resume' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!LOVABLE_API_KEY) {
      console.log('LOVABLE_API_KEY not configured, using fallback title');
      // Fallback: extract company/role from text
      const words = job_description.split(/\s+/).slice(0, 20);
      const roleMatch = job_description.match(/(?:software|senior|junior|lead|principal|staff|frontend|backend|full.?stack|data|devops|cloud|mobile|web|ui|ux|product)\s*(?:engineer|developer|designer|architect|manager|analyst)/i);
      const title = roleMatch ? roleMatch[0] : 'Resume';
      return new Response(
        JSON.stringify({ title }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Generating title for job description...');

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
            content: 'You are a helpful assistant. Generate a short, descriptive resume title (3-6 words max) based on the job description. Include the job role and company if mentioned. Output only the title, nothing else. Examples: "Software Engineer at Google", "Senior React Developer", "Data Scientist - Startup"' 
          },
          { role: 'user', content: `Generate a resume title for this job:\n\n${job_description.substring(0, 1000)}` }
        ],
      }),
    });

    if (!response.ok) {
      console.error('AI API error:', response.status);
      return new Response(
        JSON.stringify({ title: 'Resume' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    let title = data.choices?.[0]?.message?.content?.trim() || 'Resume';
    
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
