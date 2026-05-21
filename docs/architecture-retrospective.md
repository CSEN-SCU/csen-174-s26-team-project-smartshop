# Architecture Retrospective — SmartShop

**Date:** May 19, 2026  
**Team:** Divya Bengali, Shreeya Koritala, Caroline Tapia, Terry Chen

---
## Product Vision
#### FOR 
grocery shoppers
#### WHO 
want to save money/are on a budget.
#### THE 
Smart Shop app
#### THAT
Compares prices of groceries and ingredients across different grocery stores in the area and shows the user the most affordable option
#### UNLIKE 
Honey, the browser extension, that looks for online coupons. And unlike manually checking each store’s app/website (or just shopping at one store and hoping it’s cheapest).
#### OUR PRODUCT 
shows both prices and distance to the grocery store and helps users decide whether a lower price is actually worth the extra trip. Smart Shop automatically finds the lowest local price for the exact item you want across multiple stores so you don’t overpay for the same thing. Our product is POWERED BY AI that will read the text / images that the user inputs into the app and searches the web/ database to search for the most affordable options. It reduces the manual work of searching store by store and helps users compare equivalent products more accurately.

## C4 System Context Diagram

```mermaid
C4Context
  title SmartShop System Context deployed prototype

  Person(shopper, Shopper, Budget-conscious grocery shopper)

  System(smartshop, SmartShop, Next.js on Vercel. Chat with store prices and similar product suggestions. Crisis gate before OpenAI. Price scraper planned for live store data.)

  System_Ext(openai, OpenAI API, gpt-4.1-mini chat and similar alternatives OPENAI_API_KEY)
  System_Ext(maps, Google Maps API, Geocoding nearby stores and travel distance GOOGLE_MAPS_API_KEY)
  System_Ext(retailers, Grocery store sources, Store websites and catalogs. Scraper will read prices planned.)
  System_Ext(vercel, Vercel, Hosts SmartShop from main)

  Rel(shopper, smartshop, Uses chat and similar alternatives, HTTPS)
  Rel(smartshop, openai, Item extraction chat reply similar products, HTTPS)
  Rel(smartshop, maps, User location store distance and nearby search, HTTPS planned)
  Rel(smartshop, retailers, Price scraper ingests store data, HTTPS planned)
  Rel(vercel, smartshop, Build deploy and run, GitHub CI)
```

The full C4 container diagram, external services table, security notes, and CI coverage gap are documented in the PDF below.

[View architecture-retrospective.pdf](https://github.com/CSEN-SCU/csen-174-s26-team-project-smartshop/blob/main/docs/architecture-retrospective.pdf)
