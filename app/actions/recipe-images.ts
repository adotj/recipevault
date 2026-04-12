"use server";

import { revalidatePath } from "next/cache";
import { getHouseholdContext } from "@/lib/vault-household";

const ALLOWED_EXT = new Set(["jpg", "jpeg", "png", "gif", "webp", "heic"]);

export async function uploadRecipeImageForm(
  formData: FormData
): Promise<{ url?: string; error?: string }> {
  const ctx = await getHouseholdContext();
  if (!ctx) return { error: "Unauthorized" };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "No file" };
  }

  const rawExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const ext = ALLOWED_EXT.has(rawExt) ? rawExt : "jpg";

  const path = `${ctx.userId}/${crypto.randomUUID()}.${ext}`;
  const buf = Buffer.from(await file.arrayBuffer());
  const { error } = await ctx.supabase.storage.from("recipe-images").upload(path, buf, {
    contentType: file.type || "image/jpeg",
    upsert: true,
  });

  if (error) {
    return { error: error.message };
  }

  const { data } = ctx.supabase.storage.from("recipe-images").getPublicUrl(path);
  revalidatePath("/recipes");
  return { url: data.publicUrl };
}
