"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { cookLogSchema } from "@/lib/validations/recipe";

export async function logCookedRecipe(raw: unknown) {
  const parsed = cookLogSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: "Invalid cook log" };
  }
  const { recipe_id, cooked_at, rating, notes } = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase.from("cooked_logs").insert({
    user_id: user.id,
    recipe_id,
    cooked_at,
    rating: rating ?? null,
    notes: notes ?? null,
  });

  if (error) {
    console.error(error);
    return { error: error.message };
  }

  const { data: recipe } = await supabase
    .from("recipes")
    .select("cook_count")
    .eq("id", recipe_id)
    .eq("user_id", user.id)
    .single();

  const nextCount = (recipe?.cook_count ?? 0) + 1;
  await supabase
    .from("recipes")
    .update({
      cook_count: nextCount,
      last_cooked_at: new Date(cooked_at + "T12:00:00Z").toISOString(),
    })
    .eq("id", recipe_id)
    .eq("user_id", user.id);

  revalidatePath("/");
  revalidatePath("/recipes");
  revalidatePath(`/recipes/${recipe_id}`);
  return { ok: true as const };
}

export async function fetchCookedLogsForMonth(year: number, month: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDate = new Date(year, month, 0);
  const end = `${year}-${String(month).padStart(2, "0")}-${String(endDate.getDate()).padStart(2, "0")}`;

  const { data, error } = await supabase
    .from("cooked_logs")
    .select("*, recipes(title)")
    .eq("user_id", user.id)
    .gte("cooked_at", start)
    .lte("cooked_at", end);

  if (error) {
    console.error(error);
    return [];
  }
  return data ?? [];
}

export async function countCooksThisMonth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;

  const now = new Date();
  const start = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const end = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(last.getDate()).padStart(2, "0")}`;

  const { count, error } = await supabase
    .from("cooked_logs")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("cooked_at", start)
    .lte("cooked_at", end);

  if (error) {
    console.error(error);
    return 0;
  }
  return count ?? 0;
}

export async function fetchRecentCookedLogs(limit = 8) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("cooked_logs")
    .select("*, recipes(id, title, image_url, nutrition)")
    .eq("user_id", user.id)
    .order("cooked_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error(error);
    return [];
  }
  return data ?? [];
}
