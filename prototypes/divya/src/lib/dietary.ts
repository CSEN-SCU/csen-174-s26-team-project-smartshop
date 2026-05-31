// Dietary restriction rules and a deterministic conflict checker.
// This runs independently of the AI so unsafe recommendations are caught
// even if the model ignores instructions (defense in depth).

export type DietaryRule = {
  id: string;
  label: string;
  // Whole-word keywords that violate this restriction.
  forbidden: string[];
};

export const DIETARY_RULES: DietaryRule[] = [
  {
    id: "vegan",
    label: "Vegan",
    forbidden: [
      "meat", "beef", "pork", "chicken", "turkey", "fish", "seafood", "shrimp",
      "egg", "eggs", "milk", "dairy", "cheese", "yogurt", "butter", "cream",
      "honey", "gelatin", "lard",
    ],
  },
  {
    id: "vegetarian",
    label: "Vegetarian",
    forbidden: [
      "meat", "beef", "pork", "chicken", "turkey", "fish", "seafood",
      "shrimp", "bacon", "ham", "gelatin", "lard",
    ],
  },
  {
    id: "gluten-free",
    label: "Gluten-free",
    forbidden: [
      "bread", "pasta", "wheat", "flour", "barley", "rye",
      "cracker", "crackers", "cereal", "tortilla", "bagel", "noodles",
    ],
  },
  {
    id: "dairy-free",
    label: "Dairy-free",
    forbidden: ["milk", "cheese", "yogurt", "butter", "cream", "dairy"],
  },
  {
    id: "nut-free",
    label: "Nut allergy",
    forbidden: [
      "nut", "nuts", "peanut", "peanuts", "almond", "almonds", "cashew",
      "cashews", "walnut", "walnuts", "pecan", "pecans", "hazelnut", "pistachio",
    ],
  },
  {
    id: "shellfish-free",
    label: "Shellfish allergy",
    forbidden: ["shrimp", "crab", "lobster", "shellfish", "clam", "clams", "oyster", "oysters", "scallop", "scallops"],
  },
  {
    id: "egg-free",
    label: "Egg-free",
    forbidden: ["egg", "eggs", "mayonnaise", "mayo"],
  },
  {
    id: "halal",
    label: "Halal",
    forbidden: ["pork", "bacon", "ham", "alcohol", "wine", "beer", "gelatin", "lard"],
  },
  {
    id: "kosher",
    label: "Kosher",
    forbidden: ["pork", "bacon", "ham", "shellfish", "shrimp", "crab", "lobster"],
  },
];

// Lightweight list for UI rendering (no logic).
export const DIETARY_OPTIONS = DIETARY_RULES.map(({ id, label }) => ({ id, label }));

export type DietaryConflict = { item: string; restriction: string };

// Phrases that, when present in an item, mean it is actually compliant with a
// restriction even though it contains a forbidden keyword. e.g. "almond milk"
// contains "milk" but is vegan/dairy-free; "gluten-free bread" contains "bread"
// but is gluten-free. Keyed by restriction id.
const COMPLIANT_QUALIFIERS: Record<string, string[]> = {
  vegan: [
    "vegan", "plant-based", "plant based", "non-dairy", "nondairy",
    "dairy-free", "dairy free", "almond", "soy", "soya", "oat", "coconut",
    "cashew", "hemp", "pea protein", "rice milk",
    "peanut", "sunflower", "tahini", "sesame",
  ],
  vegetarian: ["meatless", "meat-free", "meat free", "plant-based", "plant based", "vegan", "tofu"],
  "dairy-free": [
    "dairy-free", "dairy free", "non-dairy", "nondairy", "vegan",
    "plant-based", "plant based", "almond", "soy", "soya", "oat",
    "coconut", "cashew", "hemp", "rice milk",
    "peanut", "sunflower", "tahini", "sesame",
  ],
  "gluten-free": ["gluten-free", "gluten free", "gluten free"],
};

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Whole-word match so "coconut" does not trip the "nut" keyword, etc.
function itemMatchesKeyword(item: string, keyword: string): boolean {
  return new RegExp(`\\b${escapeRegex(keyword)}\\b`, "i").test(item);
}

// True when the item explicitly signals it complies with the restriction,
// e.g. "almond milk" for vegan/dairy-free, "gluten-free bread" for gluten-free.
function itemIsExplicitlyCompliant(item: string, ruleId: string): boolean {
  const qualifiers = COMPLIANT_QUALIFIERS[ruleId];
  if (!qualifiers) return false;
  const lower = item.toLowerCase();
  return qualifiers.some((q) => lower.includes(q.toLowerCase()));
}

/**
 * Returns every (item, restriction) pair where the item appears to violate a
 * selected dietary restriction. Only restriction ids present in DIETARY_RULES
 * are checked; free-text restrictions are handled by the AI prompt, not here.
 */
export function findDietaryConflicts(
  items: string[],
  restrictionIds: string[]
): DietaryConflict[] {
  const rules = DIETARY_RULES.filter((r) => restrictionIds.includes(r.id));
  if (rules.length === 0) return [];

  const conflicts: DietaryConflict[] = [];
  for (const rawItem of items) {
    const item = String(rawItem || "").trim();
    if (!item) continue;
    for (const rule of rules) {
      // Skip items that explicitly declare compliance (e.g. "almond milk" for vegan).
      if (itemIsExplicitlyCompliant(item, rule.id)) continue;
      if (rule.forbidden.some((kw) => itemMatchesKeyword(item, kw))) {
        conflicts.push({ item, restriction: rule.label });
      }
    }
  }
  return conflicts;
}

/**
 * Builds a system-prompt instruction telling the model to honor the shopper's
 * restrictions. Accepts known restriction ids plus optional free-text notes.
 */
export function buildDietaryInstruction(
  restrictionIds: string[],
  freeText = ""
): string {
  const labels = DIETARY_RULES.filter((r) => restrictionIds.includes(r.id)).map(
    (r) => r.label
  );
  const all = [...labels, freeText.trim()].filter(Boolean);
  if (all.length === 0) return "";

  return (
    `\n\nIMPORTANT DIETARY SAFETY: The shopper has these dietary restrictions: ${all.join(", ")}. ` +
    "Only suggest SPECIFIC products that comply with every one of these restrictions. " +
    "For a restricted category, recommend specific compliant brands by name — for example, gluten-free shoppers get gluten-free bread brands (e.g. Canyon Bakehouse, Schar), and vegan shoppers get plant-based options (e.g. Silk Almond Milk, Oatly Oat Milk) instead of dairy milk. " +
    "Never suggest a product that violates a restriction. " +
    "When you are unsure whether a specific product is compliant, choose one that is clearly labeled as compliant."
  );
}

/**
 * Deterministic, user-facing safety note appended to the reply when any product
 * the assistant suggested appears to violate a restriction. This scans the
 * model's OUTPUT (not the user's request) so it only fires when the AI itself
 * recommends something unsafe — a true safety-net failure.
 */
export function buildDietaryWarning(conflicts: DietaryConflict[]): string {
  if (conflicts.length === 0) return "";
  const unique = Array.from(new Set(conflicts.map((c) => c.restriction)));
  return (
    "\n\n⚠️ Double-check the label on the items above for: " +
    `${unique.join(", ")}.`
  );
}
