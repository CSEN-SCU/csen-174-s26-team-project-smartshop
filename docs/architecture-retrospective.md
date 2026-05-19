# Architecture Retrospective — SmartShop

**Repo:** https://github.com/CSEN-SCU/csen-174-s26-team-project-smartshop
**Date:** May 19, 2026
**Team:** Divya Bengali, Shreeya Koritala, Caroline Tapia, Terry Chen

---

## C4 Container Diagram

```mermaid
C4Container
  title SmartShop — Container Diagram (current state, main branch)

  Person(user, "Browser User", "Budget-conscious grocery shopper comparing prices across nearby stores")

  System_Boundary(smartshop, "SmartShop — prototypes/") {

    Container(divya, "Divya's Next.js App", "Next.js 14 / TypeScript", "Chat UI for grocery price queries. Crisis detection gate before Gemini call. Deployed on Vercel.")
    Container(caroline, "Caroline's Express App", "Node.js / Express / JS", "Finds cheaper product alternatives via AI. XSS-fixed renderAlternatives() uses textContent.")
    Container(shreeya, "Shreeya's Prototype", "Stack not confirmed", "prototypes/shreeya/ — AI API + DB per assignment requirements.")
    Container(terry, "Terry's Prototype", "Stack not confirmed", "prototypes/terry/ — AI API + DB per assignment requirements.")

    ContainerDb(sqlite, "SQLite Database", "better-sqlite3", "Products, stores, prices, and chat history. Used by Divya's app only.")
  }

  System_Ext(gemini, "Google Gemini API", "LLM — grocery chat responses (GEMINI_API_KEY)")
  System_Ext(openai, "OpenAI API", "LLM — product alternative suggestions (OPENAI_API_KEY)")
  System_Ext(vercel, "Vercel", "Hosts Divya's Next.js app. GEMINI_API_KEY set in env vars.")
  System_Ext(gha, "GitHub Actions", "CI on PR + push to main. Runs Divya's db unit tests only.")

  Rel(user, divya, "Chat message", "HTTPS")
  Rel(user, caroline, "POST /findAlternatives", "HTTPS")
  Rel(divya, gemini, "Chat completion — after crisis gate", "HTTPS / GEMINI_API_KEY")
  Rel(divya, sqlite, "Price lookups + chat history writes", "better-sqlite3")
  Rel(caroline, openai, "Chat completion", "HTTPS / OPENAI_API_KEY")
  Rel(vercel, divya, "Build + deploy on push to main", "")
  Rel(gha, divya, "npm test in prototypes/divya/", "")
```

---

## External Services & Call Sites

| Service | Key / Auth | Call site |
|---------|-----------|-----------|
| Google Gemini API | `GEMINI_API_KEY` | `prototypes/divya/src/app/api/chat/route.ts` |
| OpenAI API | `OPENAI_API_KEY` | `prototypes/Caroline/app.js` — `renderAlternatives()` |
| SQLite (better-sqlite3) | local file | `prototypes/divya/src/lib/db.ts` |
| Vercel | env var `GEMINI_API_KEY` | `csen-174-s26-team-project-smartshop.vercel.app` |
| GitHub Actions | `GEMINI_API_KEY` secret | `.github/workflows/ci.yml` |

> **Note:** Shreeya and Terry's prototypes are in `prototypes/shreeya/` and `prototypes/terry/` respectively. Their AI API integrations and databases are confirmed present per assignment requirements but were not read during this audit pass.

---

## Security Notes (Week 7 Audit)

Two findings were fixed and merged to main:

- **PR #28** — Added a crisis/sensitive-content detection gate in `prototypes/divya/src/app/api/chat/route.ts` before the Gemini call. Inputs matching self-harm or minor-disclosure patterns return a 988 Lifeline response instead of forwarding to the model.
- **PR #29** — Fixed XSS in `prototypes/Caroline/app.js`. `renderAlternatives()` was using `innerHTML` to render AI-generated content; replaced with `textContent` to prevent script injection.

See `docs/sprint-2-remediations.md` for full before/after diffs.

---

## CI Coverage Gap

GitHub Actions currently only runs tests in `prototypes/divya/`. Caroline's, Shreeya's, and Terry's prototypes have no CI test coverage. `OPENAI_API_KEY` is not in the repo secrets, so a Caroline-covering workflow would need it added.
