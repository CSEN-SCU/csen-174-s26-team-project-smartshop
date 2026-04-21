# SmartShop — Divya's Prototype

A conversational grocery price comparison app. Tell it what you need to buy and it compares prices across 5 nearby stores, factoring in both price and distance.

## Setup (takes ~3 minutes)

### 1. Get your Gemini API key
1. Go to https://aistudio.google.com/app/apikey
2. Sign in with your Google account
3. Click **"Create API key"**
4. Copy the key

### 2. Add your API key
In this folder, create a file called `.env.local` (note the dot at the start):
```
GEMINI_API_KEY=paste_your_key_here
```

### 3. Install and run
```bash
npm install
npm run dev
```

Then open http://localhost:3000 in your browser.

## How it works
- **Front end**: Next.js + React chat UI with Tailwind CSS
- **Back end**: Next.js API routes (no separate server needed)
- **Database**: SQLite (auto-created on first run with mock grocery price data)
- **AI**: Google Gemini — parses your grocery list and generates conversational price comparison responses

## Tech stack
- Next.js 14
- TypeScript
- Tailwind CSS
- better-sqlite3
- @google/generative-ai
