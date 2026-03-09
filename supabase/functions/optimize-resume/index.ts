import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { askPerplexity } from "../_shared/perplexity.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    \\item Developed a web-based URL shortening service using Python and Flask framework, enabling users to create short, unique URLs that redirect to specific websites
    \\item Implemented secure URL generation with collision detection and database storage using SQLite for efficient data management
    \\item Added analytics tracking to monitor click counts and user engagement, providing valuable insights for URL performance
    \\item Designed responsive web interface with user-friendly features including custom alias options and expiration date settings
\\end{itemize}

\\vspace{6pt}

\\noindent
\\textbf{Weather Forecasting Application - Python, APIs, Data Visualization}
\\begin{itemize}[leftmargin=1em, itemsep=3pt, topsep=4pt, parsep=0pt]
    \\item Built a comprehensive weather forecasting application that fetches real-time weather information from cities worldwide using REST APIs
    \\item Integrated multiple weather data sources to ensure accuracy and reliability of forecasts across different geographical locations
\\end{itemize}

\\vspace{12pt}

% Technologies
\\noindent\\textbf{Technologies}
\\vspace{2pt}
\\hrule
\\vspace{6pt}
\\noindent
\\textbf{Languages:} JavaScript, Flutter, Python \\newline \\vspace{4pt}
\\textbf{Technologies:} ReactJs, Redux, NextJS, Git, Jenkins, Docker, Kubernetes, Kafka, Chrome Dev Tools \\newline \\vspace{4pt}
\\textbf{Databases:} MongoDB, PostgreSQL, Redis, MySQL. \\newline \\vspace{4pt}
\\textbf{Coursework:} OOPs, OS, DBMS, Design Patterns, Microservices, SDLC. \\newline \\vspace{4pt}
\\textbf{Other Skills:} Agile development, workflow design, stakeholder management, global collaboration

\\end{document}`;

const MAX_JOB_DESC_LENGTH = 50000;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { job_description } = await req.json();

    if (!job_description || typeof job_description !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Job description is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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

    const supabaseAdmin = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    const supabaseClient = createClient(SUPABASE_URL!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Authentication failed' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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

    const prompt = `REVISE THIS LATEX RESUME BASED ON THE JOB DESCRIPTION.
    
MY CURRENT RESUME (LaTeX):
${resumeTemplate}

JOB DESCRIPTION/DETAILS:
${job_description}

GUIDELINES:
1. Rephrase the Professional Summary to align with the core requirements of the job.
2. Update Experience Descriptions and Project Descriptions bullet points using job-specific keywords.
3. CRITICAL: For the "Technologies" section, select the most relevant skills from the job description that I possess. 
4. MAINTAIN FORMATTING: Keep the exact LaTeX structure. For the Technologies section, use the format: \\textbf{Category:} Skill1, Skill2... \\newline \\vspace{4pt}
   Wait! IMPORTANT: Do NOT use the \\[4pt] command as it causes errors. Use exactly: \\newline \\vspace{4pt} after each category.
5. ATS OPTIMIZATION: Maximize keyword overlap.
6. ONE PAGE LIMIT: Ensure the final output fits on one page.
7. OUTPUT ONLY CODE: Provide ONLY the complete updated LaTeX code starting with \\documentclass and ending with \\end{document}. No explanations, no markdown code fences.`;

    console.log('Calling Perplexity for resume optimization...');
    const latexCodeRaw = await askPerplexity(prompt, false) as string;

    // Clean up the LaTeX code
    let latexCode = latexCodeRaw.trim();
    latexCode = latexCode.replace(/^```(?:latex|tex)?\s*/i, '');
    latexCode = latexCode.replace(/\s*```$/i, '');

    const docclassIndex = latexCode.indexOf('\\documentclass');
    if (docclassIndex > 0) {
      latexCode = latexCode.substring(docclassIndex);
    }

    const endDocMatch = latexCode.match(/\\end\{document\}/i);
    if (endDocMatch) {
      latexCode = latexCode.substring(0, endDocMatch.index! + endDocMatch[0].length);
    }

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

