import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
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
\\hypersetup{colorlinks=true,linkcolor=black,urlcolor=black}
\\pagestyle{empty}
\\setlength{\\parindent}{0pt}
\\setlength{\\parskip}{0pt}
\\setlength{\\itemsep}{0pt}
\\begin{document}
\\begin{center}
{\\huge \\textbf{YOUR NAME}}
\\end{center}
\\begin{center}
\\small
\\faEnvelope\\ \\href{mailto:youremail@gmail.com}{youremail@gmail.com} \\quad
\\faPhone\\ 1234567890 \\quad
\\faGlobe\\ \\href{https://portfolio.com}{portfolio} \\quad
\\faLinkedin\\ \\href{https://linkedin.com/yourid}{LinkedIn} \\quad
\\faGithub\\ \\href{https://github.com/yourid}{Github}
\\end{center}
\\vspace{6pt}
\\noindent\\textbf{Professional Summary}
\\vspace{2pt}
\\hrule
\\vspace{6pt}
\\noindent
Full-stack developer with expertise in Java, Javascript, Python, and database management.
\\vspace{12pt}
\\noindent\\textbf{Education}
\\vspace{2pt}
\\hrule
\\vspace{6pt}
\\noindent
\\textbf{Your University/College} \\hfill \\textit{July 20xx - May 20xx}\\\\
\\textit{B.Tech in Computer Science and Engineering} \\hfill GPA: X.X/10
\\vspace{12pt}
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
\\noindent\\textbf{Technologies}
\\vspace{2pt}
\\hrule
\\vspace{6pt}
\\noindent
\\textbf{Languages:} JavaScript, Python\\\\[4pt]
\\textbf{Technologies:} React, Node.js, Git
\\end{document}`;
const rateLimitCache = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(tokenId: string, limit: number): boolean {
  const now = Date.now();
  const entry = rateLimitCache.get(tokenId);
  if (!entry || entry.resetAt < now) { rateLimitCache.set(tokenId, { count: 1, resetAt: now + 60000 }); return true; }
  if (entry.count >= limit) return false;
  entry.count++; return true;
}
async function hashToken(token: string): Promise<string> {
  const bytes = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token)));
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}
async function getUserCredits(supabase: any, userId: string) {
  const { data: profile, error } = await supabase.from('profiles').select('credits, bonus_credits, plan_credits_used, plan').eq('user_id', userId).single();
  if (error || !profile) return null;
  const planCredits = profile.plan === 'pro' || profile.plan === 'basic' ? 100 : 10;
  const remainingPlanCredits = Math.max(0, planCredits - profile.plan_credits_used);
  return { profile, remainingPlanCredits, totalAvailable: remainingPlanCredits + profile.bonus_credits };
}
async function deductCredits(supabase: any, userId: string, profile: any, remaining: number) {
  const update = remaining >= 1 ? { plan_credits_used: profile.plan_credits_used + 1 } : { bonus_credits: Math.max(0, profile.bonus_credits - 1) };
  const { error } = await supabase.from('profiles').update(update).eq('user_id', userId);
  if (error) console.error('Credit update failed:', error.code);
}
async function gemini(system: string, prompt: string, asJson = false) {
  return fetch('https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${GEMINI_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'gemini-3.5-flash-lite', messages: [
      { role: 'system', content: system }, { role: 'user', content: prompt },
    ], ...(asJson ? { response_format: { type: 'json_object' } } : {}) }),
  });
}
async function handleOptimize(supabase: any, userId: string, body: { job_description: string; template?: string }) {
  const { job_description, template } = body;
  if (!job_description || typeof job_description !== 'string') return { error: 'job_description is required', status: 400 };
  if (job_description.length > 50000) return { error: 'job_description too long (max 50000 characters)', status: 400 };
  if (template !== undefined && (typeof template !== 'string' || template.length > 100000)) return { error: 'Invalid template', status: 400 };
  if (!GEMINI_API_KEY) return { error: 'AI service not configured', status: 503 };
  const credits = await getUserCredits(supabase, userId);
  if (!credits || credits.totalAvailable < 1) return { error: 'Insufficient credits', status: 402 };
  let resumeTemplate = template || BASE_RESUME_TEMPLATE;
  if (!template) {
    const { data } = await supabase.from('templates').select('latex_code').eq('user_id', userId).eq('is_default', true).maybeSingle();
    if (data?.latex_code) resumeTemplate = data.latex_code;
  }
  const prompt = `MY RESUME LATEX CODE:\n\n${resumeTemplate}\n\nJOB DETAILS: ${job_description}\n\nTASK: Revise the provided LaTeX resume code based on the posted job description. Incorporate all relevant ATS keywords to maximize the ATS score and improve shortlisting potential. Rephrase only the Professional Summary, Experience Descriptions, Project Descriptions, and Technologies sections based on the job description with same length as original text. Ensure the final version fits on one page. Return only the complete updated LaTeX code, no explanations or additional text. Start with \\documentclass and end with \\end{document}.`;
  const response = await gemini('You are an expert resume writer and ATS optimization specialist. You output only valid LaTeX code without any markdown formatting or explanations.', prompt);
  if (!response.ok) return { error: response.status === 429 ? 'Gemini rate limit or quota exceeded' : 'AI service error', status: response.status === 429 ? 429 : 502 };
  const data = await response.json();
  let latexCode = (data.choices?.[0]?.message?.content || '').trim().replace(/^```(?:latex|tex)?\s*/i, '').replace(/\s*```$/i, '');
  const start = latexCode.indexOf('\\documentclass');
  const end = latexCode.match(/\\end\{document\}/i);
  if (start < 0 || !end || end.index! < start) return { error: 'Incomplete LaTeX response', status: 502 };
  latexCode = latexCode.substring(start, end.index! + end[0].length);
  await deductCredits(supabase, userId, credits.profile, credits.remainingPlanCredits);
  return { data: { success: true, latex_code: latexCode, credits_remaining: credits.totalAvailable - 1 }, status: 200 };
}
async function handleAnalyze(_supabase: any, _userId: string, body: { latex_code: string; job_description: string }) {
  const { latex_code, job_description } = body;
  if (!latex_code || !job_description || typeof latex_code !== 'string' || typeof job_description !== 'string') return { error: 'latex_code and job_description are required strings', status: 400 };
  if (!GEMINI_API_KEY) return { error: 'AI service not configured', status: 503 };
  const prompt = `Analyze this resume against the job description for ATS compatibility.\n\nRESUME (LaTeX):\n${latex_code.substring(0, 10000)}\n\nJOB DESCRIPTION:\n${job_description.substring(0, 5000)}\n\nReturn ONLY a JSON object with atsScore (0-100), keywordMatch (0-100), matchedKeywords (string array), missingKeywords (string array), and suggestions (string array).`;
  const response = await gemini('You are an ATS analysis expert. Return only valid JSON.', prompt, true);
  if (!response.ok) return { error: response.status === 429 ? 'Gemini rate limit or quota exceeded' : 'AI service error', status: response.status === 429 ? 429 : 502 };
  const data = await response.json();
  try {
    const content = (data.choices?.[0]?.message?.content || '').replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    const analysis = JSON.parse(content);
    if (!Number.isFinite(analysis.atsScore) || analysis.atsScore < 0 || analysis.atsScore > 100 || !Number.isFinite(analysis.keywordMatch) || analysis.keywordMatch < 0 || analysis.keywordMatch > 100 || ![analysis.matchedKeywords, analysis.missingKeywords, analysis.suggestions].every(v => Array.isArray(v) && v.every(x => typeof x === 'string'))) return { error: 'Invalid analysis response', status: 502 };
    return { data: { success: true, atsScore: analysis.atsScore, keywordMatch: analysis.keywordMatch, matchedKeywords: analysis.matchedKeywords, missingKeywords: analysis.missingKeywords, suggestions: analysis.suggestions }, status: 200 };
  } catch { return { error: 'Failed to parse analysis', status: 502 }; }
}
async function handleConvert(_supabase: any, _userId: string, body: { latex_code: string }) {
  const { latex_code } = body;
  if (!latex_code || typeof latex_code !== 'string' || latex_code.length > 100000) return { error: 'latex_code is required (max 100000 characters)', status: 400 };
  try {
    const response = await fetch('https://latexonline.cc/compile', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: `text=${encodeURIComponent(latex_code)}` });
    if (!response.ok) return { data: { success: true, latex_code, pdf_base64: null, message: 'PDF conversion unavailable. Use the LaTeX code with a local compiler.' }, status: 200 };
    const bytes = new Uint8Array(await response.arrayBuffer());
    const pdfBase64 = btoa(bytes.reduce((result, byte) => result + String.fromCharCode(byte), ''));
    return { data: { success: true, pdf_base64: pdfBase64, content_type: 'application/pdf' }, status: 200 };
  } catch { return { data: { success: true, latex_code, pdf_base64: null, message: 'PDF conversion failed. Use the LaTeX code with a local compiler.' }, status: 200 }; }
}
async function handleGetCredits(supabase: any, userId: string) {
  const credits = await getUserCredits(supabase, userId);
  if (!credits) return { error: 'Failed to fetch credits', status: 500 };
  return { data: { plan: credits.profile.plan, plan_credits_remaining: credits.remainingPlanCredits, bonus_credits: credits.profile.bonus_credits, total_available: credits.totalAvailable }, status: 200 };
}
async function handleListResumes(supabase: any, userId: string, query: URLSearchParams) {
  const limit = Math.min(Math.max(parseInt(query.get('limit') || '20') || 20, 1), 100);
  const offset = Math.max(parseInt(query.get('offset') || '0') || 0, 0);
  const { data: resumes, error, count } = await supabase.from('resumes').select('id, title, created_at, updated_at', { count: 'exact' }).eq('user_id', userId).order('updated_at', { ascending: false }).range(offset, offset + limit - 1);
  return error ? { error: 'Failed to fetch resumes', status: 500 } : { data: { resumes, total: count, limit, offset }, status: 200 };
}
async function handleGetResume(supabase: any, userId: string, resumeId: string) {
  const { data: resume, error } = await supabase.from('resumes').select('*').eq('user_id', userId).eq('id', resumeId).single();
  return error || !resume ? { error: 'Resume not found', status: 404 } : { data: resume, status: 200 };
}
const json = (body: unknown, status: number) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  const startTime = Date.now();
  try {
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    const url = new URL(req.url);
    const path = url.pathname.replace('/public-api', '').replace(/^\/+/, '');
    const method = req.method;
    const apiKey = req.headers.get('x-api-key') || req.headers.get('authorization')?.replace('Bearer ', '');
    if (!apiKey) return json({ error: 'API key required', message: 'Provide your API key via x-api-key header or Authorization: Bearer <key>' }, 401);
    const { data: tokens, error: tokenError } = await supabase.rpc('validate_api_token', { p_token_hash: await hashToken(apiKey) });
    if (tokenError || !tokens?.length) return json({ error: 'Invalid or expired API key' }, 401);
    const { user_id: userId, token_id: tokenId, permissions, rate_limit_per_minute, rate_limit_per_day, requests_today } = tokens[0];
    if (requests_today > rate_limit_per_day) return json({ error: 'Daily rate limit exceeded', limit: rate_limit_per_day, reset: 'midnight UTC' }, 429);
    if (!checkRateLimit(tokenId, rate_limit_per_minute)) return json({ error: 'Rate limit exceeded', limit: rate_limit_per_minute, window: '1 minute' }, 429);
    let result: { data?: any; error?: string; status: number };
    if (method === 'POST' && ['optimize', 'analyze', 'convert'].includes(path)) {
      if (!Array.isArray(permissions) || !permissions.includes(path)) result = { error: `Permission denied for ${path} endpoint`, status: 403 };
      else {
        const body = await req.json();
        result = path === 'optimize' ? await handleOptimize(supabase, userId, body) : path === 'analyze' ? await handleAnalyze(supabase, userId, body) : await handleConvert(supabase, userId, body);
      }
    } else if (method === 'GET' && path === 'credits') result = await handleGetCredits(supabase, userId);
    else if (method === 'GET' && path === 'resumes') result = await handleListResumes(supabase, userId, url.searchParams);
    else if (method === 'GET' && path.startsWith('resumes/')) result = await handleGetResume(supabase, userId, path.replace('resumes/', ''));
    else result = { error: 'Not found', status: 404 };
    const responseBody = result.error ? { error: result.error } : result.data;
    const { error: logError } = await supabase.rpc('log_api_usage', {
      p_token_id: tokenId, p_user_id: userId, p_endpoint: path, p_method: method, p_status_code: result.status,
      p_request_size: null, p_response_size: new TextEncoder().encode(JSON.stringify(responseBody)).length,
      p_latency_ms: Date.now() - startTime, p_error_message: result.error || null,
      p_ip_address: req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip'), p_user_agent: req.headers.get('user-agent'),
    });
    if (logError) console.error('Failed to log API usage:', logError.code);
    return json(responseBody, result.status);
  } catch {
    return json({ error: 'Internal server error' }, 500);
  }
});
