"use server";

import { revalidatePath } from "next/cache";
import { getHouseholdContext } from "@/lib/vault-household";
import { cookLogSchema } from "@/lib/validations/recipe";

export async function logCookedRecipe(raw: unknown) {
  const parsed = cookLogSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: "Invalid cook log" };
  }
  const { recipe_id, cooked_at, rating, notes } = parsed.data;

  const ctx = await getHouseholdContext();
  if (!ctx) return { error: "Unauthorized" };

  const { error } = await ctx.supabase.from("cooked_logs").insert({
    user_id: ctx.userId,
    recipe_id,
    cooked_at,
    rating: rating ?? null,
    notes: notes ?? null,
  });

  if (error) {
    console.error(error);
    return { error: error.message };
  }

  const { data: recipe } = await ctx.supabase
    .from("recipes")
    .select("cook_count")
    .eq("id", recipe_id)
    .eq("user_id", ctx.userId)
    .single();

  const nextCount = (recipe?.cook_count ?? 0) + 1;
  await ctx.supabase
    .from("recipes")
    .update({
      cook_count: nextCount,
      last_cooked_at: new Date(cooked_at + "T12:00:00Z").toISOString(),
    })
    .eq("id", recipe_id)
    .eq("user_id", ctx.userId);

  revalidatePath("/");
  revalidatePath("/recipes");
  revalidatePath(`/recipes/${recipe_id}`);
  return { ok: true as const };
}

export async function fetchCookedLogsForMonth(year: number, month: number) {
  const ctx = await getHouseholdContext();
  if (!ctx) return [];

  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDate = new Date(year, month, 0);
  const end = `${year}-${String(month).padStart(2, "0")}-${String(endDate.getDate()).padStart(2, "0")}`;

  const { data, error } = await ctx.supabase
    .from("cooked_logs")
    .select("*, recipes(title)")
    .eq("user_id", ctx.userId)
    .gte("cooked_at", start)
    .lte("cooked_at", end);

  if (error) {
    console.error(error);
    return [];
  }
  return data ?? [];
}

export async function countCooksThisMonth() {
  const ctx = await getHouseholdContext();
  if (!ctx) return 0;

  const now = new Date();
  const start = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const end = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(last.getDate()).padStart(2, "0")}`;

  const { count, error } = await ctx.supabase
    .from("cooked_logs")
    .select("*", { count: "exact", head: true })
    .eq("user_id", ctx.userId)
    .gte("cooked_at", start)
    .lte("cooked_at", end);

  if (error) {
    console.error(error);
    return 0;
  }
  return count ?? 0;
}

export async function fetchRecentCookedLogs(limit = 8) {
  const ctx = await getHouseholdContext();
  if (!ctx) return [];

  const { data, error } = await ctx.supabase
    .from("cooked_logs")
    .select("*, recipes(id, title, image_url, nutrition)")
    .eq("user_id", ctx.userId)
    .order("cooked_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error(error);
    return [];
  }
  return data ?? [];
}
