import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
      "[middleware] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
    return new NextResponse(
      "Server misconfiguration: add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your host (e.g. Vercel → Settings → Environment Variables).",
      { status: 500 }
    );
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const pathname = request.nextUrl.pathname;

  if (pathname === "/login" || pathname.startsWith("/login/")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthCallback = pathname.startsWith("/auth");

  if (!user && !isAuthCallback) {
    const { error } = await supabase.auth.signInAnonymously();
    if (error) {
      console.error(
        "[middleware] Anonymous sign-in failed. Enable it in Supabase: Authentication → Providers → Anonymous.",
        error.message
      );
    }
  }

  return supabaseResponse;
}
