/** httpOnly cookie name for vault (passphrase) session. */
export const VAULT_COOKIE_NAME = "rv_vault";

const SESSION_VERSION = "v1";

function timingSafeEqualBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

async function hmacSha256(secret: string, message: string): Promise<Uint8Array> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return new Uint8Array(sig);
}

function bytesToB64url(bytes: Uint8Array): string {
  let bin = "";
  bytes.forEach((b) => {
    bin += String.fromCharCode(b);
  });
  const b64 = btoa(bin);
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlToBytes(s: string): Uint8Array | null {
  try {
    const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
    const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + pad;
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  } catch {
    return null;
  }
}

/** Signed token: v1.<expUnix>.<base64url(sig)> — exp is session expiry. */
export async function createVaultSessionToken(sessionSecret: string): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30;
  const msg = `${SESSION_VERSION}.${exp}`;
  const sig = await hmacSha256(sessionSecret, msg);
  return `${msg}.${bytesToB64url(sig)}`;
}

export async function verifyVaultSessionToken(
  token: string,
  sessionSecret: string
): Promise<boolean> {
  const lastDot = token.lastIndexOf(".");
  if (lastDot <= 0) return false;
  const sigPart = token.slice(lastDot + 1);
  const msg = token.slice(0, lastDot);
  if (!msg.startsWith(`${SESSION_VERSION}.`)) return false;
  const expStr = msg.slice(SESSION_VERSION.length + 1);
  const exp = parseInt(expStr, 10);
  if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) return false;

  const expectedSig = await hmacSha256(sessionSecret, msg);
  const sigBytes = b64urlToBytes(sigPart);
  if (!sigBytes) return false;
  return timingSafeEqualBytes(sigBytes, expectedSig);
}
