---
name: problem-framing-canvas
description: Guide teams through MITRE's Problem Framing Canvas. Use when you need a clearer problem statement before jumping to solutions.
intent: >-
  Guide product managers through the MITRE Problem Framing Canvas process by asking structured questions across three phases: Look Inward (examine your own assumptions and biases), Look Outward (understand who experiences the problem and who doesn't), and Reframe (synthesize insights into an actionable problem statement and "How Might We" question). Use this to ensure you're solving the right problem before jumping to solutions—avoiding confirmation bias, overlooked stakeholders, and solution-first thinking.
type: interactive
best_for:
  - "Clarifying a messy problem before solutioning"
  - "Surfacing assumptions and overlooked stakeholders"
  - "Creating a bias-resistant problem statement in a workshop"
scenarios:
  - "Run a Problem Framing Canvas for our mobile retention issue"
  - "Help me reframe this stakeholder request before we build anything"
  - "We need a clearer problem statement for onboarding drop-off"
---

## Purpose

Guide product managers through the MITRE Problem Framing Canvas process by asking structured questions across three phases: Look Inward (examine your own assumptions and biases), Look Outward (understand who experiences the problem and who doesn't), and Reframe (synthesize insights into an actionable problem statement and "How Might We" question). Use this to ensure you're solving the right problem before jumping to solutions—avoiding confirmation bias, overlooked stakeholders, and solution-first thinking.

This is not a solution brainstorm—it's a problem framing tool that broadens perspective, challenges assumptions, and produces a clear, equity-driven problem statement.

## Key Concepts

### What is the MITRE Problem Framing Canvas?

The Problem Framing Canvas (MITRE Innovation Toolkit, v3) is a structured framework that helps teams explore a problem space comprehensively before proposing solutions. It's partitioned into **three areas**:

1. **Look Inward** — Examine your own assumptions, biases, and how you might be part of the problem
2. **Look Outward** — Understand who experiences the problem, who benefits from it, and who's been left out
3. **Reframe** — Synthesize insights into a clear, actionable problem statement and "How Might We" question

### Canvas Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                         LOOK INWARD                             │
│  - What is the problem? (symptoms)                              │
│  - Why haven't we solved it? (new, hard, low priority, etc.)   │
│  - How are we part of the problem? (assumptions, biases)        │
└─────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────┐
│                        LOOK OUTWARD                             │
│  - Who experiences the problem? When/where/consequences?        │
│  - Who else has it? Who doesn't have it?                        │
│  - Who's been left out?                                         │
│  - Who benefits when problem exists/doesn't exist?              │
└─────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────┐
│                           REFRAME                               │
│  - Stated another way, the problem is: [restatement]           │
│  - How might we [action] as we aim to [objective]?             │
└─────────────────────────────────────────────────────────────────┘
```

### Why This Works

- **Broadens perspective:** Forces you to look beyond your own assumptions
- **Equity-driven:** Centers marginalized voices and asks "who's been left out?"
- **Challenges biases:** Requires explicit examination of assumptions before framing problem
- **Actionable output:** Produces HMW statement ready for solution exploration

### Anti-Patterns (What This Is NOT)

- **Not a solution brainstorm:** Canvas frames the problem; solutions come later
- **Not a feature request list:** Focuses on underlying problems, not surface symptoms
- **Not a one-person exercise:** Requires diverse perspectives to challenge groupthink

### When to Use This

- Starting discovery for a new initiative
- Reframing an existing problem (suspect you're solving the wrong thing)
- Challenging assumptions before building solutions
- Aligning cross-functional teams on problem definition

### When NOT to Use This

- When the problem is already well-understood and validated
- For tactical bug fixes or technical debt (no deep framing needed)
- When stakeholders have already committed to a solution (address alignment first)

---

### Facilitation Source of Truth

Use [`workshop-facilitation`](../workshop-facilitation/SKILL.md) as the default interaction protocol for this skill. It defines:

- session heads-up + entry mode (Guided, Context dump, Best guess)
- one-question turns with plain-language prompts
- progress labels (for example, Context Qx/8 and Scoring Qx/5)
- interruption handling and pause/resume behavior
- numbered recommendations at decision points
- quick-select numbered response options for regular questions (include `Other (specify)` when useful)

This file defines the domain-specific assessment content. If there is a conflict, follow this file's domain logic.

## Application

Use `template.md` for the full fill-in structure. This interactive skill follows a **three-phase process**, asking **adaptive questions** in each phase.

---

### Step 0: Gather Context (Before Questions)

**Agent suggests:** Before we frame your problem, let's gather context:

**Problem Context:**
- Initial problem statement or stakeholder request
- Symptoms you've observed (support tickets, churn data, user complaints)
- Existing research (user interviews, surveys, analytics)
- Assumptions you're making about the problem

**Stakeholder Context:**
- Who's affected by this problem? (users, customers, internal teams)
- Who's asking for this to be solved? (execs, sales, customers)
- Who might have been overlooked?

**You can paste this content directly, or describe the problem briefly.**

---

## Phase 1: Look Inward

**Goal:** Examine your own assumptions, biases, and how you might be part of the problem.

---

### Question 1: What is the problem? (Describe symptoms)

**Agent asks:** "What is the problem as you currently understand it? Describe the symptoms."

**Offer 4 enumerated options:**

1. **Customer pain point** — "Customers struggle with [specific task/outcome]"
2. **Business metric problem** — "We're seeing [metric decline]"
3. **Stakeholder request** — "Stakeholders say we need [feature/change]"
4. **Observed behavior** — "We've noticed [pattern/trend]"

**Or describe your problem/symptoms.**

---

### Question 2: Why haven't we solved it?

**Agent asks:** "Why hasn't this problem been solved yet?"

**Offer 6 enumerated options (can select multiple):**

1. **It's new** — "Problem recently emerged"
2. **It's hard** — "Technically complex or resource-intensive"
3. **It's low priority** — "Other initiatives took precedence"
4. **Lack of resources** — "Not enough budget, people, or time"
5. **Lack of authority** — "Can't make the decision or get buy-in"
6. **A systemic inequity** — "Problem disproportionately affects marginalized groups, overlooked"

---

### Question 3: How are we part of the problem? (Assumptions & biases)

**Agent asks:** "How might you (or your team) be part of the problem? What assumptions or biases are you bringing?"

**Offer 4 enumerated options:**

1. **Assuming we know what customers want** — Confirmation bias
2. **Optimizing for ourselves, not users** — Internal bias
3. **Overlooking specific user segments** — Survivorship bias
4. **Solution-first thinking** — Premature convergence

---

## Phase 2: Look Outward

**Goal:** Understand who experiences the problem, who benefits from it, and who's been left out.

---

### Question 4: Who experiences the problem? (When, where, consequences)

**Agent asks:** "Who experiences this problem? When and where do they experience it? What consequences do they face?"

- **Who:** Specific personas, user segments, or roles
- **When:** Triggering events or contexts
- **Where:** Physical or digital locations
- **Consequences:** Impact on users

---

### Question 5: Who else has this problem? Who doesn't have it?

**Agent asks:** "Who else has this problem? And who doesn't have it?"

- **Who else has it:** Other companies, industries, or domains with similar problems
- **How do they deal with it:** Workarounds, solutions, or adaptations
- **Who doesn't have it:** Users/companies that avoid the problem

---

### Question 6: Who's been left out? Who benefits?

**Agent asks:** "Who's been left out of the conversation so far? And who benefits when this problem exists or doesn't exist?"

- **Who's been left out:** Marginalized voices, edge cases, overlooked stakeholders
- **Who benefits when problem exists:** Who gains from the status quo?
- **Who benefits when problem doesn't exist:** Who loses if problem is solved?

---

## Phase 3: Reframe

**Goal:** Synthesize insights into a clear, actionable problem statement and "How Might We" question.

---

### Question 7: Restate the problem

**Template:** "The problem is: [Who] struggles to [accomplish what] because [root cause], which leads to [consequence]. This affects [specific segments] and has been overlooked because [bias/assumption from Phase 1]."

---

### Question 8: Create "How Might We" statement

**Template:** "How might we [action that addresses the problem] as we aim to [objective/desired condition]?"

---

### Output: Problem Framing Canvas + HMW Statement

```markdown
# Problem Framing Canvas: [Problem Name]

**Date:** [Today's date]

---

## Phase 1: Look Inward

### What is the problem? (Symptoms)
[Description from Q1]

### Why haven't we solved it?
- [Barrier 1 from Q2]

### How are we part of the problem? (Assumptions & biases)
- [Assumption 1 from Q3]

---

## Phase 2: Look Outward

### Who experiences the problem?
**Who:** [Personas/segments from Q4]
**When/Where:** [Context]
**Consequences:** [Impact on users]

### Who else has this problem?
[Examples from Q5]

### Who doesn't have it?
[Counter-examples from Q5]

### Who's been left out?
[Marginalized voices from Q6]

### Who benefits?
**When problem exists:** [Beneficiaries of status quo]
**When problem doesn't exist:** [Who loses if solved]

---

## Phase 3: Reframe

### Stated another way, the problem is:
[Refined problem statement from Q7]

### How Might We...
**How might we** [action from Q8] **as we aim to** [objective from Q8]?

---

## Next Steps
1. **Validate with users:** Test reframed problem with customers
2. **Generate solutions:** Explore solution space
3. **Create problem statement:** Formalize for PRD/roadmap
```

---

## Common Pitfalls

### Pitfall 1: Skipping "Look Inward"
**Fix:** Force explicit discussion of assumptions and biases (Q2-Q3)

### Pitfall 2: Ignoring "Who Benefits" Question
**Fix:** Always ask "Who loses if this problem is solved?" (Q6)

### Pitfall 3: Generic Problem Statement
**Fix:** Make problem specific (who, what, when, consequence, root cause)

### Pitfall 4: HMW Statement Is Too Narrow
**Fix:** Keep HMW broad enough to allow multiple solution approaches

### Pitfall 5: Solo Exercise (No Diverse Perspectives)
**Fix:** Facilitate canvas workshop with cross-functional team + customer input

---

## References

### Related Skills
- `skills/problem-statement/SKILL.md` — Converts reframed problem into formal problem statement
- `skills/opportunity-solution-tree/SKILL.md` — Uses HMW statement to generate solution options
- `skills/discovery-interview-prep/SKILL.md` — Validates reframed problem with customers

### External Frameworks
- MITRE Innovation Toolkit, "Problem Framing Canvas v3" (2021)
- Stanford d.school, "How Might We" statements

---

**Skill type:** Interactive
**Dependencies:** Uses `skills/problem-statement/SKILL.md`
