import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const BASE_RESUME_TEMPLATE = `\\documentclass[10pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[margin=0.5in]{geometry}
\\usepackage{enumitem}
\\usepackage{hyperref}
\\usepackage{fontawesome}
\\usepackage{lmodern}

\\hypersetup{
    colorlinks=true,
    linkcolor=black,
    urlcolor=black,
}

\\pagestyle{empty}

\\setlength{\\parindent}{0pt}
\\setlength{\\parskip}{0pt}
\\setlength{\\itemsep}{0pt}

\\begin{document}

% Name
\\begin{center}
{\\huge \\textbf{YOUR NAME}}
\\end{center}

% Contact Info
\\begin{center}
\\small
\\faEnvelope\\ \\href{mailto:youremail@gmail.com}{youremail@gmail.com} \\quad
\\faPhone\\ 1234567890 \\quad
\\faGlobe\\ \\href{https://portfolio.com}{portfolio} \\quad
\\faLinkedin\\ \\href{https://linkedin.com/yourid}{LinkedIn} \\quad
\\faGithub\\ \\href{https://github.com/yourid}{Github}
\\end{center}

\\vspace{6pt}

% Professional Summary
\\noindent\\textbf{Professional Summary}
\\vspace{2pt}
\\hrule
\\vspace{6pt}
\\noindent
Full-stack developer with expertise in Java, Javascript, Python, and database management. Experienced in Agile development, end-to-end systems design, and delivering scalable solutions. Proven ability to build strong business relationships and manage projects in dynamic environments. Skilled in problem-solving, technical design, and collaborating with global teams

\\vspace{12pt}

% Education
\\noindent\\textbf{Education}
\\vspace{2pt}
\\hrule
\\vspace{6pt}
\\noindent
\\textbf{Your University/College} \\hfill \\textit{July 20xx - May 20xx}\\\\
\\textit{B.Tech in Computer Science and Engineering} \\hfill GPA: X.X/10

\\vspace{12pt}

% Experience
\\noindent\\textbf{Experience}
\\vspace{2pt}
\\hrule
\\vspace{6pt}
\\noindent
\\textbf{Company 1} \\hfill \\textit{Sep 2023 - Present}\\\\
\\textit{Software Engineer - Microservices, AI Integration, React}
\\begin{itemize}[leftmargin=1em, itemsep=3pt, topsep=4pt, parsep=0pt]
    \\item Developed and maintained retail applications for enterprise clients, implementing scalable microservices architecture using React.
    \\item Integrated AI agent solutions to enhance customer experience and automate business processes, resulting in 25% improvement in operational efficiency
    \\item Collaborated with cross-functional teams to deliver end-to-end solutions for retail clients, ensuring high-quality deliverables and client satisfaction
    \\item Implemented robust data processing pipelines and API integrations to support real-time retail operations and inventory management
    \\item Utilized modern development practices including CI/CD pipelines, automated testing, and cloud deployment strategies
\\end{itemize}

\\vspace{6pt}

\\noindent
\\textbf{Company 2} \\hfill \\textit{Feb 2023 - Apr 2023}\\\\
\\textit{Data Science Intern}
\\begin{itemize}[leftmargin=1em, itemsep=3pt, topsep=4pt, parsep=0pt]
    \\item Explored and analyzed real-world datasets to extract meaningful insights and patterns using Python, Pandas, and NumPy
    \\item Performed comprehensive data preprocessing including cleaning, normalization, and feature engineering for machine learning models
    \\item Developed automated data processing workflows that reduced manual analysis time by 40%
\\end{itemize}

\\vspace{12pt}

% Projects
\\noindent\\textbf{Projects}
\\vspace{2pt}
\\hrule
\\vspace{6pt}
\\noindent
\\textbf{URL Shortener - Python, Flask, SQLite}
\\begin{itemize}[leftmargin=1em, itemsep=3pt, topsep=4pt, parsep=0pt]
    \\item Developed a web-based URL shortening service using Python and Flask framework
    \\item Implemented secure URL generation with collision detection and database storage
    \\item Added analytics tracking to monitor click counts and user engagement
    \\item Designed responsive web interface with user-friendly features
\\end{itemize}

\\vspace{6pt}

\\noindent
\\textbf{Weather Forecasting Application - Python, APIs, Data Visualization}
\\begin{itemize}[leftmargin=1em, itemsep=3pt, topsep=4pt, parsep=0pt]
    \\item Built a comprehensive weather forecasting application that fetches real-time weather information
    \\item Integrated multiple weather data sources to ensure accuracy and reliability
\\end{itemize}

\\vspace{12pt}

% Technologies
\\noindent\\textbf{Technologies}
\\vspace{2pt}
\\hrule
\\vspace{6pt}
\\noindent
\\textbf{Languages:} JavaScript, Flutter, Python\\\\[4pt]
\\textbf{Technologies:} ReactJs, Redux, NextJS, Git, Jenkins, Docker, Kubernetes, Kafka, Chrome Dev Tools\\\\[4pt]
\\textbf{Databases:} MongoDB, PostgreSQL, Redis, MySQL.\\\\[4pt]
\\textbf{Coursework:} OOPs, OS, DBMS, Design Patterns, Microservices, SDLC.\\\\[4pt]
\\textbf{Other Skills:} Agile development, workflow design, stakeholder management, global collaboration

\\end{document}`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { job_description } = await req.json();

    if (!job_description) {
      return new Response(
        JSON.stringify({ error: 'Job description is required' }),
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

    // Get the user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role for admin operations
    const supabaseAdmin = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    
    // Create client with user's token to get their info
    const supabaseClient = createClient(SUPABASE_URL!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get current user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      console.error('User auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'Authentication failed' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user's profile to check credits
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('credits, bonus_credits, plan_credits_used, plan')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('Profile fetch error:', profileError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch user profile' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate available credits
    const getPlanCredits = (plan: string) => {
      switch (plan) {
        case 'pro': return 100;
        case 'basic': return 100;
        default: return 10;
      }
    };

    const planCredits = getPlanCredits(profile.plan);
    const remainingPlanCredits = Math.max(0, planCredits - profile.plan_credits_used);
    const totalAvailable = remainingPlanCredits + profile.bonus_credits;

    if (totalAvailable < 1) {
      return new Response(
        JSON.stringify({ error: 'Insufficient credits. Please upgrade or add bonus credits.' }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user's default template if available
    const { data: template } = await supabaseAdmin
      .from('templates')
      .select('latex_code')
      .eq('user_id', user.id)
      .eq('is_default', true)
      .maybeSingle();

    const resumeTemplate = template?.latex_code || BASE_RESUME_TEMPLATE;

    const prompt = `MY RESUME LATEX CODE:

${resumeTemplate}

JOB DETAILS: ${job_description}

TASK: Revise the provided LaTeX resume code based on the posted job description. Incorporate all relevant ATS keywords to maximize the ATS score and improve shortlisting potential. Rephrase only the Professional Summary, Experience Descriptions, Project Descriptions, and Technologies sections based on the job description with same length as original text. Ensure the final version fits on one page, no text should exceed to next page please. Return only the complete updated LaTeX code — no explanations or additional text. Start with \\documentclass and end with \\end{document}.`;

    console.log('Calling Lovable AI Gateway for resume optimization...');

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
            content: 'You are an expert resume writer and ATS optimization specialist. You output only valid LaTeX code without any markdown formatting or explanations.' 
          },
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        console.error('Rate limit exceeded');
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        console.error('Payment required');
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
    let latexCode = data.choices?.[0]?.message?.content || '';

    // Clean up the LaTeX code
    latexCode = latexCode.trim();
    
    // Remove markdown code fences if present
    latexCode = latexCode.replace(/^```(?:latex|tex)?\s*/i, '');
    latexCode = latexCode.replace(/\s*```$/i, '');
    
    // Ensure it starts with \documentclass
    const docclassIndex = latexCode.indexOf('\\documentclass');
    if (docclassIndex > 0) {
      latexCode = latexCode.substring(docclassIndex);
    }
    
    // Ensure it ends with \end{document}
    const endDocMatch = latexCode.match(/\\end\{document\}/i);
    if (endDocMatch) {
      latexCode = latexCode.substring(0, endDocMatch.index! + endDocMatch[0].length);
    }

    // Deduct credits after successful generation
    // First use plan credits, then bonus credits
    let updateData: Record<string, number> = {};
    
    if (remainingPlanCredits >= 1) {
      // Deduct from plan credits
      updateData = { plan_credits_used: profile.plan_credits_used + 1 };
    } else {
      // Deduct from bonus credits
      updateData = { bonus_credits: Math.max(0, profile.bonus_credits - 1) };
    }

    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update(updateData)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Failed to deduct credits:', updateError);
      // Continue anyway since the generation was successful
    } else {
      console.log('Credits deducted successfully for user:', user.id);
    }

    console.log('Resume optimization completed successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        latex_code: latexCode 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in optimize-resume function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
