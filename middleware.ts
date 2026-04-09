import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  try {
    return await updateSession(request);
  } catch (err) {
    console.error("[middleware]", err);
    return new NextResponse("Middleware error — check Vercel logs and Supabase env vars.", {
      status: 500,
    });
  }
}

export const config = {
  matcher: [
    /*
     * Exclude static assets, images, and PWA files.
     */
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw\\.js|icons/.*|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
