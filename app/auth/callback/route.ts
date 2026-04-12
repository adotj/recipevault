import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next.startsWith("/") ? next : "/"}`);
    }
  }

  const fallbackNext = searchParams.get("next") ?? "/";
  const safe =
    fallbackNext.startsWith("/") && !fallbackNext.startsWith("//")
      ? fallbackNext
      : "/";
  return NextResponse.redirect(`${origin}/gate?error=auth&next=${encodeURIComponent(safe)}`);
}
