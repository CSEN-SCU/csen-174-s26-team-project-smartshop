# Week 9 — Ethics Reflection and Code Freeze

**Team:** Divya Bengali, Shreeya Koritala, Caroline Tapia, Terry Chen  
**Course:** CSEN 174 · **Date:** June 1, 2026  
**Product:** SmartShop (class prototype, not production software)

---

## 1. Product vision (Moore template)

**FOR** budget-conscious grocery shoppers  
**WHO** need to stretch a food budget without spending hours comparing stores  
**THE** SmartShop app  
**IS A** local grocery comparison assistant  
**THAT** surfaces prices, store distance, and availability so shoppers can judge whether a cheaper item is worth the extra trip  
**UNLIKE** coupon browser extensions (online-only deals) or manually opening each store’s app or website one by one  
**OUR PRODUCT** combines multi-store price comparison with distance as a first-class input, and helps match equivalent items from user-entered grocery lists or item descriptions instead of forcing users to reconcile different product names themselves  

**POWERED BY** AI that interprets user text or images, queries our prototype database (and, in some team builds, scraped or sample store data), and returns a conversational recommendation—not a guarantee of what will ring up at the register.

---

## 2. Stakeholders

### User group: budget-conscious grocery shoppers

College students and busy families who plan trips around cost and time. They use SmartShop to decide *where* to shop and *whether* savings justify travel. A wrong recommendation can mean wasted bus fare, a missed dinner ingredient, or overspending when they trusted stale data.

### Non-user group: local grocery stores and employees

Stores do not log into SmartShop, but their listed prices and stock levels shape where customers go. Employees may face frustrated shoppers if our data is wrong, and small stores may be misrepresented if scrapers or AI matching pick the wrong SKU or an outdated promo price.

---

## 3. Potential harms

### Harm 1 — Inaccurate price or inventory data

| | |
|---|---|
| **Harm** | Shoppers are harmed when they travel to a store expecting a low price or in-stock item that is no longer true. Stores and staff are harmed when customers arrive angry about “your app said it was $2.99.” |
| **Principle** | **1.03** — Approve software only if there is a well-founded belief that it is safe, meets specifications, and does not diminish quality of life or harm users |
| **Mitigation** | **Done / before demo:** Prototype data is labeled as sample or time-stamped where implemented; chat prompts ask the model to admit missing items. **Before demo night:** Re-run scraper or seed scripts on demo stores and add visible “last updated” copy. **Accepted:** We will not claim real-time accuracy—this is a class demo, not a pricing authority. |

### Harm 2 — Overconfident AI recommendations

| | |
|---|---|
| **Harm** | Users treat a friendly AI reply as ground truth—e.g., “definitely shop at Store A”—and buy the wrong size, brand, or “equivalent” product (especially risky for allergies or dietary needs called out in our Problem Framing Canvas). |
| **Principle** | **6.03** — Not give misleading information about software or related documents |
| **Mitigation** | **Done:** System prompts stress price *and* distance and cap response length; similar-alternatives flows document confidence limits in code comments and UI copy. **Before demo night:** Add one-line disclaimer on chat results (“verify in store”). **Accepted:** Full nutrition/allergy guardrails are out of scope for the prototype; we document that substitutions are not medical advice. |

### Harm 3 — Crisis or sensitive disclosures handled like normal grocery chat

| | |
|---|---|
| **Harm** | Someone mentions self-harm, crisis, or being a minor in the same chat box used for “eggs and milk.” If we save that text and send it to an LLM, we could store sensitive content, get an inappropriate grocery reply, and fail a basic duty of care—even in a class project. |
| **Principle** | **1.05** — Cooperate in addressing matters of grave public concern caused by software |
| **Mitigation** | **Done (Week 7 Responsible AI remediation):** See concrete change below. **Before demo night:** Manually retest crisis phrases on the demo build. **Accepted:** Keyword matching will miss some cases and may false-positive; we treat the gate as a minimum bar, not clinical triage. |

---

## 4. One concrete ethical change

**Change:** Crisis detection runs **before** any side effects in the grocery chat API.

We added `detectCrisisMessage(message)` (implemented as a pattern-matching gate in our chat route): if the user message matches crisis or sensitive patterns (self-harm language, suicidal ideation, minor age disclosure), the handler **immediately** returns a fixed `CRISIS_RESPONSE` with U.S. crisis resources (988, Crisis Text Line). It does **not** write the message to the database or invoke Gemini or other model APIs.

```ts
if (detectCrisisMessage(message)) {
  return NextResponse.json({ reply: CRISIS_RESPONSE });
}
// only then: saveMessage(...), extract items, call model
```

This directly addresses Harm 3: sensitive text is not persisted or forwarded for grocery completion.

**Location:** `prototypes/divya/src/app/api/chat/route.ts` (pattern-matching gate; documented in `docs/sprint-2-remediations.md`).

---

## Code freeze (Week 9)

After code freeze, our team will treat SmartShop as **feature-complete for the course**. Further changes are limited to **bug fixes, deployment fixes, copy edits, accessibility fixes, security patches, and last-mile polish** only—no new features or refactors unless an instructor approves an exception.

**Deployed URL:** [paste final live app URL here]
