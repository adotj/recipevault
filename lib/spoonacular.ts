import type { IngredientRow, NutritionFacts } from "@/types";

/**
 * Spoonacular does not offer a direct Edamam-style “free-text ingredient list → full recipe nutrition”
 * call in the public API the way Nutrition Analysis does. A robust fallback would chain ingredient
 * search + per-ingredient nutrition (many requests). For RecipeVault, Edamam is the primary path;
 * this hook is reserved for future expansion or your own proxy.
 */
export async function analyzeNutritionWithSpoonacular(
  _title: string,
  _ingredients: IngredientRow[],
  _servings: number
): Promise<NutritionFacts | null> {
  const key = process.env.SPOONACULAR_API_KEY;
  if (!key) return null;
  void _title;
  void _ingredients;
  void _servings;
  void key;
  return null;
}
