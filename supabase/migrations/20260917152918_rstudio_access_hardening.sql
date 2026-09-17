-- Least-privilege grants for a fresh deployment.
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
GRANT USAGE ON SCHEMA public TO authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT SELECT, INSERT, DELETE ON public.user_roles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bonus_codes TO authenticated;
GRANT SELECT ON public.api_usage_logs TO authenticated;
REVOKE INSERT, UPDATE ON public.api_tokens FROM authenticated;
GRANT SELECT, DELETE ON public.api_tokens TO authenticated;
GRANT INSERT (user_id, name, token_hash, token_prefix, permissions, is_active, expires_at) ON public.api_tokens TO authenticated;
GRANT UPDATE (name, permissions, is_active, expires_at) ON public.api_tokens TO authenticated;
REVOKE ALL ON FUNCTION public.redeem_bonus_code(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.validate_api_token(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.log_api_usage(uuid, uuid, text, text, integer, integer, integer, integer, text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_bonus_code(uuid, text), public.validate_api_token(text), public.log_api_usage(uuid, uuid, text, text, integer, integer, integer, integer, text, text, text) TO service_role;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.handle_new_user(), public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
-- Qualify table columns to avoid collisions with RETURNS TABLE output variables.
CREATE OR REPLACE FUNCTION public.validate_api_token(p_token_hash TEXT)
RETURNS TABLE (user_id UUID, token_id UUID, permissions TEXT[], rate_limit_per_minute INTEGER, rate_limit_per_day INTEGER, requests_today INTEGER) AS $$
DECLARE v_token public.api_tokens%ROWTYPE;
BEGIN
 SELECT t.* INTO v_token FROM public.api_tokens t WHERE t.token_hash = p_token_hash AND t.is_active = true AND (t.expires_at IS NULL OR t.expires_at > now()) FOR UPDATE;
 IF NOT FOUND THEN RETURN; END IF;
 IF v_token.requests_today_reset_at < CURRENT_DATE THEN
  UPDATE public.api_tokens t SET requests_today = 0, requests_today_reset_at = CURRENT_DATE WHERE t.id = v_token.id;
  v_token.requests_today := 0;
 END IF;
 UPDATE public.api_tokens t SET last_used_at = now(), requests_today = t.requests_today + 1, updated_at = now() WHERE t.id = v_token.id;
 RETURN QUERY SELECT v_token.user_id, v_token.id, v_token.permissions, v_token.rate_limit_per_minute, v_token.rate_limit_per_day, v_token.requests_today + 1;
END; $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
CREATE INDEX resumes_user_id_idx ON public.resumes(user_id);
CREATE INDEX templates_user_id_idx ON public.templates(user_id);
