import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { code } = await req.json();
    console.log('Redeeming code:', code, 'for user:', user.id);

    if (!code || typeof code !== 'string') {
      return new Response(JSON.stringify({ error: 'Invalid code' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Find the bonus code
    const { data: bonusCode, error: codeError } = await supabaseAdmin
      .from('bonus_codes')
      .select('*')
      .eq('code', code.toUpperCase().trim())
      .eq('is_active', true)
      .single();

    if (codeError || !bonusCode) {
      console.log('Code not found or inactive');
      return new Response(JSON.stringify({ error: 'Invalid or expired code' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if code has expired
    if (bonusCode.expires_at && new Date(bonusCode.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: 'This code has expired' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if max uses reached
    if (bonusCode.max_uses && bonusCode.uses >= bonusCode.max_uses) {
      return new Response(JSON.stringify({ error: 'This code has reached its usage limit' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user already redeemed this code
    const { data: existingRedemption } = await supabaseAdmin
      .from('redeemed_codes')
      .select('id')
      .eq('user_id', user.id)
      .eq('bonus_code_id', bonusCode.id)
      .single();

    if (existingRedemption) {
      return new Response(JSON.stringify({ error: 'You have already redeemed this code' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Add credits to user
    const { data: profile, error: profileFetchError } = await supabaseAdmin
      .from('profiles')
      .select('bonus_credits')
      .eq('user_id', user.id)
      .single();

    if (profileFetchError) {
      console.error('Error fetching profile:', profileFetchError);
      return new Response(JSON.stringify({ error: 'Failed to fetch profile' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const newBonusCredits = (profile?.bonus_credits || 0) + bonusCode.credits;

    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ bonus_credits: newBonusCredits })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Error updating profile:', updateError);
      return new Response(JSON.stringify({ error: 'Failed to add credits' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Record the redemption
    await supabaseAdmin.from('redeemed_codes').insert({
      user_id: user.id,
      bonus_code_id: bonusCode.id,
      credits_awarded: bonusCode.credits,
    });

    // Update the code usage count
    await supabaseAdmin
      .from('bonus_codes')
      .update({ uses: (bonusCode.uses || 0) + 1 })
      .eq('id', bonusCode.id);

    console.log('Code redeemed successfully, added', bonusCode.credits, 'credits');

    return new Response(JSON.stringify({ 
      success: true, 
      credits: bonusCode.credits,
      message: `Successfully added ${bonusCode.credits} bonus credits!`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
