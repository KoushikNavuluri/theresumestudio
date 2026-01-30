import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";
import { encodeHex } from "https://deno.land/std@0.168.0/encoding/hex.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
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
Full-stack developer with expertise in Java, Javascript, Python, and database management.

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
\\textbf{Company Name} \\hfill \\textit{Date Range}\\\\
\\textit{Your Role}
\\begin{itemize}[leftmargin=1em, itemsep=3pt, topsep=4pt, parsep=0pt]
    \\item Achievement or responsibility
\\end{itemize}

\\vspace{12pt}

% Technologies
\\noindent\\textbf{Technologies}
\\vspace{2pt}
\\hrule
\\vspace{6pt}
\\noindent
\\textbf{Languages:} JavaScript, Python\\\\[4pt]
\\textbf{Technologies:} React, Node.js, Git

\\end{document}`;

const MAX_JOB_DESC_LENGTH = 50000;

// Rate limiting with in-memory cache (simple approach for edge functions)
const rateLimitCache = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(tokenId: string, limitPerMinute: number): boolean {
  const now = Date.now();
  const windowMs = 60000; // 1 minute
  
  const entry = rateLimitCache.get(tokenId);
  if (!entry || entry.resetAt < now) {
    rateLimitCache.set(tokenId, { count: 1, resetAt: now + windowMs });
    return true;
  }
  
  if (entry.count >= limitPerMinute) {
    return false;
  }
  
  entry.count++;
  return true;
}

async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return encodeHex(new Uint8Array(hashBuffer));
}

async function validateApiKey(supabase: any, apiKey: string) {
  const tokenHash = await hashToken(apiKey);
  
  const { data, error } = await supabase.rpc('validate_api_token', {
    p_token_hash: tokenHash
  });
  
  if (error || !data || data.length === 0) {
    return null;
  }
  
  return data[0];
}

async function logUsage(
  supabase: any,
  tokenId: string,
  userId: string,
  endpoint: string,
  method: string,
  statusCode: number,
  options: {
    requestSize?: number;
    responseSize?: number;
    latencyMs?: number;
    errorMessage?: string;
    ipAddress?: string;
    userAgent?: string;
  } = {}
) {
  try {
    await supabase.rpc('log_api_usage', {
      p_token_id: tokenId,
      p_user_id: userId,
      p_endpoint: endpoint,
      p_method: method,
      p_status_code: statusCode,
      p_request_size: options.requestSize || null,
      p_response_size: options.responseSize || null,
      p_latency_ms: options.latencyMs || null,
      p_error_message: options.errorMessage || null,
      p_ip_address: options.ipAddress || null,
      p_user_agent: options.userAgent || null,
    });
  } catch (e) {
    console.error('Failed to log API usage:', e);
  }
}

async function getUserCredits(supabase: any, userId: string) {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('credits, bonus_credits, plan_credits_used, plan')
    .eq('user_id', userId)
    .single();

  if (error || !profile) return null;

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

  return { profile, remainingPlanCredits, totalAvailable };
}

async function deductCredits(supabase: any, userId: string, profile: any, remainingPlanCredits: number) {
  let updateData: Record<string, number> = {};
  
  if (remainingPlanCredits >= 1) {
    updateData = { plan_credits_used: profile.plan_credits_used + 1 };
  } else {
    updateData = { bonus_credits: Math.max(0, profile.bonus_credits - 1) };
  }

  await supabase
    .from('profiles')
    .update(updateData)
    .eq('user_id', userId);
}

// API Handlers
async function handleOptimize(
  supabase: any,
  userId: string,
  body: { job_description: string; template?: string }
) {
  const { job_description, template } = body;

  if (!job_description || typeof job_description !== 'string') {
    return { error: 'job_description is required', status: 400 };
  }

  if (job_description.length > MAX_JOB_DESC_LENGTH) {
    return { error: `job_description too long (max ${MAX_JOB_DESC_LENGTH} characters)`, status: 400 };
  }

  // Check credits
  const credits = await getUserCredits(supabase, userId);
  if (!credits || credits.totalAvailable < 1) {
    return { error: 'Insufficient credits', status: 402 };
  }

  // Get user's default template or use provided/base
  let resumeTemplate = template || BASE_RESUME_TEMPLATE;
  
  if (!template) {
    const { data: userTemplate } = await supabase
      .from('templates')
      .select('latex_code')
      .eq('user_id', userId)
      .eq('is_default', true)
      .maybeSingle();
    
    if (userTemplate?.latex_code) {
      resumeTemplate = userTemplate.latex_code;
    }
  }

  const prompt = `MY RESUME LATEX CODE:

${resumeTemplate}

JOB DETAILS: ${job_description}

TASK: Revise the provided LaTeX resume code based on the posted job description. Incorporate all relevant ATS keywords to maximize the ATS score and improve shortlisting potential. Rephrase only the Professional Summary, Experience Descriptions, Project Descriptions, and Technologies sections based on the job description with same length as original text. Ensure the final version fits on one page. Return only the complete updated LaTeX code — no explanations or additional text. Start with \\documentclass and end with \\end{document}.`;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: 'You are an expert resume writer and ATS optimization specialist. You output only valid LaTeX code without any markdown formatting or explanations.' },
        { role: 'user', content: prompt }
      ],
    }),
  });

  if (!response.ok) {
    if (response.status === 429) return { error: 'Rate limit exceeded', status: 429 };
    if (response.status === 402) return { error: 'AI credits exhausted', status: 402 };
    return { error: 'AI service error', status: 500 };
  }

  const data = await response.json();
  let latexCode = data.choices?.[0]?.message?.content || '';

  // Clean up LaTeX
  latexCode = latexCode.trim();
  latexCode = latexCode.replace(/^```(?:latex|tex)?\s*/i, '');
  latexCode = latexCode.replace(/\s*```$/i, '');
  
  const docclassIndex = latexCode.indexOf('\\documentclass');
  if (docclassIndex > 0) latexCode = latexCode.substring(docclassIndex);
  
  const endDocMatch = latexCode.match(/\\end\{document\}/i);
  if (endDocMatch) latexCode = latexCode.substring(0, endDocMatch.index! + endDocMatch[0].length);

  // Deduct credits
  await deductCredits(supabase, userId, credits.profile, credits.remainingPlanCredits);

  return {
    data: {
      success: true,
      latex_code: latexCode,
      credits_remaining: credits.totalAvailable - 1
    },
    status: 200
  };
}

async function handleAnalyze(
  supabase: any,
  userId: string,
  body: { latex_code: string; job_description: string }
) {
  const { latex_code, job_description } = body;

  if (!latex_code || !job_description) {
    return { error: 'latex_code and job_description are required', status: 400 };
  }

  const prompt = `Analyze this resume against the job description for ATS compatibility.

RESUME (LaTeX):
${latex_code.substring(0, 10000)}

JOB DESCRIPTION:
${job_description.substring(0, 5000)}

Respond with a JSON object containing:
{
  "atsScore": <number 0-100>,
  "keywordMatch": <number 0-100>,
  "matchedKeywords": [<array of matched keywords>],
  "missingKeywords": [<array of important missing keywords>],
  "suggestions": [<array of improvement suggestions>]
}

Return ONLY the JSON object, no other text.`;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: 'You are an ATS analysis expert. Return only valid JSON.' },
        { role: 'user', content: prompt }
      ],
    }),
  });

  if (!response.ok) {
    return { error: 'AI service error', status: 500 };
  }

  const data = await response.json();
  let content = data.choices?.[0]?.message?.content || '{}';
  
  // Clean up JSON
  content = content.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
  
  try {
    const analysis = JSON.parse(content);
    return {
      data: {
        success: true,
        ...analysis
      },
      status: 200
    };
  } catch {
    return { error: 'Failed to parse analysis', status: 500 };
  }
}

async function handleConvert(
  _supabase: any,
  _userId: string,
  body: { latex_code: string }
) {
  const { latex_code } = body;

  if (!latex_code) {
    return { error: 'latex_code is required', status: 400 };
  }

  // Call external LaTeX to PDF service
  try {
    const response = await fetch('https://latexonline.cc/compile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `text=${encodeURIComponent(latex_code)}`,
    });

    if (!response.ok) {
      // Fallback: return LaTeX code with instructions
      return {
        data: {
          success: true,
          latex_code: latex_code,
          pdf_base64: null,
          message: 'PDF conversion unavailable. Use the LaTeX code with a local compiler.'
        },
        status: 200
      };
    }

    const pdfBuffer = await response.arrayBuffer();
    const pdfBase64 = btoa(String.fromCharCode(...new Uint8Array(pdfBuffer)));

    return {
      data: {
        success: true,
        pdf_base64: pdfBase64,
        content_type: 'application/pdf'
      },
      status: 200
    };
  } catch (e) {
    return {
      data: {
        success: true,
        latex_code: latex_code,
        pdf_base64: null,
        message: 'PDF conversion failed. Use the LaTeX code with a local compiler.'
      },
      status: 200
    };
  }
}

async function handleGetCredits(supabase: any, userId: string) {
  const credits = await getUserCredits(supabase, userId);
  if (!credits) {
    return { error: 'Failed to fetch credits', status: 500 };
  }

  return {
    data: {
      plan: credits.profile.plan,
      plan_credits_remaining: credits.remainingPlanCredits,
      bonus_credits: credits.profile.bonus_credits,
      total_available: credits.totalAvailable
    },
    status: 200
  };
}

async function handleListResumes(supabase: any, userId: string, query: URLSearchParams) {
  const limit = Math.min(parseInt(query.get('limit') || '20'), 100);
  const offset = parseInt(query.get('offset') || '0');

  const { data: resumes, error, count } = await supabase
    .from('resumes')
    .select('id, title, created_at, updated_at', { count: 'exact' })
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return { error: 'Failed to fetch resumes', status: 500 };
  }

  return {
    data: {
      resumes,
      total: count,
      limit,
      offset
    },
    status: 200
  };
}

async function handleGetResume(supabase: any, userId: string, resumeId: string) {
  const { data: resume, error } = await supabase
    .from('resumes')
    .select('*')
    .eq('user_id', userId)
    .eq('id', resumeId)
    .single();

  if (error || !resume) {
    return { error: 'Resume not found', status: 404 };
  }

  return { data: resume, status: 200 };
}

serve(async (req) => {
  const startTime = Date.now();
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
  const url = new URL(req.url);
  const path = url.pathname.replace('/public-api', '').replace(/^\/+/, '');
  const method = req.method;

  // Extract API key from header
  const apiKey = req.headers.get('x-api-key') || req.headers.get('authorization')?.replace('Bearer ', '');
  
  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error: 'API key required',
        message: 'Provide your API key via x-api-key header or Authorization: Bearer <key>'
      }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Validate API key
  const tokenData = await validateApiKey(supabase, apiKey);
  
  if (!tokenData) {
    return new Response(
      JSON.stringify({ error: 'Invalid or expired API key' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const { user_id: userId, token_id: tokenId, permissions, rate_limit_per_minute, rate_limit_per_day, requests_today } = tokenData;

  // Check daily rate limit
  if (requests_today > rate_limit_per_day) {
    await logUsage(supabase, tokenId, userId, path, method, 429, { errorMessage: 'Daily rate limit exceeded' });
    return new Response(
      JSON.stringify({ 
        error: 'Daily rate limit exceeded',
        limit: rate_limit_per_day,
        reset: 'midnight UTC'
      }),
      { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Check per-minute rate limit
  if (!checkRateLimit(tokenId, rate_limit_per_minute)) {
    await logUsage(supabase, tokenId, userId, path, method, 429, { errorMessage: 'Rate limit exceeded' });
    return new Response(
      JSON.stringify({ 
        error: 'Rate limit exceeded',
        limit: rate_limit_per_minute,
        window: '1 minute'
      }),
      { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  let result: { data?: any; error?: string; status: number };
  const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip');
  const userAgent = req.headers.get('user-agent');

  try {
    // Route handling
    if (method === 'POST' && path === 'optimize') {
      if (!permissions.includes('optimize')) {
        result = { error: 'Permission denied for optimize endpoint', status: 403 };
      } else {
        const body = await req.json();
        result = await handleOptimize(supabase, userId, body);
      }
    } else if (method === 'POST' && path === 'analyze') {
      if (!permissions.includes('analyze')) {
        result = { error: 'Permission denied for analyze endpoint', status: 403 };
      } else {
        const body = await req.json();
        result = await handleAnalyze(supabase, userId, body);
      }
    } else if (method === 'POST' && path === 'convert') {
      if (!permissions.includes('convert')) {
        result = { error: 'Permission denied for convert endpoint', status: 403 };
      } else {
        const body = await req.json();
        result = await handleConvert(supabase, userId, body);
      }
    } else if (method === 'GET' && path === 'credits') {
      result = await handleGetCredits(supabase, userId);
    } else if (method === 'GET' && path === 'resumes') {
      result = await handleListResumes(supabase, userId, url.searchParams);
    } else if (method === 'GET' && path.startsWith('resumes/')) {
      const resumeId = path.replace('resumes/', '');
      result = await handleGetResume(supabase, userId, resumeId);
    } else {
      result = {
        error: 'Not found',
        status: 404
      };
    }
  } catch (e) {
    console.error('API error:', e);
    result = { error: e instanceof Error ? e.message : 'Internal error', status: 500 };
  }

  const latencyMs = Date.now() - startTime;
  const responseBody = result.error ? { error: result.error } : result.data;
  const responseStr = JSON.stringify(responseBody);

  // Log usage
  await logUsage(supabase, tokenId, userId, path, method, result.status, {
    latencyMs,
    responseSize: responseStr.length,
    errorMessage: result.error,
    ipAddress: ipAddress || undefined,
    userAgent: userAgent || undefined,
  });

  return new Response(responseStr, {
    status: result.status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
});
