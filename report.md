# React + Supabase + Netlify Flow Maintenance Report

scope: entry form → Supabase OTP/email verification → redirect/success flow
run_at: UTC

1) Workspace snapshot
- Framework: React 18 + Vite 5 (vite, @vitejs/plugin-react) / TypeScript 5
- Functions: Netlify Functions (netlify/functions)
- Package manager: npm (no lockfile detected)
- Git/Node/npm versions: execution blocked by environment ACL; not collected

2) Install deps
- Skipped (ACL blocks npm install). Code analysis proceeded without install.

3) Static analysis
- TypeScript: config present (tsconfig.json). Build uses tsc -b + vite. NoEmit run was skipped (ACL).
- ESLint/Prettier: no config detected; recommend adding.

4) Entry→Submit→Method→Redirect mapping
- UI path: src/sections/Entry.tsx → navigate('/entry') → src/pages/EntryFormPage.tsx
- Submit: POST /.netlify/functions/post-entry with Authorization: Bearer <local_session>
- Server: netlify/functions/post-entry/index.js authenticates via supabase.auth.getUser(token), inserts into entries + ledger_entries
- Success UX: in-page success state (no Netlify redirect to a dedicated success page)

5) Supabase auth/email setup
- send-otp: supabase.auth.signInWithOtp({ email, options: { shouldCreateUser } })
- verify-otp: supabase.auth.verifyOtp({ email, token, type: 'email' | 'signup' }) → returns session
- Frontend: src/sections/Login.tsx saves session to localStorage('local_session') and redirects to /dashboard
- emailRedirectTo: not used (OTP code flow). If magic-link redirect is desired, configure emailRedirectTo in send-otp and handle provider callback.

6) Netlify redirects
- netlify.toml: /* → /index.html (200) for SPA. OK. No _redirects file present.

7) Env usage / secrets audit
- Server-side supabase client: netlify/functions/utils/supabase.js reads SUPABASE_URL and ANON/ANON(VITE)/SERVICE_ROLE. No hardcoded keys in repo.
- Risk: SERVICE_ROLE_KEY is acceptable in server functions, but must not be exposed to the browser. Ensure only server reads it; do not inject into client bundle.

8) Simulated submission
- Execution of functions blocked by ACL. Static trace shows: without Authorization header → 401; with valid session → proceeds; invalid referral → 400.

9) OTP/email verification redirect
- Current flow is OTP code + JSON session; frontend handles redirect to /dashboard. No email-link redirect path.

10) Supabase DB (users/verified/RLS)
- Tables referenced: entries, ledger_entries. No direct users table access in code.
- RLS/policies not visible in repo; recommend verifying policies in Supabase Dashboard. Consider MCPs (Neon/Prisma Postgres) for DB reviews.

11) Security scans
- npm audit not executed (ACL). Recommend CI to run `npm audit --production`.

12) Error handling/logging
- Good: send-otp handles rate limits and misconfig templates; verify-otp returns useful errors; post-entry validates inputs and referral code; frontend shows field/server errors.

13) Performance & React best practices
- PageTransition lightweight; Confetti now layered above modal with non-interactive canvas; Avoids pointer events; No unnecessary re-renders detected in changed areas.

14) Tests
- Netlify vitest tests exist for OTP flows. Running blocked (ACL). Recommend enabling CI to run `npm test` in netlify/.

15) Deliverables
- report.json: structured summary (see report.json)
- patch diffs: see patch.scan.diff
- logs/: created with notes where ACL blocked execution

Severity summary
- Critical: none for hardcoded secrets (none found). Ensure SERVICE_ROLE never exposed client-side.
- High: N/A. Flow operates via OTP JSON + client redirect; no Netlify success redirect implemented.
- Medium: Prior entry form auth used wrong token; fixed to use local_session and payload mapping; recommend adding ESLint/Prettier to catch mismatches.
- Low: Add CI for audit/tests; optional success page + redirect param.

Actioned fixes
- Confetti z-index so modal shows above page and confetti above modal.
- Entry form uses Bearer local_session, auto-fills readOnly email from session, maps payload to server fields, adds required consent checkboxes.

Recommendations
- Add ESLint + Prettier; add CI (build, tsc --noEmit, vitest, audit).
- If you prefer email-link magic flow, add emailRedirectTo and a /auth/callback route.
- Consider MCPs for DB checks:
  - Connect to Neon, Prisma Postgres via [Open MCP popover](#open-mcp-popover) to inspect schema/policies.
  - For error monitoring, consider [Connect to Sentry](#open-mcp-popover).
