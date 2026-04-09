export const MEAL_TYPES = [
  "Breakfast",
  "Lunch",
  "Dinner",
  "Snack",
  "Dessert",
] as const;

export type MealType = (typeof MEAL_TYPES)[number];

export type IngredientRow = {
  name: string;
  quantity: string;
};

/** Nutrition values per serving */
export type NutritionFacts = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
};

export type Recipe = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  meal_types: MealType[];
  ingredients: IngredientRow[];
  instructions: string | null;
  prep_time: number | null;
  cook_time: number | null;
  servings: number;
  nutrition: NutritionFacts | null;
  image_url: string | null;
  tags: string[];
  notes: string | null;
  favorite: boolean;
  cook_count: number;
  last_cooked_at: string | null;
  created_at: string;
  updated_at: string;
};

export type CookedLog = {
  id: string;
  user_id: string;
  recipe_id: string;
  cooked_at: string;
  rating: number | null;
  notes: string | null;
  created_at: string;
};

export type MealPlanSlot = "breakfast" | "lunch" | "dinner" | "snack" | "dessert";

export type MealPlanRow = {
  id: string;
  user_id: string;
  plan_date: string;
  breakfast_recipe_id: string | null;
  lunch_recipe_id: string | null;
  dinner_recipe_id: string | null;
  snack_recipe_id: string | null;
  dessert_recipe_id: string | null;
};

export type SortOption =
  | "recent"
  | "most_cooked"
  | "az"
  | "high_protein"
  | "low_cal";
