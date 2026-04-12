import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import {
  createVaultSessionToken,
  verifyVaultSessionToken,
  VAULT_COOKIE_NAME,
} from "@/lib/vault-session";

export type HouseholdContext = {
  supabase: SupabaseClient;
  userId: string;
};

/**
 * Returns Supabase (service role) + household user id when the vault session cookie is valid.
 */
export async function getHouseholdContext(): Promise<HouseholdContext | null> {
  const sessionSecret = process.env.VAULT_SESSION_SECRET;
  if (!sessionSecret) return null;

  const cookieStore = await cookies();
  const token = cookieStore.get(VAULT_COOKIE_NAME)?.value;
  if (!token) return null;
  if (!(await verifyVaultSessionToken(token, sessionSecret))) return null;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const userId = process.env.VAULT_HOUSEHOLD_USER_ID?.trim();
  if (!url || !serviceKey || !userId) return null;

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return { supabase, userId };
}

/**
 * Used from the vault-auth API route after passphrase check.
 */
export async function sealVaultSession(): Promise<string> {
  const sessionSecret = process.env.VAULT_SESSION_SECRET;
  if (!sessionSecret) {
    throw new Error("VAULT_SESSION_SECRET is not set");
  }
  return createVaultSessionToken(sessionSecret);
}
