# rstudio migration verification

Completed on 2026-09-17 against project `aeapocnycabxfckllbsw`.

## Deployed

- New branch `feat/gemini-rstudio` created from main commit `55ddabc3c08902b587d1a94b4b0b3f47a29a1fb7`. The repository's default branch is different; it was not substituted for main.
- Eight migrations applied, with remote history versions aligned to the eight checked-in migration filenames.
- Twelve application tables created, all with RLS enabled and policies present.
- Eight Edge Functions deployed successfully: analyze-resume, generate-title, optimize-resume, resume-chat, public-api, convert-latex, redeem-bonus-code, admin-promo-codes.
- Deployments bundle immutable source from GitHub commit `d9065fdd646a3c3485c6f29313895d2238656cc2` via pinned Deno URL imports. They do not follow a moving branch. Normal Supabase CLI redeployment can use the local source files directly.
- All five AI source files use Google's direct Gemini endpoint and `gemini-3.5-flash-lite`; secrets are read from `GEMINI_API_KEY` only.
- Frontend chat headers updated for modern Supabase publishable keys: `apikey` identifies the project and a signed-in user's JWT, when present, goes in `Authorization`.

## Database checks passed

Transaction-scoped tests verified signup profile creation and free-plan defaults; owner-only resume/profile visibility; inability for clients to update bonus credits or insert subscriptions; server-only redemption RPC access; and no automatic admin role assignment. Separate rollback-only tests passed API-token validation, incrementing request counters, usage logging, bonus-credit awards, and rejection of duplicate promo-code redemption. Synthetic users and records were rolled back, not retained.

Supabase's security advisor reports one intentional warning: signed-in users may execute the SECURITY DEFINER `has_role` predicate needed by admin RLS policies. It does not grant roles. See [advisor explanation](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable).

## Not verified or not done

- Gemini credentials, model access, actual generation, streaming over the network, and PDF compilation have not been exercised end to end. The Gemini secret still needs to be set manually using a rotated key.
- No full frontend build or browser test was run.
- No existing users or application records were migrated from the old project.
- No frontend release, merge to main, Auth production-domain configuration, payment setup, or admin assignment was performed.
- Existing public access for chat, titles, analysis and PDF conversion is preserved. Protect these endpoints with authentication/rate limiting before broadly exposing a funded Gemini key.

See [RSTUDIO_SETUP.md](RSTUDIO_SETUP.md) for the release checklist and reconstruction assumptions.
