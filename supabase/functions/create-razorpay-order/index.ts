import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PLAN_PRICES: Record<string, { amount: number; credits: number }> = {
  basic: { amount: 9900, credits: 100 },  // ₹99
  pro: { amount: 29900, credits: 300 },   // ₹299
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

    const { plan } = await req.json();
    console.log('Creating order for plan:', plan, 'user:', user.id);

    if (!plan || !PLAN_PRICES[plan]) {
      return new Response(JSON.stringify({ error: 'Invalid plan' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const keyId = Deno.env.get('RAZORPAY_KEY_ID');
    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET');

    if (!keyId || !keySecret) {
      console.error('Razorpay keys not configured');
      return new Response(JSON.stringify({ error: 'Payment gateway not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create Razorpay order
    const orderResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + btoa(`${keyId}:${keySecret}`),
      },
      body: JSON.stringify({
        amount: PLAN_PRICES[plan].amount,
        currency: 'INR',
        receipt: `rcpt_${user.id.slice(-8)}_${Date.now()}`,
        notes: {
          user_id: user.id,
          plan: plan,
        },
      }),
    });

    if (!orderResponse.ok) {
      const errorText = await orderResponse.text();
      console.error('Razorpay API error:', errorText);
      return new Response(JSON.stringify({ error: 'Failed to create order' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const order = await orderResponse.json();
    console.log('Order created:', order.id);

    // Store payment record
    const { error: paymentError } = await supabaseClient
      .from('payments')
      .insert({
        user_id: user.id,
        amount: PLAN_PRICES[plan].amount,
        status: 'pending',
        razorpay_order_id: order.id,
        plan: plan,
      });

    if (paymentError) {
      console.error('Error storing payment:', paymentError);
    }

    return new Response(JSON.stringify({
      orderId: order.id,
      amount: PLAN_PRICES[plan].amount,
      currency: 'INR',
      keyId: keyId,
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
