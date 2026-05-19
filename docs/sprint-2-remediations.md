# Sprint 2 Security Remediations

**Team:** SmartShop (Divya Bhaskara, Shreeya Koritala, Caroline Tapia, Terry Chen)
**Peer report received from:** TTSTT (Noelle Evanich, Diego Silva, Dana Steinke)
**Date:** May 18, 2026
**Repo:** https://github.com/CSEN-SCU/csen-174-s26-team-project-smartshop

---

## Overview

The TTSTT team identified three findings in our codebase. We chose to implement fixes for
**Finding b (AI API Security — Prompt-Injection-Driven XSS)** and
**Finding c (Responsible AI — Sensitive disclosures processed as ordinary shopping chat)**,
as these both directly involve our AI integration and represent the highest user-harm potential.
Finding a (IDOR on purchase history) was noted but deprioritized because the Caroline prototype
is not deployed and has no authentication system yet; IDOR is not exploitable without auth.

---

## Remediation 1 — AI API Security: XSS via AI-Generated Content in `innerHTML`

**Source finding:** Peer report section 3b — "Prompt-Injection-Driven Client-Side HTML Injection
(Potential XSS)" — `prototypes/Caroline/server.js` lines 229–233, 590–606 (now in `app.js`
after a post-report refactor that moved inline HTML to a separate client-side file).

**Merged PR:** https://github.com/CSEN-SCU/csen-174-s26-team-project-smartshop/pull/29

### What was wrong

In `prototypes/Caroline/app.js`, the `renderAlternatives()` function rendered each
AI-generated alternative item card using a template literal assigned directly to
`card.innerHTML`:

```js
// BEFORE (vulnerable)
card.innerHTML = \`
  <strong>\${alternative.name}</strong>
  <p>Estimated price: \${fmtCurrency.format(Number(alternative.estimatedPrice || 0))}</p>
  <p>\${alternative.reason || ""}</p>
\`;
```

The fields `alternative.name`, `alternative.estimatedPrice`, and `alternative.reason` all
come from the OpenAI API response. If a prompt-injection attack caused the model to return
HTML or `<script>` tags in those fields, the browser would execute the injected code in the
user's session.

### What we changed

Replaced the `innerHTML` template literal with explicit `document.createElement` calls and
`textContent` assignments for each AI-generated field, so the content is always treated as
plain text regardless of what the model returns:

```js
// AFTER (safe)
// Security fix: use textContent to prevent XSS from AI-generated content
const nameEl = document.createElement('strong');
nameEl.textContent = alternative.name;
const priceEl = document.createElement('p');
priceEl.textContent = \`Estimated price: \${fmtCurrency.format(Number(alternative.estimatedPrice || 0))}\`;
const reasonEl = document.createElement('p');
reasonEl.textContent = alternative.reason || '';
card.appendChild(nameEl);
card.appendChild(priceEl);
card.appendChild(reasonEl);
```

### Why this fixes it

`textContent` sets the text content of a node as raw text — any HTML tags in the string are
rendered as literal characters rather than parsed as markup, so injected `<script>` payloads
are harmless.

---

## Remediation 2 — Responsible AI: Crisis Disclosures Stored and Sent to AI Without Triage

**Source finding:** Peer report section 3c — "Sensitive crisis/medical/minor disclosures are
stored and processed as ordinary shopping chat" — `prototypes/divya/src/app/api/chat/route.ts`
lines 30–87; `db.ts` lines 36–40 and 135–137.

**Merged PR:** https://github.com/CSEN-SCU/csen-174-s26-team-project-smartshop/pull/28

### What was wrong

In the Divya Next.js prototype, the POST `/api/chat` route called `saveMessage("user", message)`
and then sent the message to OpenAI **before any safety check**. A user who typed a self-harm
disclosure, medical PII, or age disclosure of a minor would have that content:

1. Persisted verbatim to the SQLite `chat_messages` table.
2. Forwarded to the OpenAI API as a grocery-shopping query.
3. Received a grocery-focused reply with no crisis acknowledgment.

### What we changed

Added a crisis/sensitive-content detection gate **before** any database write or AI call.
If the user message matches any pattern in a deny-list (self-harm phrases, suicidal ideation
keywords, minor age disclosure), the route returns a safe response immediately with crisis
resources — without touching the DB or calling OpenAI:

```ts
const CRISIS_PATTERNS = [
  /hurt(?:ing)?\s+(?:my)?self/i,
  /kill(?:ing)?\s+(?:my)?self/i,
  /suicid/i,
  /self[\s-]?harm/i,
  /want to die/i,
  /end (?:my )?life/i,
  /i(?:'m| am) (?:only )?\d{1,2}(?:\s*years? old|\s*yo)?/i,
  /i(?:'m| am) a minor/i,
];

const CRISIS_RESPONSE =
  "I'm a grocery price assistant and not equipped to help with what you've shared. " +
  "If you're going through something difficult, please reach out to someone who can support you.\n\n" +
  "**988 Suicide & Crisis Lifeline** — call or text **988** (US)\n" +
  "**Crisis Text Line** — text HOME to **741741**\n\n" +
  "If you have grocery questions, I'm here to help with those.";

if (CRISIS_PATTERNS.some((p) => p.test(message))) {
  // Do NOT save to DB or call OpenAI — return safe response immediately
  return NextResponse.json({ reply: CRISIS_RESPONSE });
}
```

### Why this fixes it

- No sensitive disclosure is written to the database.
- No sensitive disclosure is sent to a third-party AI provider.
- The user receives an appropriate crisis resource response rather than a grocery recommendation.
- The gate runs on every request before any other side effect.

---

## Summary

| # | Category | Peer Finding | Fix Location | PR |
|---|----------|-------------|--------------|-----|
| 1 | AI API Security | innerHTML XSS via AI alternatives | `prototypes/Caroline/app.js` | [#29](https://github.com/CSEN-SCU/csen-174-s26-team-project-smartshop/pull/29) |
| 2 | Responsible AI | Crisis disclosures stored/sent to AI | `prototypes/divya/src/app/api/chat/route.ts` | [#28](https://github.com/CSEN-SCU/csen-174-s26-team-project-smartshop/pull/28) |
