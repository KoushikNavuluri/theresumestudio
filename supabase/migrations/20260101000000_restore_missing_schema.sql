-- Reconstructed from the application's generated database types, not an export.
-- Defaults inferred from the app: free plan, 10 credits, no bonus credits.
CREATE TYPE public.subscription_plan AS ENUM ('free', 'basic', 'pro');
CREATE TYPE public.payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
ALTER TABLE public.profiles
  ADD COLUMN plan public.subscription_plan NOT NULL DEFAULT 'free',
  ADD COLUMN credits integer NOT NULL DEFAULT 10 CHECK (credits >= 0),
  ADD COLUMN bonus_credits integer NOT NULL DEFAULT 0 CHECK (bonus_credits >= 0),
  ADD COLUMN plan_credits_used integer NOT NULL DEFAULT 0 CHECK (plan_credits_used >= 0),
  ADD COLUMN credits_reset_at timestamptz DEFAULT (now() + interval '1 month');
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan public.subscription_plan NOT NULL DEFAULT 'free',
  status text NOT NULL DEFAULT 'active',
  razorpay_customer_id text, razorpay_subscription_id text,
  current_period_start timestamptz, current_period_end timestamptz,
  cancel_at_period_end boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  amount numeric NOT NULL CHECK (amount >= 0), currency text NOT NULL DEFAULT 'INR',
  plan public.subscription_plan,
  status public.payment_status NOT NULL DEFAULT 'pending',
  razorpay_order_id text, razorpay_payment_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.bonus_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), code text NOT NULL UNIQUE,
  credits integer NOT NULL CHECK (credits > 0),
  max_uses integer DEFAULT 1 CHECK (max_uses > 0), uses integer DEFAULT 0 CHECK (uses >= 0),
  is_active boolean DEFAULT true, expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.redeemed_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bonus_code_id uuid NOT NULL REFERENCES public.bonus_codes(id) ON DELETE CASCADE,
  credits_awarded integer NOT NULL CHECK (credits_awarded > 0),
  created_at timestamptz NOT NULL DEFAULT now(), UNIQUE (user_id, bonus_code_id)
);
CREATE TABLE public.resume_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_id uuid NOT NULL REFERENCES public.resumes(id) ON DELETE CASCADE,
  version_number integer NOT NULL DEFAULT 1 CHECK (version_number > 0),
  latex_code text NOT NULL, job_description text,
  created_at timestamptz NOT NULL DEFAULT now(), UNIQUE (resume_id, version_number)
);
CREATE TABLE public.user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text, email text, phone text, address text, summary text,
  github_url text, linkedin_url text, portfolio_url text,
  skills text[], certifications jsonb, education jsonb, work_history jsonb,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bonus_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.redeemed_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own subscriptions" ON public.subscriptions FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);
CREATE POLICY "Users can view their own payments" ON public.payments FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);
CREATE POLICY "Users can view their own redemptions" ON public.redeemed_codes FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);
CREATE POLICY "Users manage their own resume versions" ON public.resume_versions FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.resumes r WHERE r.id = resume_id AND r.user_id = (select auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.resumes r WHERE r.id = resume_id AND r.user_id = (select auth.uid())));
CREATE POLICY "Users manage their own personal profile" ON public.user_profiles FOR ALL TO authenticated
  USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX subscriptions_user_id_idx ON public.subscriptions(user_id);
CREATE INDEX payments_user_id_idx ON public.payments(user_id);
CREATE INDEX payments_subscription_id_idx ON public.payments(subscription_id);
CREATE INDEX redeemed_codes_bonus_code_id_idx ON public.redeemed_codes(bonus_code_id);
-- Billing, credits and redemption records are written only by trusted server code.
REVOKE ALL ON public.subscriptions, public.payments, public.bonus_codes, public.redeemed_codes, public.resume_versions, public.user_profiles FROM anon, authenticated;
GRANT SELECT ON public.subscriptions, public.payments, public.redeemed_codes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.resume_versions, public.user_profiles TO authenticated;
GRANT ALL ON public.subscriptions, public.payments, public.bonus_codes, public.redeemed_codes, public.resume_versions, public.user_profiles TO service_role;
REVOKE INSERT, UPDATE ON public.profiles FROM anon, authenticated;
GRANT UPDATE (full_name, email) ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO authenticated;
GRANT ALL ON public.profiles, public.resumes, public.templates TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.resumes, public.templates TO authenticated;
