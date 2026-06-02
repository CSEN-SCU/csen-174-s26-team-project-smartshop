# SmartShop Database — Grocery Price Scraper

Scrapes real grocery prices from four Santa Clara stores and produces a SQLite database compatible with the Divya prototype's schema.

## Stores covered

| Store | Address | Notes |
|-------|---------|-------|
| Trader Joe's | 3430 El Camino Real, Santa Clara | GraphQL API — fast, no auth needed |
| Safeway | 3025 El Camino Real, Santa Clara | Playwright (store ID 2774) |
| Whole Foods | 2732 Augustine Dr, Santa Clara | Playwright |
| Target | 3158 El Camino Real, Santa Clara | RedSky API — fast, no auth needed |

## Setup

```bash
cd prototypes/database
npm install
npx playwright install chromium   # download browser for Playwright scrapers
```

## Run

```bash
# Scrape all four stores (~5–10 min)
npm run scrape

# Scrape individual stores (much faster for testing)
npm run scrape:traderjoes
npm run scrape:target
node scraper/index.js traderjoes target   # multiple stores at once
```

Output: `data/smartshop.db`

## Use in the app

```bash
cp data/smartshop.db ../divya/smartshop.db
```

Then restart the Next.js dev server — it reads `smartshop.db` on startup. The schema matches exactly so no migration needed.

## Schema

Matches `prototypes/divya/src/lib/db.ts`:

```sql
stores  (id, name, address, distance_miles)
products (id, store_id, item_name, price, unit, brand, category, scraped_at)
chat_messages (id, role, content, created_at)
```

## Debugging scrapers

Set `PLAYWRIGHT_HEADLESS=0` to watch the browser:

```bash
PLAYWRIGHT_HEADLESS=0 npm run scrape:safeway
```

## Notes

- All scraped stores are in Santa Clara (zip 95051 / 95054).
- Re-running clears and replaces products for each store — prices stay fresh.
- Trader Joe's and Target use direct API calls (no browser needed).
- Safeway and Whole Foods use Playwright because their sites require session state.
