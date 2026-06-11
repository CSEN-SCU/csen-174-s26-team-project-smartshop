Smart Shop Technical Report
Product Vision and Evolution:
Our original vision for Smart Shop was a grocery price-comparison app that helped budget-conscious shoppers find the cheapest groceries in their area. The goal was to reduce the time and effort required to compare prices across multiple stores and help users save money.
As the project developed, our vision expanded beyond simply showing the lowest prices. Through feedback from personas, storyboards, and project reviews, we realized that shoppers also care about convenience. As a result, we added store distance information so users can decide whether traveling farther for a lower price is actually worthwhile. We also integrated AI-powered search functionality that interprets user input and quickly finds matching products from our database.
Several key decisions shaped this evolution. First, persona and storyboard feedback showed that users wanted a faster, simpler shopping experience rather than manually checking multiple store apps. Second, gallery walk and peer feedback suggested additional factors beyond price, such as location and allergies. Third, technical development allowed us to implement a scraper that automatically gathers product and pricing data and stores it in a database, making comparisons more accurate and up to date.
The product still serves our original target audience of grocery shoppers on a budget, but it now provides a more complete decision-making tool. Instead of only identifying the cheapest product, Smart Shop helps users balance both cost and convenience while reducing the manual effort required to find the best deal.
Link: csen-174–s26-team-project-smartshop/docs/product-vision.md/
Architecture Evolution: 
Week 4:
Context diagram:					Container diagram: 
 
Week 8: 
Context diagram: 

Container diagram:

Final architecture diagram

Week 4 → Week 8: The project evolved from a simple price-comparison prototype into a more complete application featuring AI-powered recommendations, database storage, Google Maps integration for store distance calculations, and automated testing and deployment.
Week 8 → Final: The architecture was refined into four clearly defined components, and safety improvements were introduced to help shoppers balance both product cost and travel considerations rather than focusing solely on the lowest price.
Link: csen-174–s26-team-project-smartshop/docs/sprint-2-remediations.md

Current State of Prototype:
Live Link : https://divya-ten-vert.vercel.app/
Demo Night GitHub: csen-174–s26-team-project-smartshop/demo-night/
Smart Shop is a grocery price-comparison application designed to help budget-conscious shoppers identify the best purchasing options across multiple stores. Users can search for products, compare prices, and consider store location information when deciding where to shop. The application reduces the time required to manually compare products across different grocery stores and provides a more convenient way to evaluate both cost and travel considerations.
Major Features
Price Comparison 
Allows users to compare grocery product prices across multiple stores.
Data source and processing: database/
User-facing prototype: prototypes/
Product Search
Enables users to search for grocery products and view matching results.
User-facing prototype: prototypes/
Testing artifact: docs/search.test.tsx
Automated Data Collection Using Scraper
Collects grocery product and pricing information for use in comparisons.
Service module: scraper/
Data Storage
Stores scraped product and pricing information used by the application.
Service module: database/
Supporting data files: data/
What the Prototype Does Not Do
The current prototype does not provide:
Direct online grocery purchasing.
Personalized shopping histories.
Real-time inventory availability.
Route optimization across multiple stores.
Native iOS or Android applications.
csen-174–s26-team-project-smartshop/demo-night/

Engineering Process: Testing, Security, Development:

Testing:
Strategy as planned (W5):
The team adopted a TDD discipline for the database layer: write tests that fail first, then implement just enough code to make them pass. The scope was intentionally narrow — unit tests for pure data functions with no network calls, no database side effects, and no UI dependencies. Integration tests for the /api/chat route were scoped out of Sprint 1 and deferred to Sprint 2, annotated with test.skip and a reason string so the CI pipeline would stay green without hiding the gap.

Strategy as implemented:

The representative test is in prototypes/divya/src/lib/db.test.ts. The getStoreCount and getProductsByStore tests were written RED before the functions existed in db.ts. The tests assert specific behavior — getStoreCount() must return exactly 5, not just a positive integer — which forced a deliberate decision about what the database contract actually is. The getPricesForItems tests assert on shape (each result must have store, price, unit, and distance fields) rather than exact values, which keeps the tests stable across data refreshes while still catching structural regressions.

The chat route integration tests in src/app/api/chat/route.test.ts were written with a full OpenAI mock but deferred with test.skip — the mock is wired up and ready, but the tests are annotated: "Sprint 2 — blocked on stable API contract; mock shape may change with tool-call refactor." This is the team's explicit record that the gap is known and intentional, not overlooked.

AI vs. human judgment:

The AI generated the initial shape of the getPricesForItems tests and the OpenAI mock setup in route.test.ts. Human judgment was required to decide that getStoreCount should assert toBe(5) rather than toBeGreaterThan(0) — a stricter contract that would catch a silent data pipeline failure. The AI's first draft used the looser assertion; a human reviewer tightened it after recognizing that the whole point of the test was to verify the scraper had actually populated all four stores.

Links:
Test file: prototypes/divya/src/lib/db.test.ts
Deferred integration tests: prototypes/divya/src/app/api/chat/route.test.ts

Security
,Strategy as planned (W7):
The security audit covered five categories across the team's own codebase: prompt injection, missing authentication on routes, XSS, logging and data exposure, and dependency vulnerabilities. A separate cross-team red-team exercise was conducted against Team TTSTT's deployed prototype.

Strategy as implemented
The most impactful finding in the self-audit was an XSS vulnerability in Caroline's prototypes/Caroline/app.js: the server was rendering AI-generated content into the DOM using innerHTML, which would execute any <script> tag returned by the model. The fix was a one-line change to textContent, which tells the DOM to treat content as text rather than markup. This shipped in PR #29.

The second finding was a missing responsible AI gate in the chat route. The route was passing all user messages directly to OpenAI with no pre-flight check. A crisis detection gate was added in PR #28 — a set of regex patterns covering self-harm and suicidal ideation that intercepts matching messages before any database write or API call and returns crisis resources (988 Suicide & Crisis Lifeline, Crisis Text Line) instead.

AI vs. human judgment
The AI identified the innerHTML → textContent fix automatically when shown the code. The decision to add a crisis detection gate, and the specific choice of which patterns to match (including age-disclosure patterns like "I'm 14 years old"), required human judgment about what harms were plausible for a grocery assistant — a category the AI did not surface unprompted.

Links
XSS fix: PR #29 (prototypes/Caroline/app.js)
Crisis detection gate: PR #28 (prototypes/divya/src/app/api/chat/route.ts)
Red team report: docs/red-team-report-team-ttstt.md
Remediations write-up: docs/sprint-2-remediations.md

Deployment:
Strategy as planned (W6):
The team set up a GitHub Actions CI pipeline triggered on every pull request and every push to main. The plan was to run all three test suites (tddSkillTests, Caroline's prototype, Divya's prototype) in sequence, blocking merge if any suite failed. The deployment target was Vercel, chosen for its native Next.js support and zero-config API route handling.

Strategy as implemented:
The CI workflow at .github/workflows/ci.yml runs three jobs in sequence on every PR and push to main: tddSkillTests (npm install → npm test), prototypes/Caroline (npm install → npm test), and prototypes/divya (npm install → npm test). The OPENAI_API_KEY is injected as a GitHub Actions secret only into the steps that need it — it never appears in the workflow YAML itself.

The Vercel deployment required two non-obvious fixes before it stabilized. First, better-sqlite3 (a native binary module) failed to compile in Vercel's serverless environment, so the entire database layer was rewritten to import from a static products-data.json file generated by scripts/export-db.js. Second, a Content Security Policy in next.config.js was blocking Next.js's inline bootstrap scripts in production (script-src 'self' with no 'unsafe-inline'), which prevented React from hydrating and made the entire UI non-interactive. Both fixes were diagnosed from Vercel build logs and browser console inspection.

AI vs. human judgment:
The AI wrote the initial CI workflow YAML and the Vercel configuration. Human judgment was needed to diagnose the CSP issue — the symptom (button clicks doing nothing) pointed to a JavaScript problem, but the root cause (a security header silently blocking inline scripts) required understanding of how Next.js bootstraps React on the client, which the AI did not surface until given the specific symptom to reason about.

Links
CI workflow: .github/workflows/ci.yml
Deployment config: prototypes/divya/next.config.js, vercel.json
Data export script: prototypes/divya/scripts/export-db.js
Live URL: https://divya-ten-vert.vercel.app

Success, Setbacks, What we Would Change:
Successes
One major success was the team's division of work during Sprint 1. Team members were assigned ownership of frontend, backend, AI, and database responsibilities, which reduced overlap and allowed multiple parts of the project to progress simultaneously. This approach worked because responsibilities were clear enough for each member to focus on a specific area while still checking in with the rest of the team when integration issues arose. In future projects, we would continue assigning clear ownership areas early in each sprint.
A second success was the team's adoption of testing and CI/CD practices. During Sprint 1, the team moved beyond discussing tests conceptually and added actual tests to the repository. Passing tests were integrated into the CI workflow while unfinished features remained intentionally skipped rather than breaking the build. This approach provided a reliable baseline for development and allowed the team to verify functionality continuously. The work culminated in a successful CI/CD pipeline and deployment to Vercel through PR #23. We would continue using automated testing and continuous integration from the beginning of future projects because it made integration problems visible early.
A third success was the addition of AI-powered functionality and the team's response to security concerns during Sprint 2. The team successfully integrated OpenAI-powered product recommendations into the deployed prototype. When deployment issues prevented the feature from loading correctly, team members collaborated to resolve API key configuration problems and complete the integration. Later, after receiving peer feedback, the team implemented security improvements that addressed AI-generated content risks and responsible AI concerns. These fixes were merged through PR #28 and PR #29. This experience demonstrated the value of peer review and security-focused testing, practices we would continue in future development cycles.
Setbacks
One setback occurred during Sprint 1 when multiple team members worked on testing simultaneously without first agreeing on a final test organization structure. Although everyone contributed useful tests, the team encountered confusion regarding file locations, ownership, and merge responsibilities. This led to branch conflicts and uncertainty about whether some tests overlapped. To prevent similar problems, we agreed to establish test ownership and folder structures before implementation begins and to designate a single coordinator for merging testing-related pull requests.
Another setback involved collecting grocery pricing data. Many grocery store websites blocked or restricted automated scraping, which limited the amount of data we could gather.
Because of this, the application was only able to compare prices from a smaller set of stores than originally planned. We recognized the issue once scraping attempts consistently failed on several major grocery websites. If we were to do the project again, we would evaluate data accessibility earlier and prioritize stores that provide accessible product data or APIs.
AI Tools 
AI tools contributed significantly to the project, particularly during implementation and testing. The team used AI assistance to generate initial code structures, accelerate development of API integrations, and create testing scaffolding that could then be refined and validated manually. However, the team also encountered situations where AI-generated output required substantial review. The most notable examples emerged during Sprint 2 security analysis, where peer reviewers identified vulnerabilities related to AI-generated content and the handling of sensitive user disclosures. The team ultimately had to add filters to the AI search we implemented so that the users can only search for relevant topics and not exploit the open AI chat. These experiences reinforced that AI tools were most valuable for accelerating routine implementation work, but security, privacy, and architectural decisions still required careful human review and intervention.

Link: csen-174–s26-team-project-smartshop/docs/sprint-1-retro.md

Future Work: 
Expanded Store Coverage (1 sprint)
We would expand the number of grocery stores included in the comparison database. The current prototype is limited by the availability of pricing data, so increasing store coverage would make the recommendations more useful and accurate for users.

Multi-Store Trip Optimization (research problem)
A future enhancement would be generating an optimized shopping plan across multiple stores. This requires balancing product prices, store locations, and travel costs. While a basic version could be implemented, developing an effective optimization algorithm would require additional research and evaluation.
Real-Time Price Updates (research/problem depending on data access)
Providing real-time pricing information would improve accuracy, but this depends on obtaining reliable access to store data. Because many grocery stores restrict automated data collection, this challenge is largely dependent on external data sources rather than implementation effort alone. There are also other factors like member prices or clearance that would require additional data collection/scraping. 


Advice for Future Teams: 
Define ownership and repository structure at the start of each sprint, especially for testing, to avoid merge conflicts and overlapping work.
Set up CI/CD and deployment early so environment and dependency issues are discovered before the end of the project.
Verify data availability before committing to a feature that depends on external sources, since many websites restrict scraping and may limit what you can build.

