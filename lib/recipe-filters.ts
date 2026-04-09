import type { Recipe, SortOption } from "@/types";
import { MEAL_TYPES } from "@/types";

const MEAL_SET = new Set<string>(MEAL_TYPES);

export function filterRecipesBySearch(recipes: Recipe[], q: string) {
  const s = q.trim().toLowerCase();
  if (!s) return recipes;
  return recipes.filter((r) => {
    const inTitle = r.title.toLowerCase().includes(s);
    const inTags = r.tags.some((t) => t.toLowerCase().includes(s));
    const inIngr = r.ingredients.some(
      (i) =>
        i.name.toLowerCase().includes(s) ||
        i.quantity.toLowerCase().includes(s)
    );
    return inTitle || inTags || inIngr;
  });
}

export function filterByMealType(recipes: Recipe[], meal: string) {
  if (meal === "All" || !meal) return recipes;
  if (!MEAL_SET.has(meal)) return recipes;
  return recipes.filter((r) => r.meal_types.includes(meal as (typeof MEAL_TYPES)[number]));
}

export function sortRecipes(recipes: Recipe[], sortBy: SortOption) {
  const copy = [...recipes];
  switch (sortBy) {
    case "recent":
      return copy.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    case "most_cooked":
      return copy.sort((a, b) => b.cook_count - a.cook_count);
    case "az":
      return copy.sort((a, b) => a.title.localeCompare(b.title));
    case "high_protein":
      return copy.sort(
        (a, b) => (b.nutrition?.protein ?? 0) - (a.nutrition?.protein ?? 0)
      );
    case "low_cal":
      return copy.sort(
        (a, b) => (a.nutrition?.calories ?? 1e9) - (b.nutrition?.calories ?? 1e9)
      );
    default:
      return copy;
  }
}

/** Nutrition totals for a list of recipes (full recipe, not per serving scaled). */
export function sumNutrition(recipes: (Recipe | null | undefined)[]) {
  const base = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  };
  for (const r of recipes) {
    const n = r?.nutrition;
    if (!n) continue;
    base.calories += n.calories;
    base.protein += n.protein;
    base.carbs += n.carbs;
    base.fat += n.fat;
  }
  return base;
}
