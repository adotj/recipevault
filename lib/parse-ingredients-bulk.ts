import type { IngredientRow } from "@/types";

/**
 * Split quantity (leading amount + optional unit) from ingredient name.
 * Handles LLM-style lines: bullets, numbering, "2 cups flour", "½ tsp salt", etc.
 */
const QTY_WITH_UNIT = new RegExp(
  "^((?:\\d+(?:\\.\\d+)?|\\d+\\s*/\\s*\\d+|[¼½¾⅓⅔])(?:\\s*[-\\u2013]\\s*(?:\\d+(?:\\.\\d+)?|\\d+\\s*/\\s*\\d+))?(?:\\s*(?:cups?|cup|tbsp|tsp|tablespoons?|teaspoons?|ounces?|oz|grams?|g|kg|mg|ml|lb|lbs|pounds?|cloves?|can|packages?|pkg|stick|sticks|slice|slices|bunch|sprigs?|medium|large|small|whole|pinch|dash|handful)\\b)?)\\s+)(.+)$",
  "i"
);

const QTY_NUMBER_ONLY =
  /^((?:\d+(?:\.\d+)?|\d+\s*\/\s*\d+|[¼½¾⅓⅔])(?:\s*[-–]\s*(?:\d+(?:\.\d+)?|\d+\s*\/\s*\d+))?\s+)(.+)$/;

function stripListMarkers(line: string): string {
  return line
    .trim()
    .replace(/\*\*/g, "")
    .replace(/^[\s>*_~`]+/, "")
    .replace(/^[\u2022\u2023\u25E6\u2043•\-*]+\s*/, "")
    .replace(/^\d+[\.)]\s+/, "")
    .replace(/^\[[\sxX]\]\s*/, "");
}

/** Pipe/table row: "| 2 cups | flour |" or "2 cups | flour" */
function tryParseTableRow(line: string): IngredientRow | null {
  if (!line.includes("|")) return null;
  const parts = line
    .split("|")
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
  if (parts.length < 2) return null;
  const [a, b] = [parts[0], parts[1]];
  if (/^quantity|amount|measure/i.test(a) && /^ingredient|item|name/i.test(b)) {
    return null;
  }
  if (/^\d/.test(a) || /^(?:\d+\s*\/\s*\d+|[¼½¾])/i.test(a)) {
    return { quantity: a, name: parts.slice(1).join(" ").trim() };
  }
  return { quantity: "", name: parts.join(" ").trim() };
}

function parseSingleLine(raw: string): IngredientRow {
  const line = stripListMarkers(raw);
  if (!line) return { name: "", quantity: "" };

  const table = tryParseTableRow(line);
  if (table && (table.name || table.quantity)) return table;

  const tabParts = line.split("\t").map((p) => p.trim());
  if (tabParts.length >= 2 && tabParts[0] && tabParts[1]) {
    const [q, ...rest] = tabParts;
    if (/^\d/.test(q) || /^(?:\d+\s*\/\s*\d+|[¼½¾])/i.test(q)) {
      return { quantity: q, name: rest.join(" ").trim() };
    }
    return { quantity: q, name: rest.join(" ").trim() };
  }

  let m = line.match(QTY_WITH_UNIT);
  if (m) {
    return { quantity: m[1].trim(), name: m[2].trim() };
  }
  m = line.match(QTY_NUMBER_ONLY);
  if (m) {
    return { quantity: m[1].trim(), name: m[2].trim() };
  }

  return { quantity: "", name: line };
}

/**
 * Parse multi-line text (from LLM, notes, etc.) into ingredient rows.
 * One ingredient per line; blank lines skipped.
 */
export function parseIngredientsFromBulkPaste(text: string): IngredientRow[] {
  const lines = text.split(/\r?\n/);
  const out: IngredientRow[] = [];
  for (const raw of lines) {
    const row = parseSingleLine(raw);
    if (!row.name.trim() && !row.quantity.trim()) continue;
    if (!row.name.trim() && row.quantity.trim()) {
      out.push({ name: row.quantity.trim(), quantity: "" });
      continue;
    }
    out.push(row);
  }
  return out;
}
