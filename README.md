# Grocery Price Finder

Minimal full-stack demo app where users search for grocery items and view nearby store prices.

## Stack

- Frontend: React + Vite
- Backend: Node.js + Express
- Database: SQLite
- AI integration: OpenAI API (normalizes user queries into item keywords)

## Run locally

### 1) Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

Backend runs on `http://localhost:4000`.

### 2) Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`.

## How it works

- Intro screen explains app purpose.
- Search screen sends item query to `/api/search`.
- Backend normalizes item names with OpenAI (if `OPENAI_API_KEY` is set).
- SQLite returns matching store prices, sorted by lowest price.
- If OpenAI is not configured, the app still works using a lowercase fallback.
