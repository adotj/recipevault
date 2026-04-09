import type { IngredientRow, MealType, NutritionFacts, Recipe } from "@/types";
import { MEAL_TYPES } from "@/types";

function isMealType(v: string): v is MealType {
  return (MEAL_TYPES as readonly string[]).includes(v);
}

export function parseNutrition(raw: unknown): NutritionFacts | null {
  if (!raw || typeof raw !== "object") return null;
  const n = raw as Record<string, unknown>;
  const nums = [
    "calories",
    "protein",
    "carbs",
    "fat",
    "fiber",
    "sugar",
    "sodium",
  ] as const;
  const out: Partial<NutritionFacts> = {};
  for (const k of nums) {
    const v = n[k];
    if (typeof v !== "number" || Number.isNaN(v)) return null;
    out[k] = v;
  }
  return out as NutritionFacts;
}

export function mapRecipeRow(row: Record<string, unknown>): Recipe {
  const meal_types = (row.meal_types as string[] | null)?.filter(isMealType) ?? [];
  const ingredientsRaw = row.ingredients;
  const ingredients: IngredientRow[] = Array.isArray(ingredientsRaw)
    ? ingredientsRaw.map((item) => {
        const o = item as { name?: string; quantity?: string };
        return {
          name: String(o?.name ?? ""),
          quantity: String(o?.quantity ?? ""),
        };
      })
    : [];

  return {
    id: String(row.id),
    user_id: String(row.user_id),
    title: String(row.title ?? ""),
    description: row.description != null ? String(row.description) : null,
    meal_types,
    ingredients,
    instructions: row.instructions != null ? String(row.instructions) : null,
    prep_time:
      row.prep_time != null && row.prep_time !== ""
        ? Number(row.prep_time)
        : null,
    cook_time:
      row.cook_time != null && row.cook_time !== ""
        ? Number(row.cook_time)
        : null,
    servings: Number(row.servings ?? 1),
    nutrition: parseNutrition(row.nutrition),
    image_url: row.image_url != null ? String(row.image_url) : null,
    tags: Array.isArray(row.tags) ? (row.tags as string[]).map(String) : [],
    notes: row.notes != null ? String(row.notes) : null,
    favorite: Boolean(row.favorite),
    cook_count: Number(row.cook_count ?? 0),
    last_cooked_at:
      row.last_cooked_at != null ? String(row.last_cooked_at) : null,
    created_at: String(row.created_at ?? ""),
    updated_at: String(row.updated_at ?? ""),
  };
}
