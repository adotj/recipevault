"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, ChefHat, Home } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "Home", icon: Home },
  { href: "/recipes", label: "Recipes", icon: ChefHat },
  { href: "/planner", label: "Planner", icon: CalendarDays },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="no-print bg-background/95 supports-[backdrop-filter]:bg-background/80 border-border md:hidden fixed right-0 bottom-0 left-0 z-50 flex items-stretch justify-around border-t px-2 pb-[env(safe-area-inset-bottom)] pt-2 backdrop-blur"
      aria-label="Mobile navigation"
    >
      {items.map(({ href, label, icon: Icon }) => {
        const active =
          href === "/"
            ? pathname === "/"
            : pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "focus-visible:ring-ring flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-lg py-2 text-[10px] font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none",
              active ? "text-primary" : "text-muted-foreground"
            )}
          >
            <Icon className="size-5" aria-hidden />
            <span className="truncate">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
