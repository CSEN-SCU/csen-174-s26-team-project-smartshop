# Smart Shop Prototype - C4 System Context (Level 1)

This diagram shows `Smart Shop Prototype` as a single system and the people/systems it interacts with.

```mermaid
flowchart LR
    shopper["Person: Shopper\nCreates lists, compares stores, finds alternatives"]

    subgraph smartshop["System: Smart Shop Prototype"]
      app["Web App + Backend API\n(HTML/CSS/JS + Node.js/Express)"]
    end

    openai["External System: OpenAI API\nList normalization and dupe suggestions"]
    maps["External System: Google Maps APIs\nGeocoding + nearby store search"]
    osm["External System: OpenStreetMap Services\nNominatim + Overpass fallback"]
    db["External System: Local Data Store (LowDB/JSON)\nSaved shopping lists and purchase history"]

    shopper -->|Uses in browser| app
    app -->|Reads/Writes list data| db
    app -->|Normalizes items, generates alternatives| openai
    app -->|Primary location + place lookup| maps
    app -->|Fallback geocoding/store lookup| osm
```

## Scope Notes

- **System of interest:** `Smart Shop Prototype` (frontend + backend API in one deployable unit).
- **Primary actor:** `Shopper`.
- **Current persistence:** `LowDB` JSON file (prototype stage).
- **Pricing behavior today:** mix of mock catalog pricing and estimated values for discovered stores.
- **Likely production evolution:** replace `LowDB` with `SQLite` or `PostgreSQL`, and add a scheduled price-ingestion pipeline.
