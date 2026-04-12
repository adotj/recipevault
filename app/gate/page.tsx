import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyVaultSessionToken, VAULT_COOKIE_NAME } from "@/lib/vault-session";
import { GateForm } from "./gate-form";

function safeNext(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/";
  return next;
}

export default async function GatePage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const sp = await searchParams;
  const secret = process.env.VAULT_SESSION_SECRET;
  if (secret) {
    const cookieStore = await cookies();
    const token = cookieStore.get(VAULT_COOKIE_NAME)?.value;
    if (token && (await verifyVaultSessionToken(token, secret))) {
      redirect(safeNext(sp.next ?? null));
    }
  }
  return <GateForm nextHref={safeNext(sp.next ?? null)} />;
}
