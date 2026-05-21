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
    title SmartShop System Context
    Person(shopper, "Shopper", "Budget grocery shopper")
    System(shop, "SmartShop", "Hosted on Vercel with chat and similar alternatives")
    System_Ext(ext_ai, "OpenAI API", "Chat and similar alternatives")
    System_Ext(ext_maps, "Google Maps API", "Geocoding and travel distance")
    System_Ext(ext_stores, "Store sources", "Catalogs for price scraper")
    System_Ext(ext_host, "Vercel", "Hosting")
    Rel(shopper, shop, "Uses")
    Rel(shop, ext_ai, "AI requests")
    Rel(shop, ext_maps, "Location and distance")
    Rel(shop, ext_stores, "Price ingest")
    Rel(ext_host, shop, "Deploys")
    UpdateElementStyle(shopper, $bgColor="#08427B", $fontColor="#FFFFFF", $borderColor="#052E56")
    UpdateElementStyle(shop, $bgColor="#15803D", $fontColor="#FFFFFF", $borderColor="#166534")
    UpdateElementStyle(ext_ai, $bgColor="#686868", $fontColor="#FFFFFF", $borderColor="#444444")
    UpdateElementStyle(ext_maps, $bgColor="#686868", $fontColor="#FFFFFF", $borderColor="#444444")
    UpdateElementStyle(ext_stores, $bgColor="#686868", $fontColor="#FFFFFF", $borderColor="#444444")
    UpdateElementStyle(ext_host, $bgColor="#686868", $fontColor="#FFFFFF", $borderColor="#444444")
    UpdateRelStyle(shopper, shop, $lineColor="#08427B", $textColor="#08427B")
    UpdateRelStyle(shop, ext_ai, $lineColor="#15803D", $textColor="#15803D")
    UpdateRelStyle(shop, ext_maps, $lineColor="#686868", $textColor="#686868")
    UpdateRelStyle(shop, ext_stores, $lineColor="#686868", $textColor="#686868")
    UpdateRelStyle(ext_host, shop, $lineColor="#686868", $textColor="#686868")
    UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="1")
```

The full C4 container diagram, external services table, security notes, and CI coverage gap are documented in the PDF below.

[View architecture-retrospective.pdf](https://github.com/CSEN-SCU/csen-174-s26-team-project-smartshop/blob/main/docs/architecture-retrospective.pdf)
