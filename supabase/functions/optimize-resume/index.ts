import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
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
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const { job_description } = await req.json();
    if (!job_description || typeof job_description !== 'string') return json({ error: 'Job description is required' }, 400);
    if (job_description.length > 50000) return json({ error: 'Job description too long (max 50000 characters)' }, 400);
    if (!GEMINI_API_KEY) return json({ error: 'AI service not configured' }, 503);
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Authentication required' }, 401);
    const admin = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    const auth = createClient(SUPABASE_URL!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: userError } = await auth.auth.getUser();
    if (userError || !user) return json({ error: 'Authentication failed' }, 401);
    const { data: profile, error: profileError } = await admin.from('profiles').select('credits, bonus_credits, plan_credits_used, plan').eq('user_id', user.id).single();
    if (profileError || !profile) return json({ error: 'Failed to fetch user profile' }, 500);
    const planCredits = profile.plan === 'pro' || profile.plan === 'basic' ? 100 : 10;
    const remainingPlanCredits = Math.max(0, planCredits - profile.plan_credits_used);
    if (remainingPlanCredits + profile.bonus_credits < 1) return json({ error: 'Insufficient credits. Please upgrade or add bonus credits.' }, 402);
    const { data: template } = await admin.from('templates').select('latex_code').eq('user_id', user.id).eq('is_default', true).maybeSingle();
    const prompt = `MY RESUME LATEX CODE:

${template?.latex_code || BASE_RESUME_TEMPLATE}

JOB DETAILS: ${job_description}

TASK: Revise the provided LaTeX resume code based on the posted job description. Incorporate all relevant ATS keywords to maximize the ATS score and improve shortlisting potential. Rephrase only the Professional Summary, Experience Descriptions, Project Descriptions, and Technologies sections based on the job description with same length as original text. Ensure the final version fits on one page, no text should exceed to next page please. Return only the complete updated LaTeX code, no explanations or additional text. Start with \\documentclass and end with \\end{document}.`;
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${GEMINI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'gemini-3.5-flash-lite', messages: [
        { role: 'system', content: 'You are an expert resume writer and ATS optimization specialist. You output only valid LaTeX code without any markdown formatting or explanations.' },
        { role: 'user', content: prompt },
      ] }),
    });
    if (!response.ok) {
      console.error('Gemini optimization failed:', response.status);
      return json({ error: response.status === 429 ? 'Gemini rate limit or quota exceeded. Please try again later.' : 'AI service error' }, response.status === 429 ? 429 : 502);
    }
    const data = await response.json();
    let latexCode = (data.choices?.[0]?.message?.content || '').trim().replace(/^```(?:latex|tex)?\s*/i, '').replace(/\s*```$/i, '');
    const start = latexCode.indexOf('\\documentclass');
    const end = latexCode.match(/\\end\{document\}/i);
    if (start < 0 || !end || end.index! < start) return json({ error: 'Incomplete LaTeX response. Please try again.' }, 502);
    latexCode = latexCode.substring(start, end.index! + end[0].length);
    const updateData = remainingPlanCredits >= 1 ? { plan_credits_used: profile.plan_credits_used + 1 } : { bonus_credits: Math.max(0, profile.bonus_credits - 1) };
    const { error: updateError } = await admin.from('profiles').update(updateData).eq('user_id', user.id);
    if (updateError) console.error('Failed to deduct credits:', updateError.code);
    return json({ success: true, latex_code: latexCode });
  } catch {
    return json({ error: 'Unable to optimize the resume. Please try again.' }, 500);
  }
});
