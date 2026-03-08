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
        const { messages, resumeData, currentStep } = await req.json();

        if (!LOVABLE_API_KEY) {
            return new Response(
                JSON.stringify({ error: 'AI service not configured' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const systemPrompt = `You are an expert AI Resume Assistant. Your goal is to help the user build a high-quality, ATS-friendly resume through a conversational interface.

CURRENT RESUME DATA:
${JSON.stringify(resumeData, null, 2)}

CURRENT STEP: ${currentStep}

INSTRUCTIONS:
1. Analyze the user's latest message.
2. If the user's information for the current step is incomplete or potentially incorrect (e.g., missing email in personal info, extremely short experience), ask for clarification or missing details politely.
3. If the information is sufficient, acknowledge it and move to the next logical question.
4. Structure your response to be helpful, encouraging, and professional.
5. If the user provides info out of order, update the data and address it.
6. Keep your responses concise but friendly.

STEPS OVERVIEW:
- personal: Name, email, phone, LinkedIn, Portfolio.
- experience: Work history, roles, achievements.
- education: Degree, University, dates.
- skills: Tech stack, soft skills.
- projects: Notable projects and technologies.
- certifications: Professional certifications.

OUTPUT FORMAT:
Return a JSON object with:
{
  "reply": "Your message to the user",
  "updatedData": { ... filtered and structured data extracted from user message ... },
  "shouldAdvaceStep": true/false,
  "confidenceScore": 0.9 // optional
}`;

        const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${LOVABLE_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'google/gemini-2.5-flash',
                messages: [
                    { role: 'system', content: systemPrompt },
                    ...messages.slice(-5) // Send last 5 messages for context
                ],
                response_format: { type: "json_object" }
            }),
        });

        if (!response.ok) {
            throw new Error(`AI Gateway error: ${response.status}`);
        }

        const data = await response.json();
        const aiResponse = JSON.parse(data.choices[0].message.content);

        return new Response(
            JSON.stringify(aiResponse),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error('Error in resume-chat function:', error);
        return new Response(
            JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
