import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { sealVaultSession } from "@/lib/vault-household";
import { VAULT_COOKIE_NAME } from "@/lib/vault-session";

function timingSafeEqualString(a: string, b: string): boolean {
  const ae = Buffer.from(a, "utf8");
  const be = Buffer.from(b, "utf8");
  if (ae.length !== be.length) return false;
  return timingSafeEqual(ae, be);
}

export async function POST(request: Request) {
  const expected = process.env.VAULT_PASSPHRASE;
  if (!expected || expected.length < 1) {
    return NextResponse.json(
      { error: "Server misconfiguration: VAULT_PASSPHRASE" },
      { status: 500 }
    );
  }

  let body: { passphrase?: string };
  try {
    body = (await request.json()) as { passphrase?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const passphrase = typeof body.passphrase === "string" ? body.passphrase : "";
  if (!timingSafeEqualString(passphrase, expected)) {
    return NextResponse.json({ error: "Incorrect passphrase" }, { status: 401 });
  }

  try {
    const token = await sealVaultSession();
    const res = NextResponse.json({ ok: true });
    const secure = process.env.NODE_ENV === "production";
    res.cookies.set(VAULT_COOKIE_NAME, token, {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    return res;
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Could not create session" }, { status: 500 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  const secure = process.env.NODE_ENV === "production";
  res.cookies.set(VAULT_COOKIE_NAME, "", {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return res;
}
