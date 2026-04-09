import type { IngredientRow, NutritionFacts } from "@/types";

type EdamamResponse = {
  calories?: unknown;
  totalNutrients?: Record<string, unknown>;
  totalWeight?: number;
};

/** Edamam may return each tag as `{ quantity, ... }` or as an array of those objects. */
function nutrientEntryQuantity(entry: unknown): number {
  if (entry == null) return 0;
  if (Array.isArray(entry)) {
    let sum = 0;
    for (const item of entry) {
      sum += nutrientEntryQuantity(item);
    }
    return sum;
  }
  if (typeof entry === "object" && "quantity" in entry) {
    const q = (entry as { quantity: unknown }).quantity;
    if (typeof q === "number" && !Number.isNaN(q)) return q;
    if (typeof q === "string") {
      const n = Number(q);
      return Number.isNaN(n) ? 0 : n;
    }
  }
  return 0;
}

function pickNutrient(
  nutrients: Record<string, unknown> | undefined,
  key: string
): number {
  return nutrientEntryQuantity(nutrients?.[key]);
}

function readTotalCalories(
  raw: unknown,
  nutrients: Record<string, unknown> | undefined
): number {
  if (typeof raw === "number" && !Number.isNaN(raw)) return raw;
  if (typeof raw === "string") {
    const n = Number(raw);
    if (!Number.isNaN(n)) return n;
  }
  return pickNutrient(nutrients, "ENERC_KCAL");
}

/** Parses Edamam Nutrition Analysis API response into per-serving facts. */
export function edamamResponseToPerServing(
  data: EdamamResponse,
  servings: number
): NutritionFacts {
  const safeServings = Math.max(1, servings);
  const nutrients = data.totalNutrients ?? {};
  const kcal = readTotalCalories(data.calories, nutrients);

  return {
    calories: Math.round(kcal / safeServings),
    protein:
      Math.round((pickNutrient(nutrients, "PROCNT") / safeServings) * 10) / 10,
    carbs:
      Math.round((pickNutrient(nutrients, "CHOCDF") / safeServings) * 10) / 10,
    fat: Math.round((pickNutrient(nutrients, "FAT") / safeServings) * 10) / 10,
    fiber:
      Math.round((pickNutrient(nutrients, "FIBTG") / safeServings) * 10) / 10,
    sugar:
      Math.round((pickNutrient(nutrients, "SUGAR") / safeServings) * 10) / 10,
    sodium: Math.round(pickNutrient(nutrients, "NA") / safeServings),
  };
}

/**
 * Calls Edamam Nutrition Analysis API with natural-language ingredient lines.
 */
export async function analyzeNutritionWithEdamam(
  title: string,
  ingredients: IngredientRow[],
  servings: number
): Promise<NutritionFacts | null> {
  const appId = process.env.EDAMAM_APP_ID;
  const appKey = process.env.EDAMAM_APP_KEY;
  if (!appId || !appKey) return null;

  const ingr = ingredients
    .filter((i) => i.name.trim())
    .map((i) => {
      const q = i.quantity?.trim();
      return q ? `${q} ${i.name.trim()}` : i.name.trim();
    });

  if (ingr.length === 0) return null;

  const url = new URL("https://api.edamam.com/api/nutrition-details");
  url.searchParams.set("app_id", appId);
  url.searchParams.set("app_key", appKey);

  const res = await fetch(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: title || "Recipe",
      ingr,
    }),
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("[edamam]", res.status, text);
    return null;
  }

  const data = (await res.json()) as EdamamResponse;
  const facts = edamamResponseToPerServing(data, servings);
  const sumMacros =
    facts.calories +
    facts.protein +
    facts.carbs +
    facts.fat +
    facts.fiber +
    facts.sugar +
    facts.sodium;
  if (sumMacros === 0) {
    console.error(
      "[edamam] Parsed all-zero nutrition from response; check API credentials (Nutrition Analysis app) and response shape.",
      JSON.stringify(data).slice(0, 500)
    );
    return null;
  }
  return facts;
}
