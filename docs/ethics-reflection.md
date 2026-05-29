Date: May 26, 2026
Team: Divya Bengali, Shreeya Koritala, Caroline Tapia, Terry Chen

Week 9 - Ethics Reflection and Code Freeze

## Product Vision:
### FOR
grocery shoppers
### WHO
want to save money/are on a budget.
### THE
Smart Shop app
### THAT
Compares prices of groceries across different stores in the area and shows the user the most affordable option
### UNLIKE
Honey, the browser extension, that looks for online coupons. And unlike manually checking each store’s app/website (or just shopping at one store and hoping it’s cheapest).
### OUR PRODUCT
shows both prices and distance to the grocery store and helps users decide whether a lower price is actually worth the extra trip. Smart Shop automatically finds the lowest local price for the exact item you want across multiple stores so you don’t overpay for the same thing. Our product is POWERED BY AI that will read the text that the user inputs into the app and search the database to search for the most affordable options. 
### Stakeholders:
#### User group: 
Grocery shoppers on a budget who want an easier way to compare prices between nearby stores and save money on everyday purchases.
#### Non-user group: 
Grocery stores and retailers whose pricing data is collected and compared by the app, since the platform may influence where customers choose to shop without the stores directly using the product and we are getting the pricing information from scrapers. 

## Potential Harms: 

### Harm 1: 
Grocery shoppers could receive outdated or incorrect prices from stores, causing them to waste time or money traveling to a store expecting a lower price that is no longer available.
#### Principle: 
IEEE Code 1 & 5 “to hold paramount the safety, health, and welfare of the public… and to be honest and realistic in stating claims based on available data.”
#### Mitigation: 
The team will regularly update scraped pricing data, include timestamps showing when prices were last updated, and display a disclaimer that prices may change in-store. Before demo night, we will test the scraper across multiple stores to improve accuracy.
____________________
### Harm 2: Grocery stores could be harmed if incorrect pricing information makes them appear more expensive than competitors, potentially damaging their reputation or reducing customer traffic.
#### Principle: 
IEEE Code 9 “to avoid injuring others, their property, reputation, or employment by false or malicious actions.”
#### Mitigation: 
The team will verify pricing information before displaying it and allow corrections to be made quickly if errors are discovered. We will also avoid making misleading claims about stores and provide users with direct links or references to original store pricing when possible.
____________________
### Harm 3: Users’ location data or shopping habits could be exposed or misused, affecting their privacy and making users less comfortable using the app.
#### Principle: 
IEEE Code 1 “to protect the privacy of others.”
#### Mitigation: 
The app will collect only the minimum location data (zip code) needed to compare nearby stores and will not store unnecessary personal information. Before demo night, the team will ensure that user data is not shared with third parties and that privacy protections are clearly explained to users.
____________________
Positive Impact: 
Smart Shop could create value for low-income families and college students who may not have the time or transportation flexibility to compare grocery prices across multiple stores. To better serve this group, the team decided to include both price comparisons and distance-to-store information so users can judge whether traveling farther for a cheaper item is actually worthwhile. This design choice helps users balance transportation costs, time, and savings rather than only focusing on the lowest listed price. The tradeoff is that adding location-based features increases development complexity and requires handling user location data carefully to protect privacy.


### One Concrete Change: 
The team decided to add a disclaimer and timestamp next to all displayed grocery prices so users can see when the data was last updated, because ethical reasoning showed that outdated pricing information could mislead users and cause them to waste time or money.
