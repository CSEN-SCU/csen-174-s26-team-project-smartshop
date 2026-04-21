# SmartShop — Terry prototype

Guided, step-by-step grocery planning for **Maya** (budget-conscious student): paste a list → AI (or offline) cleanup → compare **price + distance** → one recommended store with a short explanation → easy reset for the next demo.

## Prerequisites

- **Node.js 18+** (includes `fetch` for the AI call)
- **npm**

## Setup

```bash
cd prototypes/terry
cp .env.example .env
# Optional: add OPENAI_API_KEY to .env for real AI list cleanup
npm install
npm start
```

Open **http://localhost:3840** (or the URL printed in the terminal).

## Environment

| Variable | Purpose |
|----------|---------|
| `OPENAI_API_KEY` | If set, list cleanup uses the OpenAI-compatible Chat Completions API. If empty, the app uses a simple offline splitter so demos work without a key. |
| `OPENAI_MODEL` | Defaults to `gpt-4o-mini`. |
| `OPENAI_BASE_URL` | Optional; defaults to `https://api.openai.com/v1`. |
| `PORT` | HTTP port; defaults to `3840`. |

## What’s inside

- **Frontend**: static HTML/CSS/JS in `public/` — intro landing, then a linear wizard (not chat, not a dashboard).
- **Backend**: Express in `server/index.js`.
- **Database**: SQLite file at `data/smartshop.db` (created on first run; sample stores and prices seeded automatically).
- **AI**: `server/aiNormalize.js` calls the API when a key is present; otherwise offline normalization.

## Demo tip

Use list items that match the sample catalog, e.g. **milk, eggs, bread, bananas, pasta, rice, yogurt, cheese** — the prototype matches these to fixed prices in SQLite so comparisons stay stable for gallery walks.
