-- Create subscription plan enum
CREATE TYPE public.subscription_plan AS ENUM ('free', 'basic', 'pro');

-- Create payment status enum
CREATE TYPE public.payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');

-- Add credits and plan to profiles
ALTER TABLE public.profiles 
ADD COLUMN credits INTEGER NOT NULL DEFAULT 10,
ADD COLUMN bonus_credits INTEGER NOT NULL DEFAULT 0,
ADD COLUMN plan subscription_plan NOT NULL DEFAULT 'free',
ADD COLUMN plan_credits_used INTEGER NOT NULL DEFAULT 0,
ADD COLUMN credits_reset_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create subscriptions table
CREATE TABLE public.subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan subscription_plan NOT NULL DEFAULT 'free',
  status TEXT NOT NULL DEFAULT 'active',
  razorpay_subscription_id TEXT,
  razorpay_customer_id TEXT,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create payments table
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  razorpay_payment_id TEXT,
  razorpay_order_id TEXT,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  status payment_status NOT NULL DEFAULT 'pending',
  plan subscription_plan,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bonus codes table
CREATE TABLE public.bonus_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  credits INTEGER NOT NULL,
  max_uses INTEGER DEFAULT 1,
  uses INTEGER DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create redeemed codes table to track who used what
CREATE TABLE public.redeemed_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bonus_code_id UUID NOT NULL REFERENCES public.bonus_codes(id) ON DELETE CASCADE,
  credits_awarded INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, bonus_code_id)
);

-- Enable RLS on all tables
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bonus_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.redeemed_codes ENABLE ROW LEVEL SECURITY;

-- Subscriptions policies
CREATE POLICY "Users can view their own subscriptions"
ON public.subscriptions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscriptions"
ON public.subscriptions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions"
ON public.subscriptions FOR UPDATE
USING (auth.uid() = user_id);

-- Payments policies
CREATE POLICY "Users can view their own payments"
ON public.payments FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payments"
ON public.payments FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Bonus codes policies (anyone can read active codes)
CREATE POLICY "Anyone can view active bonus codes"
ON public.bonus_codes FOR SELECT
USING (is_active = true);

-- Redeemed codes policies
CREATE POLICY "Users can view their own redeemed codes"
ON public.redeemed_codes FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own redeemed codes"
ON public.redeemed_codes FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create trigger for subscriptions updated_at
CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to reset credits monthly (called by cron or on login)
CREATE OR REPLACE FUNCTION public.reset_credits_if_needed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  plan_credits INTEGER;
BEGIN
  -- Check if credits need to be reset (more than 30 days since last reset)
  IF NEW.credits_reset_at IS NULL OR NEW.credits_reset_at < (now() - INTERVAL '30 days') THEN
    -- Determine credits based on plan
    CASE NEW.plan
      WHEN 'free' THEN plan_credits := 10;
      WHEN 'basic' THEN plan_credits := 100;
      WHEN 'pro' THEN plan_credits := 300;
      ELSE plan_credits := 10;
    END CASE;
    
    NEW.credits := plan_credits;
    NEW.plan_credits_used := 0;
    NEW.credits_reset_at := now();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for credit reset check on profile update
CREATE TRIGGER check_credit_reset
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.reset_credits_if_needed();