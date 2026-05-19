# SmartShop — Divya's Prototype

A conversational grocery price comparison app. Tell it what you need to buy and it compares prices across 5 nearby stores, factoring in both price and distance.

## Setup (takes ~3 minutes)

### 1. OpenAI API key
1. Go to https://platform.openai.com/api-keys  
2. Create a key and copy it.

### 2. Local environment
Create **`prototypes/divya/.env.local`** (not committed to git):

```bash
cd prototypes/divya
cp .env.example .env.local
```

Set **`OPENAI_API_KEY`** — used for the main chat (`/api/chat`) and **`/similar-alternatives`**.

**Vercel:** add **`OPENAI_API_KEY`** under **Project → Settings → Environment Variables**.  
Set the Vercel **Root Directory** to **`prototypes/divya`** so this app is what gets built.

### 3. Install and run
```bash
npm install
npm run dev
```

**Important:** `npm run dev` must stay running in a terminal. If you close it or never start it, the browser will show **connection failed** / refused.

Wait until you see **`✓ Ready`** in the terminal, then open the **Local** URL it prints (by default **http://localhost:3030**).

- **Home / chat:** http://localhost:3030/  
- **Similar alternatives:** http://localhost:3030/similar-alternatives  

**If the browser still cannot connect:**

1. Confirm the terminal still shows the Next dev process (no error exit).
2. Use the **exact** port in the address bar (if it says `3001` or `3031`, use that—not `3000` unless the log says so).
3. Try **http://127.0.0.1:3030** instead of `localhost` (same machine; rules out some DNS quirks).
4. After a production build, use **`npm run start`** (not `dev`) — it serves on port **3030** in this repo’s scripts.

**If you see 404:** the address bar must match the **exact** host and port from your terminal (e.g. if you open `http://localhost:3000` while Next is on **3030** or **3002**, you are hitting a **different** process and often get 404). Stop other dev servers or use the printed URL.

**Deployed (Vercel):** In the project settings, **Root Directory** must be **`prototypes/divya`**. If it is the repo root, Vercel will not find this Next app and every path returns **404**.

## Security (XSS / prompt injection)

- Chat and similar-alternatives UIs render model text as **React text nodes** (no `dangerouslySetInnerHTML`).
- **`next.config.js`** sends **Content-Security-Policy**, **X-Content-Type-Options**, and **Referrer-Policy** on all routes (stricter in production; dev allows `unsafe-eval` for Next.js hot reload).

## How it works
- **Front end**: Next.js + React chat UI with Tailwind CSS
- **Back end**: Next.js API routes (no separate server needed)
- **Database**: SQLite (auto-created on first run with mock grocery price data)
- **AI**: OpenAI (`gpt-4.1-mini`) for chat and similar-alternatives

## Tech stack
- Next.js 14
- TypeScript
- Tailwind CSS
- better-sqlite3
- openai
