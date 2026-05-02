/**
 * Backend prep: normalize free-text item labels before grocery search / catalog matching.
 * @param {string} raw
 * @returns {string}
 */
export function normalizeGroceryItemInput(raw) {
  if (typeof raw !== "string") return "";
  return raw.trim().replace(/\s+/g, " ").toLowerCase();
}

/**
 * Backend prep: split a pasted list into normalized strings for batch search/compare.
 * @param {string} raw
 * @returns {string[]}
 */
export function parseGroceryListPaste(raw) {
  if (typeof raw !== "string") return [];
  return raw
    .split(/[\n,;]+/)
    .map((line) => normalizeGroceryItemInput(line))
    .filter(Boolean);
}
