import type { IngredientRow, NutritionFacts } from "@/types";

type EdamamNutrient = {
  label: string;
  quantity: number;
  unit: string;
};

type EdamamResponse = {
  calories?: number;
  totalNutrients?: Record<string, EdamamNutrient>;
  totalWeight?: number;
};

function pick(
  nutrients: Record<string, EdamamNutrient> | undefined,
  key: string
): number {
  const n = nutrients?.[key];
  if (!n || typeof n.quantity !== "number") return 0;
  return n.quantity;
}

/** Parses Edamam Nutrition Analysis API response into per-serving facts. */
export function edamamResponseToPerServing(
  data: EdamamResponse,
  servings: number
): NutritionFacts {
  const safeServings = Math.max(1, servings);
  const nutrients = data.totalNutrients ?? {};
  const kcal =
    typeof data.calories === "number"
      ? data.calories
      : pick(nutrients, "ENERC_KCAL");

  return {
    calories: Math.round(kcal / safeServings),
    protein: Math.round((pick(nutrients, "PROCNT") / safeServings) * 10) / 10,
    carbs: Math.round((pick(nutrients, "CHOCDF") / safeServings) * 10) / 10,
    fat: Math.round((pick(nutrients, "FAT") / safeServings) * 10) / 10,
    fiber: Math.round((pick(nutrients, "FIBTG") / safeServings) * 10) / 10,
    sugar: Math.round((pick(nutrients, "SUGAR") / safeServings) * 10) / 10,
    sodium: Math.round(pick(nutrients, "NA") / safeServings),
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
  return edamamResponseToPerServing(data, servings);
}
