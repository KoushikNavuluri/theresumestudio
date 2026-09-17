# rstudio deployment

Target organization: rstudio app. Project: aeapocnycabxfckllbsw.
The frontend uses the project's public publishable key from `.env`; this key is not a server secret.

## AI provider

All five AI functions use `gemini-3.5-flash-lite` directly at Google's `https://generativelanguage.googleapis.com/v1beta/openai/chat/completions` endpoint. `openai` in this Google URL names its wire-format compatibility layer, not a second provider. There is no Lovable AI or alternate-model fallback. Streaming keeps the existing `choices[].delta.content` contract.

Set `GEMINI_API_KEY` in Supabase Dashboard > Edge Functions > Secrets before testing AI. Rotate the key previously shared in chat. Never put it in a `VITE_` variable, this repository, or a committed `.env` file. The deployment connection used for this migration cannot set Edge Function secrets. `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are supplied by Supabase.

## Database reconstruction

`20260101000000_restore_missing_schema.sql` fills a gap in the original migration history before the January 24 migrations reference the missing objects. It reconstructs subscriptions, payments, bonus_codes, redeemed_codes, resume_versions, user_profiles, subscription/payment enums, and profile credit columns from `src/integrations/supabase/types.ts` and application queries. It is not an exact export of the old database. Defaults are inferred: free plan, 10 plan credits, zero bonus credits, and a reset timestamp one month after creation. No automatic recurring credit-reset job or payment provider integration is invented.

`20260917152918_rstudio_access_hardening.sql` supplies explicit grants, restricts billing/credit changes and redemption/token/log RPCs to server code, prevents clients from changing API quotas, and fixes a column-name ambiguity in API-token validation. All application tables have RLS. `has_role` intentionally remains callable by signed-in users because admin policies depend on it; Supabase's advisor reports this intentional SECURITY DEFINER access.

This is a fresh database. Existing users, passwords, resumes, subscriptions, storage files, and payment history have NOT been copied. No admin role has been assigned. Auth provider configuration, production Site URL/redirect allowlists, email delivery settings, and any payment credentials still need configuring for the actual frontend domain.

## Release checklist

1. Set the rotated `GEMINI_API_KEY` secret in the target project.
2. Check out `feat/gemini-rstudio`, then link the Supabase CLI to `aeapocnycabxfckllbsw`. Review `supabase migration list`; do not replay already-applied migrations.
3. Deploy all functions with the checked-in configuration. Existing `verify_jwt = false` settings are preserved; optimization, redemption and admin handlers validate Supabase users, and public-api validates application API keys. Analysis, titles, chat and conversion preserve their existing public access behavior. Add authentication/rate limits before exposing a funded AI key broadly.
4. Configure Auth settings and sign up a new test user. Verify the signup profile, owner-only resume/template/profile access, and promo-code authorization.
5. Build and deploy the frontend from this branch, overriding any hosting environment variables that still point to the old project. Existing main and the currently hosted frontend are not changed by this branch.
6. Smoke-test title generation, ATS analysis, optimization, streaming chat, PDF conversion, API-key routes and credit deduction. A successful function deployment alone does not verify live Gemini credentials, model access, output quality or end-to-end browser behavior.

The two non-AI PDF compilation services are intentionally unchanged: Gemini generates LaTeX but does not replace a LaTeX-to-PDF compiler.
