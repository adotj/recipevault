"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { mealPlanUpdateSchema } from "@/lib/validations/recipe";
import type { MealPlanRow } from "@/types";

function mapPlanRow(row: Record<string, unknown>): MealPlanRow {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    plan_date: String(row.plan_date),
    breakfast_recipe_id: row.breakfast_recipe_id
      ? String(row.breakfast_recipe_id)
      : null,
    lunch_recipe_id: row.lunch_recipe_id ? String(row.lunch_recipe_id) : null,
    dinner_recipe_id: row.dinner_recipe_id
      ? String(row.dinner_recipe_id)
      : null,
    snack_recipe_id: row.snack_recipe_id ? String(row.snack_recipe_id) : null,
    dessert_recipe_id: row.dessert_recipe_id
      ? String(row.dessert_recipe_id)
      : null,
  };
}

export async function fetchMealPlansRange(startIso: string, endIso: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("meal_plans")
    .select("*")
    .eq("user_id", user.id)
    .gte("plan_date", startIso)
    .lte("plan_date", endIso);

  if (error) {
    console.error(error);
    return [];
  }
  return (data ?? []).map((r) => mapPlanRow(r as Record<string, unknown>));
}

export async function upsertMealPlan(raw: unknown) {
  const parsed = mealPlanUpdateSchema.safeParse(raw);
  if (!parsed.success) return { error: "Invalid meal plan" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const {
    plan_date,
    breakfast_recipe_id,
    lunch_recipe_id,
    dinner_recipe_id,
    snack_recipe_id,
    dessert_recipe_id,
  } = parsed.data;

  const existing = await supabase
    .from("meal_plans")
    .select("id")
    .eq("user_id", user.id)
    .eq("plan_date", plan_date)
    .maybeSingle();

  const payload = {
    user_id: user.id,
    plan_date,
    breakfast_recipe_id: breakfast_recipe_id ?? null,
    lunch_recipe_id: lunch_recipe_id ?? null,
    dinner_recipe_id: dinner_recipe_id ?? null,
    snack_recipe_id: snack_recipe_id ?? null,
    dessert_recipe_id: dessert_recipe_id ?? null,
  };

  if (existing.data?.id) {
    const { data, error } = await supabase
      .from("meal_plans")
      .update(payload)
      .eq("id", existing.data.id)
      .select()
      .single();
    if (error) return { error: error.message };
    revalidatePath("/planner");
    return { plan: mapPlanRow(data as Record<string, unknown>) };
  }

  const { data, error } = await supabase
    .from("meal_plans")
    .insert(payload)
    .select()
    .single();
  if (error) return { error: error.message };
  revalidatePath("/planner");
  return { plan: mapPlanRow(data as Record<string, unknown>) };
}

export async function clearMealPlanDay(plan_date: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase
    .from("meal_plans")
    .update({
      breakfast_recipe_id: null,
      lunch_recipe_id: null,
      dinner_recipe_id: null,
      snack_recipe_id: null,
      dessert_recipe_id: null,
    })
    .eq("user_id", user.id)
    .eq("plan_date", plan_date);

  if (error) return { error: error.message };
  revalidatePath("/planner");
  return { ok: true as const };
}

export async function clearMealPlanWeek(startIso: string, endIso: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase
    .from("meal_plans")
    .update({
      breakfast_recipe_id: null,
      lunch_recipe_id: null,
      dinner_recipe_id: null,
      snack_recipe_id: null,
      dessert_recipe_id: null,
    })
    .eq("user_id", user.id)
    .gte("plan_date", startIso)
    .lte("plan_date", endIso);

  if (error) return { error: error.message };
  revalidatePath("/planner");
  return { ok: true as const };
}
