/**
 * Unit tests for the dietary restriction safety logic (owned by Divya).
 * Covers deterministic conflict detection and prompt/warning builders.
 */

import {
  DIETARY_OPTIONS,
  DIETARY_RULES,
  findDietaryConflicts,
  buildDietaryInstruction,
  buildDietaryWarning,
} from "./dietary";

describe("findDietaryConflicts", () => {
  it("flags milk for a vegan shopper", () => {
    const conflicts = findDietaryConflicts(["milk", "bananas"], ["vegan"]);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].item).toBe("milk");
    expect(conflicts[0].restriction).toBe("Vegan");
  });

  it("flags bread for a gluten-free shopper", () => {
    const conflicts = findDietaryConflicts(["bread"], ["gluten-free"]);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].restriction).toBe("Gluten-free");
  });

  it("returns no conflicts when no restrictions are selected", () => {
    expect(findDietaryConflicts(["milk", "bacon"], [])).toEqual([]);
  });

  it("returns no conflicts for compliant items", () => {
    expect(findDietaryConflicts(["rice", "apples"], ["vegan"])).toEqual([]);
  });

  it("does not false-positive on substrings (coconut is not a nut)", () => {
    expect(findDietaryConflicts(["coconut water"], ["nut-free"])).toEqual([]);
  });

  it("treats almond milk as vegan-compliant (not a conflict)", () => {
    expect(findDietaryConflicts(["almond milk"], ["vegan"])).toEqual([]);
  });

  it("treats soy/oat milk as dairy-free-compliant", () => {
    expect(findDietaryConflicts(["soy milk", "oat milk"], ["dairy-free"])).toEqual([]);
  });

  it("still flags regular milk for vegan", () => {
    expect(findDietaryConflicts(["whole milk"], ["vegan"])).toHaveLength(1);
  });

  it("still flags almond milk for a nut allergy", () => {
    const conflicts = findDietaryConflicts(["almond milk"], ["nut-free"]);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].restriction).toBe("Nut allergy");
  });

  it("treats gluten-free bread as gluten-free-compliant", () => {
    expect(findDietaryConflicts(["gluten-free bread"], ["gluten-free"])).toEqual([]);
  });

  it("treats peanut/almond butter as vegan-compliant (not dairy butter)", () => {
    expect(
      findDietaryConflicts(
        ["Crazy Richard's Peanut Butter", "Justin's Almond Butter"],
        ["vegan"]
      )
    ).toEqual([]);
  });

  it("still flags regular dairy butter for vegan", () => {
    expect(findDietaryConflicts(["Land O'Lakes Salted Butter"], ["vegan"])).toHaveLength(1);
  });

  it("matches keywords case-insensitively", () => {
    const conflicts = findDietaryConflicts(["Whole Milk"], ["dairy-free"]);
    expect(conflicts).toHaveLength(1);
  });

  it("reports one conflict per matching restriction", () => {
    const conflicts = findDietaryConflicts(["milk"], ["vegan", "dairy-free"]);
    expect(conflicts).toHaveLength(2);
  });

  it("ignores unknown restriction ids", () => {
    expect(findDietaryConflicts(["milk"], ["made-up-diet"])).toEqual([]);
  });
});

describe("buildDietaryInstruction", () => {
  it("returns an empty string when there are no restrictions", () => {
    expect(buildDietaryInstruction([], "")).toBe("");
  });

  it("includes selected restriction labels", () => {
    const text = buildDietaryInstruction(["vegan"], "");
    expect(text).toContain("Vegan");
    expect(text).toContain("dietary restrictions");
  });

  it("includes free-text notes", () => {
    const text = buildDietaryInstruction([], "no cilantro");
    expect(text).toContain("no cilantro");
  });
});

describe("buildDietaryWarning", () => {
  it("returns empty string with no conflicts", () => {
    expect(buildDietaryWarning([])).toBe("");
  });

  it("names the violated restriction", () => {
    const warning = buildDietaryWarning([
      { item: "Horizon Whole Milk", restriction: "Vegan" },
    ]);
    expect(warning).toContain("Vegan");
  });

  it("deduplicates repeated restrictions", () => {
    const warning = buildDietaryWarning([
      { item: "milk", restriction: "Vegan" },
      { item: "cheese", restriction: "Vegan" },
    ]);
    expect(warning.match(/Vegan/g)).toHaveLength(1);
  });
});

describe("DIETARY_OPTIONS", () => {
  it("mirrors the rule set with id and label only", () => {
    expect(DIETARY_OPTIONS).toHaveLength(DIETARY_RULES.length);
    for (const opt of DIETARY_OPTIONS) {
      expect(Object.keys(opt).sort()).toEqual(["id", "label"]);
    }
  });
});
