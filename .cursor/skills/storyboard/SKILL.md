---
name: storyboard
description: Create a six-frame storyboard that shows a user's journey from problem to solution. Use when you need a fast narrative for alignment, concept reviews, or demos.
intent: >-
  Create a 6-frame visual narrative that tells the story of a user's journey from problem to solution, using the classic storytelling arc to build empathy, illustrate value, and make abstract product concepts concrete. Use this to align stakeholders, pitch features, communicate vision, or test if your solution resonates emotionally before building it.
type: component
---

## Purpose

Create a 6-frame visual narrative that tells the story of a user's journey from problem to solution, using the classic storytelling arc to build empathy, illustrate value, and make abstract product concepts concrete. Use this to align stakeholders, pitch features, communicate vision, or test if your solution resonates emotionally before building it.

This is not a UI mockup—it's a storytelling tool that brings the human side of your product to life.

## Key Concepts

### The 6-Frame Storyboard Structure

Based on classic narrative arcs, the 6-frame format follows this pattern:

1. **Frame 1: Main Character** — Introduce the persona and their context
2. **Frame 2: The Problem Emerges** — Show the challenge or obstacle they face
3. **Frame 3: The "Oh Crap" Moment** — Escalate the problem to create urgency
4. **Frame 4: The Solution Appears** — Introduce your product/feature
5. **Frame 5: The "Aha" Moment** — Show the user experiencing the breakthrough
6. **Frame 6: Life After the Solution** — Illustrate the improved state

### Why This Works

- **Emotional engagement:** Stories create empathy in ways specs can't
- **Concrete over abstract:** Visual narrative makes vague concepts tangible
- **Memorable:** People remember stories better than feature lists
- **Alignment tool:** Stakeholders can react to a story and give feedback
- **Low-fidelity:** Doesn't require polished design—sketches work great

### Anti-Patterns (What This Is NOT)

- **Not a user flow diagram:** This is emotional storytelling, not process documentation
- **Not a feature demo:** Focus on user outcomes, not product capabilities
- **Not marketing copy:** Authentic narrative, not hype

### When to Use This

- Pitching a new product or feature to stakeholders
- Aligning teams on user value (product, design, engineering, execs)
- Testing if a product idea resonates emotionally
- Communicating vision at all-hands or investor meetings
- Validating problem/solution fit before building

### When NOT to Use This

- For technical implementation details (use architecture diagrams instead)
- When the user problem is trivial or well-understood
- As a replacement for user research (storyboards illustrate insights, don't create them)

---

## Application

Use `template.md` for the full fill-in structure.

### Step 1: Gather Context

Before creating the storyboard, ensure you have:

- **Persona clarity:** Who is the main character?
- **Problem understanding:** What challenge do they face?
- **Solution definition:** What product/feature will help?
- **Desired outcome:** What does success look like for the user?

**If missing context:** Run discovery work first. Don't fabricate personas or problems.

---

### Step 2: Answer the 7 Storyboard Questions

Ask these questions one at a time to develop the narrative:

1. **Who is the main character experiencing this problem?** (Name, age, role, context)
2. **Describe the problem or challenge the main character is facing.**
3. **Describe the "Oh Crap" moment where the problem creates a major issue.**
4. **How is the solution introduced to the main character?**
5. **Describe the main character using the solution and experiencing an "Aha" moment.**
6. **What is life like for the main character after using the solution?**
7. **Do you have any specific visual style or rendering instructions?** (Default: fat-marker sharpie sketches, minimal and monochrome)

---

### Step 3: Write the 6-Frame Narrative

```markdown
## Generated 6-Frame Storyline

**Frame 1: Introducing the Main Character**
- [Insert description of the main character, their setting, and context]
- Example: "Sarah, 35, is a freelance graphic designer juggling 10 client projects from her home office"

**Frame 2: The Problem Emerges**
- [Describe the main character's challenge and how it affects their life]
- Example: "She's drowning in invoice tracking—8 hours per month chasing late payments"

**Frame 3: The 'Oh Crap' Moment**
- [Highlight the escalation of the problem into a major issue]
- Example: "A major client's payment is 2 weeks overdue. Sarah realizes she forgot to follow up."

**Frame 4: The Solution Appears**
- [Explain how the solution is introduced and the main character's initial reaction]
- Example: "Sarah discovers SmartInvoice, a tool that automatically sends payment reminders."

**Frame 5: The 'Aha' Moment**
- [Show the main character using the solution and experiencing a breakthrough]
- Example: "Two days later, Sarah receives a notification: 'Client XYZ just paid!'"

**Frame 6: Life After the Solution**
- [Describe the resolution and how life improves after overcoming the problem]
- Example: "Sarah now spends 30 minutes per month on invoicing instead of 8 hours."

**Visual Style**
- Default: fat-marker, sharpie-style sketches—minimal, monochrome, hand-drawn feel
```

---

### Step 4: Visualize Each Frame

For each frame, describe the visual:

**Frame 1: Main Character**
- **Visual:** Character at their setting, establishing context
- **Mood:** Neutral, busy

**Frame 2: The Problem Emerges**
- **Visual:** Character confronting the challenge
- **Mood:** Overwhelmed, frustrated

**Frame 3: The 'Oh Crap' Moment**
- **Visual:** The problem reaching a peak — notification, deadline, crisis
- **Mood:** Anxious, urgent

**Frame 4: The Solution Appears**
- **Visual:** Character discovering the product/feature
- **Mood:** Curious, hopeful

**Frame 5: The 'Aha' Moment**
- **Visual:** Character experiencing the breakthrough
- **Mood:** Joy, relief, empowerment

**Frame 6: Life After the Solution**
- **Visual:** Character in the improved state
- **Mood:** Peaceful, balanced, successful

---

### Step 5: Test the Storyboard

Ask these questions:

1. **Is the main character relatable?** Would your target persona recognize themselves?
2. **Is the problem visceral?** Do people *feel* the frustration in Frame 2-3?
3. **Is the "Oh Crap" moment real?** Does it escalate the problem authentically?
4. **Is the solution introduction natural?** Or does it feel forced/contrived?
5. **Is the "Aha" moment believable?** Can users imagine experiencing this?
6. **Is the "after" state aspirational?** Would users want this outcome?

If any answer is "no," revise.

---

## Common Pitfalls

### Pitfall 1: Generic Persona
**Fix:** Get specific: name, age, role, context, daily habits.

### Pitfall 2: Weak Problem
**Fix:** Make it visceral with real consequences (time lost, money, anxiety).

### Pitfall 3: Forced Solution Introduction
**Fix:** Show realistic discovery — forum recommendation, colleague mention, ad.

### Pitfall 4: Feature-Centric "Aha" Moment
**Fix:** Focus on outcome, not features: "She got paid!" not "She saw the dashboard."

### Pitfall 5: Vague "After" State
**Fix:** Be specific with time, numbers, emotional state.

---

## References

### Related Skills
- `skills/proto-persona/SKILL.md` — Defines the main character
- `skills/problem-statement/SKILL.md` — Frames the problem for Frame 2-3
- `skills/positioning-statement/SKILL.md` — Informs the solution introduction in Frame 4
- `skills/jobs-to-be-done/SKILL.md` — Informs the desired outcome in Frame 6

### External Frameworks
- Joseph Campbell, *The Hero's Journey* (1949)
- Pixar's story rules — "Once upon a time... Every day... Until one day..."
- Donald Miller, *Building a StoryBrand* (2017)

---

**Skill type:** Component
**Dependencies:** References `skills/proto-persona/SKILL.md`, `skills/problem-statement/SKILL.md`, `skills/positioning-statement/SKILL.md`, `skills/jobs-to-be-done/SKILL.md`
