import { z } from "zod";
import { MEAL_TYPES, type MealType } from "@/types";

const mealEnum = MEAL_TYPES as unknown as [MealType, ...MealType[]];
const mealTypeSchema = z.enum(mealEnum);

export const ingredientSchema = z.object({
  name: z.string().min(1, "Ingredient name required"),
  quantity: z.string().optional().default(""),
});

export const nutritionSchema = z.object({
  calories: z.coerce.number().min(0),
  protein: z.coerce.number().min(0),
  carbs: z.coerce.number().min(0),
  fat: z.coerce.number().min(0),
  fiber: z.coerce.number().min(0),
  sugar: z.coerce.number().min(0),
  sodium: z.coerce.number().min(0),
});

const optionalMinutes = z.preprocess((val) => {
  if (val === "" || val === undefined || val === null) return null;
  const n = typeof val === "number" ? val : Number(val);
  if (Number.isNaN(n)) return null;
  return n;
}, z.number().int().min(0).nullable());

export const recipeFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().optional().nullable(),
  meal_types: z.array(mealTypeSchema).min(1, "Pick at least one meal type"),
  ingredients: z.array(ingredientSchema).min(1, "Add at least one ingredient"),
  instructions: z.string().optional().nullable(),
  prep_time: optionalMinutes.optional(),
  cook_time: optionalMinutes.optional(),
  servings: z.coerce.number().int().min(1).max(100),
  nutrition: nutritionSchema.nullable().optional(),
  image_url: z
    .union([z.string().url(), z.literal(""), z.null()])
    .optional()
    .transform((v) => (v === "" || v == null ? null : v)),
  tags: z.array(z.string()),
  notes: z.string().optional().nullable(),
  favorite: z.boolean().optional().default(false),
});

export type RecipeFormValues = z.infer<typeof recipeFormSchema>;

export const cookLogSchema = z.object({
  recipe_id: z.string().uuid(),
  cooked_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  rating: z.coerce.number().int().min(1).max(5).optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const mealPlanUpdateSchema = z.object({
  plan_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  breakfast_recipe_id: z.string().uuid().nullable().optional(),
  lunch_recipe_id: z.string().uuid().nullable().optional(),
  dinner_recipe_id: z.string().uuid().nullable().optional(),
  snack_recipe_id: z.string().uuid().nullable().optional(),
  dessert_recipe_id: z.string().uuid().nullable().optional(),
});
