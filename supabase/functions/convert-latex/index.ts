import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LATEX_API_URL = 'https://latex.ytotech.com/builds/sync';

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

    console.log('Starting PDF generation with ytotech API...');

    const payload = {
      compiler: "pdflatex",
      resources: [
        {
          main: true,
          content: latex_code
        }
      ]
    };

    const response = await fetch(LATEX_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('LaTeX API error:', response.status, errorText);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `LaTeX compilation failed: ${errorText.slice(0, 500)}` 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // The API returns the PDF directly as binary
    const pdfBuffer = await response.arrayBuffer();
    const pdfBase64 = btoa(
      new Uint8Array(pdfBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
    );

    console.log('PDF generated successfully, size:', pdfBuffer.byteLength, 'bytes');

    return new Response(
      JSON.stringify({ 
        success: true, 
        pdf_base64: pdfBase64,
        message: 'PDF generated successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in convert-latex function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
