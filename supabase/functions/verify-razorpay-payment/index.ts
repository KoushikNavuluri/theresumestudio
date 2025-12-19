import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PLAN_CREDITS: Record<string, number> = {
  basic: 100,
  pro: 300,
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

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan } = await req.json();
    console.log('Verifying payment:', { razorpay_order_id, razorpay_payment_id, plan });

    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET');
    if (!keySecret) {
      return new Response(JSON.stringify({ error: 'Payment gateway not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify signature using Web Crypto API
    const encoder = new TextEncoder();
    const data = encoder.encode(`${razorpay_order_id}|${razorpay_payment_id}`);
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(keySecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const signatureBuffer = await crypto.subtle.sign('HMAC', key, data);
    const generatedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    if (generatedSignature !== razorpay_signature) {
      console.error('Signature mismatch');
      return new Response(JSON.stringify({ error: 'Payment verification failed' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Signature verified successfully');

    // Use service role for updating data
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Update payment status
    const { error: paymentUpdateError } = await supabaseAdmin
      .from('payments')
      .update({
        status: 'completed',
        razorpay_payment_id: razorpay_payment_id,
      })
      .eq('razorpay_order_id', razorpay_order_id);

    if (paymentUpdateError) {
      console.error('Error updating payment:', paymentUpdateError);
    }

    // Update user profile with new plan and credits
    const credits = PLAN_CREDITS[plan] || 100;
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        plan: plan,
        credits: credits,
        plan_credits_used: 0,
        credits_reset_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    if (profileError) {
      console.error('Error updating profile:', profileError);
      return new Response(JSON.stringify({ error: 'Failed to update subscription' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create or update subscription record
    const periodStart = new Date();
    const periodEnd = new Date();
    periodEnd.setDate(periodEnd.getDate() + 30);

    const { data: existingSub } = await supabaseAdmin
      .from('subscriptions')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (existingSub) {
      await supabaseAdmin
        .from('subscriptions')
        .update({
          plan: plan,
          status: 'active',
          current_period_start: periodStart.toISOString(),
          current_period_end: periodEnd.toISOString(),
        })
        .eq('user_id', user.id);
    } else {
      await supabaseAdmin
        .from('subscriptions')
        .insert({
          user_id: user.id,
          plan: plan,
          status: 'active',
          current_period_start: periodStart.toISOString(),
          current_period_end: periodEnd.toISOString(),
        });
    }

    console.log('Subscription updated successfully for user:', user.id);

    return new Response(JSON.stringify({ success: true }), {
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
