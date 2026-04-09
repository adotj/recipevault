import type { IngredientRow, NutritionFacts } from "@/types";
import { analyzeNutritionWithEdamam } from "@/lib/edamam";
import { analyzeNutritionWithSpoonacular } from "@/lib/spoonacular";

/** Tries Edamam, then optional Spoonacular hook (stub). */
export async function analyzeNutritionForRecipe(
  title: string,
  ingredients: IngredientRow[],
  servings: number
): Promise<NutritionFacts | null> {
  const ed = await analyzeNutritionWithEdamam(title, ingredients, servings);
  if (ed) return ed;
  return analyzeNutritionWithSpoonacular(title, ingredients, servings);
}
