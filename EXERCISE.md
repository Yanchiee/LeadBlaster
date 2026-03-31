# Security Audit Exercise — LeadBlaster Pro

## The Scenario

You just got hired as a freelance developer. The founder of "LeadBlaster Pro" vibe-coded this entire lead-generation platform in one weekend using AI. They're about to launch it publicly and want you to review it first.

Your job: **Find every security vulnerability, explain why it's dangerous, and fix it.**

---

## Your Mission

### Step 1: Read the Code (10 min)
Open each file and read through it manually BEFORE using any tools:
- `public/app.js` — The main application code
- `public/index.html` — The frontend
- `src/supabase-schema.sql` — The database schema
- `.env.exposed` — The environment file (pretend this is `.env`)
- Check: Is there a `.gitignore` file?

Write down every vulnerability you spot. Try to find at least 10.

### Step 2: Use Claude Code to Audit (10 min)
Open a terminal in this project folder and ask Claude Code:

```
Audit this entire project for security vulnerabilities. Check for exposed API keys, missing .gitignore, database security issues, client-side security problems, and any other risks. List every issue with severity (Critical / High / Medium / Low).
```

Compare Claude Code's findings with your own list. Did it catch everything? Did it find things you missed?

### Step 3: Fix the Vulnerabilities (20 min)
Using Claude Code, fix the vulnerabilities one by one. For each fix, understand WHY it's a fix — don't just blindly accept the AI's changes.

Priority fixes:
1. Create a `.gitignore` that excludes `.env` and other sensitive files
2. Remove ALL API keys from `app.js` (move to backend/environment variables)
3. Remove the service_role key from the frontend entirely
4. Enable Row Level Security on all Supabase tables
5. Move the OpenAI API call to a backend proxy
6. Add server-side role/plan validation (not client-controlled)
7. Add input validation on lead data
8. Add a confirmation step before destructive admin actions
9. Fix the CSV export to escape special characters
10. Add rate limiting concepts

### Step 4: Verify Your Fixes (5 min)
Ask Claude Code:
```
Re-audit this project. Are there any remaining security vulnerabilities?
```

---

## Vulnerability Cheat Sheet (Don't peek until Step 2!)

<details>
<summary>Click to reveal all 15 vulnerabilities</summary>

| # | Vulnerability | File | Severity |
|---|---|---|---|
| 1 | Supabase anon key hardcoded in frontend JS | app.js:10 | High |
| 2 | OpenAI API key hardcoded in frontend JS | app.js:14 | Critical |
| 3 | Stripe SECRET key hardcoded in frontend JS | app.js:18 | Critical |
| 4 | Supabase service_role key in frontend (bypasses all RLS) | app.js:23 | Critical |
| 5 | User role/plan set on client side (paywall bypass) | app.js:55 | Critical |
| 6 | Admin check done on client side only (CSS hiding) | app.js:73 | High |
| 7 | No input validation on lead data | app.js:93 | Medium |
| 8 | No Row Level Security — any user reads ALL leads | app.js:107 | Critical |
| 9 | No ownership check on lead deletion | app.js:120 | High |
| 10 | Direct OpenAI API call from browser (key exposed) | app.js:128 | Critical |
| 11 | No rate limiting on data export | app.js:147 | Medium |
| 12 | CSV injection — unescaped data in export | app.js:153 | Medium |
| 13 | Admin uses service_role client in browser (God Mode) | app.js:164 | Critical |
| 14 | Mass deletion with no confirmation or audit trail | app.js:174 | High |
| 15 | No .gitignore — .env with all secrets will be committed | project root | Critical |

**Bonus issues in the SQL schema:**
- RLS intentionally not enabled on any table
- API keys stored in plaintext in api_logs table
- No policies restricting who can read/write what

</details>

---

## Real-World Connection

Every vulnerability in this project has caused REAL damage to REAL companies:

- **Vulnerabilities 1-4, 10** → Same as the API key disaster that charged 175 customers $500 each
- **Vulnerability 5** → Same as Enrichlead — entire startup shut down because paywall was client-side
- **Vulnerability 8** → Same as Moltbook — 1.5 million API keys exposed because no RLS
- **Vulnerability 15** → 29 million secrets were exposed on GitHub in 2025 alone

These aren't theoretical. They happen every week to vibe-coded apps.
