-- Create secure bonus code redemption function with atomic transaction
CREATE OR REPLACE FUNCTION public.redeem_bonus_code(
  p_user_id UUID,
  p_code TEXT
) RETURNS jsonb AS $$
DECLARE
  v_code_data bonus_codes%ROWTYPE;
  v_expiry_check BOOLEAN;
BEGIN
  -- Lock the bonus code row for update to prevent race conditions
  SELECT * INTO v_code_data FROM bonus_codes
  WHERE code = UPPER(p_code) AND is_active = true
  FOR UPDATE;
  
  -- Validate code exists
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or inactive code');
  END IF;
  
  -- Check expiry
  IF v_code_data.expires_at IS NOT NULL AND v_code_data.expires_at < now() THEN
    RETURN jsonb_build_object('success', false, 'error', 'This code has expired');
  END IF;
  
  -- Check usage limit
  IF v_code_data.uses >= v_code_data.max_uses THEN
    RETURN jsonb_build_object('success', false, 'error', 'This code has reached its maximum usage limit');
  END IF;
  
  -- Check if user already redeemed this code
  IF EXISTS (SELECT 1 FROM redeemed_codes 
             WHERE user_id = p_user_id 
             AND bonus_code_id = v_code_data.id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'You have already used this code');
  END IF;
  
  -- Award credits atomically using addition
  UPDATE profiles 
  SET bonus_credits = bonus_credits + v_code_data.credits
  WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'User profile not found');
  END IF;
  
  -- Record redemption
  INSERT INTO redeemed_codes (user_id, bonus_code_id, credits_awarded)
  VALUES (p_user_id, v_code_data.id, v_code_data.credits);
  
  -- Increment usage counter
  UPDATE bonus_codes 
  SET uses = uses + 1
  WHERE id = v_code_data.id;
  
  RETURN jsonb_build_object(
    'success', true,
    'credits_awarded', v_code_data.credits,
    'message', 'Code redeemed successfully!'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop the public SELECT policy on bonus_codes (security risk)
DROP POLICY IF EXISTS "Anyone can view active bonus codes" ON bonus_codes;

-- Remove user write access to subscriptions table (prevent subscription fraud)
DROP POLICY IF EXISTS "Users can insert their own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can update their own subscriptions" ON subscriptions;