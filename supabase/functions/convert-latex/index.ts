import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function submitLatex(latexCode: string, uniqueId: string): Promise<boolean> {
  const url = `https://texviewer.herokuapp.com/upload.php?uid=${uniqueId}`;
  
  const formData = new URLSearchParams();
  formData.append('texts', latexCode);
  formData.append('nonstopmode', '1');
  formData.append('title', 'Optimized Resume');

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString(),
  });

  return response.status === 200;
}

async function checkPdfStatus(uniqueId: string, maxAttempts = 30, delay = 2000): Promise<{ success: boolean; pdfUrl?: string; error?: string }> {
  const checkUrl = 'https://texviewer.herokuapp.com/upload.php?action=checkcomplete';

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const formData = new URLSearchParams();
      formData.append('uid', uniqueId);
      formData.append('resultfile', `temp/${uniqueId}-result.txt`);

      const response = await fetch(checkUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      if (response.status === 200) {
        const result = await response.json();

        if (result.error) {
          return { success: false, error: result.error };
        }

        if (result.pdfname) {
          return { success: true, pdfUrl: result.pdfname };
        }

        if (result.progress !== undefined) {
          console.log(`PDF generation progress: ${result.progress}%`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }
    } catch (error) {
      console.error(`Attempt ${attempt + 1} failed:`, error);
      if (attempt < maxAttempts - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
    }
  }

  return { success: false, error: 'PDF generation timeout' };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { latex_code } = await req.json();

    if (!latex_code) {
      return new Response(
        JSON.stringify({ error: 'LaTeX code is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const uniqueId = crypto.randomUUID();
    console.log(`Starting PDF generation with ID: ${uniqueId}`);

    // Submit LaTeX code
    const submitted = await submitLatex(latex_code, uniqueId);
    if (!submitted) {
      return new Response(
        JSON.stringify({ error: 'Failed to submit LaTeX code' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('LaTeX submitted, checking for PDF...');

    // Check for PDF completion
    const result = await checkPdfStatus(uniqueId);

    if (result.success && result.pdfUrl) {
      console.log(`PDF generated successfully: ${result.pdfUrl}`);
      return new Response(
        JSON.stringify({ 
          success: true, 
          pdf_url: result.pdfUrl,
          message: 'PDF generated successfully'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      console.error('PDF generation failed:', result.error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: result.error || 'PDF generation failed'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Error in convert-latex function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
