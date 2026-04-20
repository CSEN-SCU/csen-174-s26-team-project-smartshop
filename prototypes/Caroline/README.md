# Smart Shop Prototype (Caroline)

## Setup

1. Copy `.env.example` to `.env`
2. Set `OPENAI_API_KEY` in `.env`
3. Install dependencies:

```bash
npm install
```

4. Start server:

```bash
npm run dev
```

5. Open: `http://localhost:4000`

## What this prototype does

- Accepts a full shopping list
- Uses backend route `/api/normalize-items` to normalize list items (OpenAI-powered when key is set)
- Compares full-cart totals by store via `/api/compare` for groceries, cleaning, home goods, clothing, and makeup
- Shows each store's total and distance
- Stores per-user frequent purchases in `db.json` via `/api/users/:userId/purchases`
- Supports dupe search for apparel/beauty/home items from text + optional image via `/api/find-dupes`
