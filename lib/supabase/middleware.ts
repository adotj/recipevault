import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** Only allow same-origin relative paths (avoid open redirects). */
function safeNextPath(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/";
  return next;
}

export async function updateSession(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
      "[middleware] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
    return new NextResponse(
      "Server misconfiguration: add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your host (e.g. Vercel → Environment Variables).",
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
  const isLoginRoute =
    pathname === "/login" || pathname.startsWith("/login/");
  const isAuthRoute = pathname.startsWith("/auth");

  const {
    data: { user: initialUser },
  } = await supabase.auth.getUser();

  if (initialUser && isLoginRoute) {
    const next = safeNextPath(request.nextUrl.searchParams.get("next"));
    return NextResponse.redirect(new URL(next, request.url));
  }

  if (isLoginRoute || isAuthRoute) {
    return supabaseResponse;
  }

  if (!initialUser) {
    const { error } = await supabase.auth.signInAnonymously();
    if (error) {
      console.error(
        "[middleware] Anonymous sign-in failed — redirecting to /login",
        error.message
      );
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.search = "";
      url.searchParams.set("next", safeNextPath(pathname));
      url.searchParams.set("reason", "anonymous_disabled");
      return NextResponse.redirect(url);
    }

    const { data: afterAnon, error: afterErr } = await supabase.auth.getUser();
    if (afterErr) {
      console.error("[middleware] getUser after anonymous failed", afterErr.message);
    }
    if (!afterAnon.user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.search = "";
      url.searchParams.set("next", safeNextPath(pathname));
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
