"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getHouseholdContext } from "@/lib/vault-household";
import { mapRecipeRow } from "@/lib/mappers";
import { analyzeNutritionForRecipe } from "@/lib/nutrition-analyze";
import {
  recipeFormSchema,
  type RecipeFormValues,
} from "@/lib/validations/recipe";
import type { NutritionFacts, Recipe } from "@/types";

async function requireHousehold() {
  const ctx = await getHouseholdContext();
  if (!ctx) {
    throw new Error("Vault session missing. Open /gate and enter the household passphrase.");
  }
  return ctx;
}

function toDbPayload(values: RecipeFormValues, nutrition: NutritionFacts | null) {
  return {
    title: values.title,
    description: values.description ?? null,
    meal_types: values.meal_types,
    ingredients: values.ingredients,
    instructions: values.instructions ?? null,
    prep_time: values.prep_time ?? null,
    cook_time: values.cook_time ?? null,
    servings: values.servings,
    nutrition,
    image_url: values.image_url ?? null,
    tags: values.tags,
    notes: values.notes ?? null,
    favorite: values.favorite ?? false,
  };
}

export async function createRecipe(
  raw: unknown,
  options: { recalculateNutrition?: boolean } = {}
): Promise<{ recipe?: Recipe; error?: string }> {
  const parsed = recipeFormSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.flatten().formErrors.join(", ") };
  }
  const values = parsed.data;
  const { recalculateNutrition = true } = options;

  try {
    const { supabase, userId } = await requireHousehold();
    let nutrition: NutritionFacts | null;
    if (recalculateNutrition) {
      nutrition = await analyzeNutritionForRecipe(
        values.title,
        values.ingredients,
        values.servings
      );
    } else {
      nutrition = values.nutrition ?? null;
    }

    const payload = { ...toDbPayload(values, nutrition), user_id: userId };
    const { data, error } = await supabase
      .from("recipes")
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    revalidatePath("/");
    revalidatePath("/recipes");
    return { recipe: mapRecipeRow(data as Record<string, unknown>) };
  } catch (e) {
    console.error(e);
    return { error: e instanceof Error ? e.message : "Failed to create recipe" };
  }
}

export async function updateRecipe(
  id: string,
  raw: unknown,
  options: { recalculateNutrition?: boolean } = {}
): Promise<{ recipe?: Recipe; error?: string }> {
  const parsed = recipeFormSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.flatten().formErrors.join(", ") };
  }
  const values = parsed.data;
  const { recalculateNutrition = true } = options;

  try {
    const { supabase, userId } = await requireHousehold();
    let nutrition: NutritionFacts | null;
    let usedAuto = false;
    if (recalculateNutrition) {
      const auto = await analyzeNutritionForRecipe(
        values.title,
        values.ingredients,
        values.servings
      );
      if (auto) {
        nutrition = auto;
        usedAuto = true;
      } else {
        nutrition = values.nutrition ?? null;
      }
    } else {
      nutrition = values.nutrition ?? null;
    }

    const payload = toDbPayload(values, nutrition) as Record<string, unknown>;
    // If auto-recalc was requested but failed, don't wipe existing DB nutrition.
    if (recalculateNutrition && !usedAuto) delete payload.nutrition;
    const { data, error } = await supabase
      .from("recipes")
      .update(payload)
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw error;
    revalidatePath("/");
    revalidatePath("/recipes");
    revalidatePath(`/recipes/${id}`);
    return { recipe: mapRecipeRow(data as Record<string, unknown>) };
  } catch (e) {
    console.error(e);
    return { error: e instanceof Error ? e.message : "Failed to update recipe" };
  }
}

export async function deleteRecipe(id: string) {
  const { supabase, userId } = await requireHousehold();
  const { error } = await supabase
    .from("recipes")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw error;
  revalidatePath("/");
  revalidatePath("/recipes");
}

export async function duplicateRecipe(id: string) {
  const { supabase, userId } = await requireHousehold();
  const { data: src, error: fetchErr } = await supabase
    .from("recipes")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .single();
  if (fetchErr || !src) throw new Error("Recipe not found");

  const row = src as Record<string, unknown>;
  const {
    id: _id,
    created_at: _c,
    updated_at: _u,
    cook_count: _cc,
    last_cooked_at: _l,
    ...rest
  } = row;
  void _id;
  void _c;
  void _u;
  void _cc;
  void _l;

  const title = `${String(rest.title)} (copy)`;
  const { data, error } = await supabase
    .from("recipes")
    .insert({
      ...(rest as object),
      title,
      user_id: userId,
      cook_count: 0,
      last_cooked_at: null,
    })
    .select()
    .single();
  if (error) throw error;
  revalidatePath("/recipes");
  return mapRecipeRow(data as Record<string, unknown>);
}

export async function toggleFavorite(id: string, favorite: boolean) {
  const { supabase, userId } = await requireHousehold();
  const { error } = await supabase
    .from("recipes")
    .update({ favorite })
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw error;
  revalidatePath("/");
  revalidatePath("/recipes");
  revalidatePath(`/recipes/${id}`);
}

export async function fetchRecipesForUser(): Promise<Recipe[]> {
  const ctx = await getHouseholdContext();
  if (!ctx) return [];

  const { data, error } = await ctx.supabase
    .from("recipes")
    .select("*")
    .eq("user_id", ctx.userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return [];
  }
  return (data ?? []).map((r) => mapRecipeRow(r as Record<string, unknown>));
}

export async function fetchRecipeById(id: string): Promise<Recipe | null> {
  const ctx = await getHouseholdContext();
  if (!ctx) return null;

  const { data, error } = await ctx.supabase
    .from("recipes")
    .select("*")
    .eq("id", id)
    .eq("user_id", ctx.userId)
    .maybeSingle();

  if (error || !data) return null;
  return mapRecipeRow(data as Record<string, unknown>);
}

export async function exportRecipesJson() {
  const recipes = await fetchRecipesForUser();
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      version: 1,
      recipes: recipes.map((r) => ({
        title: r.title,
        description: r.description,
        meal_types: r.meal_types,
        ingredients: r.ingredients,
        instructions: r.instructions,
        prep_time: r.prep_time,
        cook_time: r.cook_time,
        servings: r.servings,
        nutrition: r.nutrition,
        image_url: r.image_url,
        tags: r.tags,
        notes: r.notes,
        favorite: r.favorite,
      })),
    },
    null,
    2
  );
}

const importBundleSchema = z.object({
  version: z.number().optional(),
  recipes: z.array(z.unknown()),
});

export async function importRecipesFromJson(json: string) {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return { imported: 0, error: "Invalid JSON" };
  }
  const bundle = importBundleSchema.safeParse(parsed);
  if (!bundle.success) {
    return { imported: 0, error: "Invalid import format" };
  }
  const { supabase, userId } = await requireHousehold();
  let count = 0;
  for (const item of bundle.data.recipes) {
    const r = recipeFormSchema.safeParse(item);
    if (!r.success) continue;
    const values = r.data;
    const nutrition =
      values.nutrition ??
      (await analyzeNutritionForRecipe(
        values.title,
        values.ingredients,
        values.servings
      ));
    const payload = { ...toDbPayload(values, nutrition ?? null), user_id: userId };
    const { error } = await supabase.from("recipes").insert(payload);
    if (!error) count += 1;
  }
  revalidatePath("/");
  revalidatePath("/recipes");
  return { imported: count, error: undefined as string | undefined };
}
