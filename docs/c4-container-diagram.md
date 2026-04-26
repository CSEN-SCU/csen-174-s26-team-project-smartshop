# Smart Shop Prototype - C4 Container Diagram (Level 2)

This diagram decomposes `Smart Shop` into deployable/runtime containers and shows how data flows between them.

```mermaid
flowchart LR
    shopper["Person: Shopper"]

    subgraph smartshop["System: Smart Shop"]
      web["Container: Multi-Page Web App\nTechnology: HTML/CSS/JavaScript (or React)\nResponsibilities: UI pages for list creation, store comparison, alternatives, saved history"]
      api["Container: Backend API Service\nTechnology: Node.js + Express\nResponsibilities: business logic, list normalization, price lookup, persistence, API orchestration"]
      db["Container: Product + User Data Store\nTechnology: PostgreSQL (or SQLite for prototype)\nResponsibilities: product catalog, store prices, saved shopping lists, purchase history, timestamps"]
      sync["Container: Price Sync Job\nTechnology: Scheduled worker/cron job\nResponsibilities: fetch/refresh product prices on schedule and upsert into database"]
    end

    openai["External System: OpenAI API\nNormalization and suggestion support"]
    maps["External System: Google Maps APIs\nGeocoding and nearby store discovery"]
    osm["External System: OpenStreetMap Services\nFallback geocoding/store lookup"]
    priceSource["External System: Third-Party Price Source\nRetail APIs, approved feeds, or bounded scraper input"]

    shopper -->|Uses in browser| web
    web -->|HTTPS JSON requests| api
    api <--> |Read/write lists and prices| db
    sync -->|Upsert refreshed price rows| db
    sync -->|Fetch product pricing data| priceSource
    api -->|Normalize list items / suggestions| openai
    api -->|Primary location/store APIs| maps
    api -->|Fallback location/store APIs| osm
```

## Container Notes

- `Multi-Page Web App` is intentionally split into multiple user journeys (e.g., compare prices, saved lists, alternatives) while staying a single frontend container.
- `Backend API Service` is the only container allowed to access external APIs and the database directly.
- `Product + User Data Store` is the source of truth for prices and saved lists; backend both reads and writes.
- `Price Sync Job` keeps price data fresh (hourly/daily) without tying refresh to user requests.

## Recommended Data Ownership

- `web`: presentation state only.
- `api`: validation, normalization, matching, and response shaping.
- `db`: durable records for `items`, `stores`, `price_observations`, `shopping_lists`, and `list_items`.
- `sync`: ingestion pipeline with timestamps (`observed_at`, `updated_at`) and retry logging.
