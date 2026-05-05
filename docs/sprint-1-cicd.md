# Sprint 1 CI/CD Write-up

## Part 1: Working CI Workflow

**Link to merged PR with passing CI:** https://github.com/CSEN-SCU/csen-174-s26-team-project-smartshop/pull/23

### Secrets

The team uses one secret in CI: `GEMINI_API_KEY`, which the `/api/chat` route needs to call the Gemini model. It is stored in the repo under **Settings → Secrets and variables → Actions** as `GEMINI_API_KEY` and referenced in the workflow as `${{ secrets.GEMINI_API_KEY }}`. The secret is injected only into the `npm test` step so it is never written to a file, never appears in the workflow YAML itself, and never shows up in the commit history. The same key is also added as an environment variable in the deployment platform (Vercel) so the production app can call Gemini at runtime. No secrets appear in code or in `.env` files that are committed to the repo.

### How the workflow runs

The workflow lives at `.github/workflows/ci.yml`. It triggers on every `pull_request` and `push` to `main`. It checks out the repo, sets up Node 20, runs `npm install` to install dependencies, then runs `npm test` inside `prototypes/divya/`. The database layer tests (`db.test.ts`) run and pass — those are the 9 unit tests covering price lookups, chat history, and the two new query functions flipped GREEN in W5. The `/api/chat` integration tests and the AI behavior tests are marked `test.skip` with Sprint 2 reason strings so they are counted as deferred, not failing. CI passes when every unskipped test is green.

---

## Part 2: Live Deployment

**Live URL:** https://csen-174-s26-team-project-smartshop.vercel.app

**Screenshot:** _(see Vercel dashboard screenshot — Status: Ready, Build Logs: ✅ 1m 11s)_

### Deployment platform

The team deployed to **Vercel** because it has native support for Next.js (auto-detects the framework, handles `next build`, and routes API calls correctly without extra config). The free Hobby tier is sufficient for a class project. The main gotcha on the first deploy was that Vercel defaulted to Node.js 24 and `better-sqlite3` (a native module) failed to compile against the newer V8 headers — the fix was to change the project Node.js version to 20.x in **Project Settings → Build and Deployment**. The `GEMINI_API_KEY` secret was added in Vercel's **Project → Settings → Environment Variables** and is never in the codebase.
