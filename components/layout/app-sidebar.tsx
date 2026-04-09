"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  ChefHat,
  Home,
  LogOut,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const links = [
  { href: "/", label: "Home", icon: Home },
  { href: "/recipes", label: "Recipes", icon: ChefHat },
  { href: "/planner", label: "Meal planner", icon: CalendarDays },
];

export function AppSidebar({
  className,
  userEmail,
}: {
  className?: string;
  userEmail?: string | null;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside
      className={cn(
        "no-print border-border bg-sidebar text-sidebar-foreground flex w-64 shrink-0 flex-col border-r",
        className
      )}
      aria-label="Main navigation"
    >
      <div className="border-sidebar-border flex items-center gap-2 border-b px-4 py-4">
        <span className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-lg shadow-sm">
          <Sparkles className="size-5" aria-hidden />
        </span>
        <div>
          <p className="text-sm font-semibold tracking-tight">RecipeVault</p>
          <p className="text-sidebar-foreground/70 text-xs">Cook smarter</p>
        </div>
      </div>
      <ScrollArea className="flex-1 px-2 py-3">
        <nav className="flex flex-col gap-1" aria-label="Primary">
          {links.map(({ href, label, icon: Icon }) => {
            const active =
              href === "/"
                ? pathname === "/"
                : pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "focus-visible:ring-ring flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                )}
              >
                <Icon className="size-4 shrink-0 opacity-80" aria-hidden />
                {label}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>
      <div className="border-sidebar-border space-y-2 border-t p-3">
        {userEmail ? (
          <p className="text-sidebar-foreground/70 truncate px-1 text-xs" title={userEmail}>
            {userEmail}
          </p>
        ) : null}
        <Button
          variant="ghost"
          className="text-sidebar-foreground/80 w-full justify-start gap-2"
          type="button"
          onClick={() => void signOut()}
        >
          <LogOut className="size-4" aria-hidden />
          Sign out
        </Button>
      </div>
    </aside>
  );
}
