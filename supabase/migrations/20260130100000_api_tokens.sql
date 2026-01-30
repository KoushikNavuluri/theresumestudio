-- API Tokens table for public API access
CREATE TABLE public.api_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Default API Key',
  token_hash TEXT NOT NULL UNIQUE, -- SHA-256 hash of the token
  token_prefix TEXT NOT NULL, -- First 8 chars for display (rs_xxxxxxxx)
  permissions TEXT[] DEFAULT ARRAY['optimize', 'analyze', 'convert']::TEXT[],
  rate_limit_per_minute INTEGER DEFAULT 10,
  rate_limit_per_day INTEGER DEFAULT 100,
  last_used_at TIMESTAMP WITH TIME ZONE,
  requests_today INTEGER DEFAULT 0,
  requests_today_reset_at DATE DEFAULT CURRENT_DATE,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- API usage logs for analytics
CREATE TABLE public.api_usage_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token_id UUID NOT NULL REFERENCES public.api_tokens(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL DEFAULT 'POST',
  status_code INTEGER NOT NULL,
  request_size_bytes INTEGER,
  response_size_bytes INTEGER,
  latency_ms INTEGER,
  error_message TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for fast token lookups
CREATE INDEX idx_api_tokens_token_hash ON public.api_tokens(token_hash);
CREATE INDEX idx_api_tokens_user_id ON public.api_tokens(user_id);
CREATE INDEX idx_api_usage_logs_token_id ON public.api_usage_logs(token_id);
CREATE INDEX idx_api_usage_logs_user_id ON public.api_usage_logs(user_id);
CREATE INDEX idx_api_usage_logs_created_at ON public.api_usage_logs(created_at);

-- Enable RLS
ALTER TABLE public.api_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_usage_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for api_tokens
CREATE POLICY "Users can view their own API tokens"
  ON public.api_tokens FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own API tokens"
  ON public.api_tokens FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own API tokens"
  ON public.api_tokens FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own API tokens"
  ON public.api_tokens FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for api_usage_logs
CREATE POLICY "Users can view their own API usage logs"
  ON public.api_usage_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Function to validate API token and return user info
CREATE OR REPLACE FUNCTION public.validate_api_token(p_token_hash TEXT)
RETURNS TABLE (
  user_id UUID,
  token_id UUID,
  permissions TEXT[],
  rate_limit_per_minute INTEGER,
  rate_limit_per_day INTEGER,
  requests_today INTEGER
) AS $$
DECLARE
  v_token api_tokens%ROWTYPE;
BEGIN
  -- Get token record
  SELECT * INTO v_token FROM api_tokens t
  WHERE t.token_hash = p_token_hash
  AND t.is_active = true
  AND (t.expires_at IS NULL OR t.expires_at > now())
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Reset daily counter if needed
  IF v_token.requests_today_reset_at < CURRENT_DATE THEN
    UPDATE api_tokens SET 
      requests_today = 0,
      requests_today_reset_at = CURRENT_DATE
    WHERE id = v_token.id;
    v_token.requests_today := 0;
  END IF;
  
  -- Update last used timestamp
  UPDATE api_tokens SET 
    last_used_at = now(),
    requests_today = requests_today + 1,
    updated_at = now()
  WHERE id = v_token.id;
  
  RETURN QUERY SELECT 
    v_token.user_id,
    v_token.id,
    v_token.permissions,
    v_token.rate_limit_per_minute,
    v_token.rate_limit_per_day,
    v_token.requests_today + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to log API usage
CREATE OR REPLACE FUNCTION public.log_api_usage(
  p_token_id UUID,
  p_user_id UUID,
  p_endpoint TEXT,
  p_method TEXT,
  p_status_code INTEGER,
  p_request_size INTEGER DEFAULT NULL,
  p_response_size INTEGER DEFAULT NULL,
  p_latency_ms INTEGER DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
) RETURNS void AS $$
BEGIN
  INSERT INTO api_usage_logs (
    token_id, user_id, endpoint, method, status_code,
    request_size_bytes, response_size_bytes, latency_ms,
    error_message, ip_address, user_agent
  ) VALUES (
    p_token_id, p_user_id, p_endpoint, p_method, p_status_code,
    p_request_size, p_response_size, p_latency_ms,
    p_error_message, p_ip_address, p_user_agent
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for updated_at
CREATE TRIGGER update_api_tokens_updated_at
  BEFORE UPDATE ON public.api_tokens
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
