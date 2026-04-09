"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Calculator,
  CalendarDays,
  ChefHat,
  LayoutDashboard,
  Search,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useRecipeListStore } from "@/store/recipe-list-store";

export function CommandMenu() {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();
  const recipes = useRecipeListStore((s) => s.recipes);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const top = [
    { label: "Dashboard", href: "/", icon: LayoutDashboard },
    { label: "Recipes", href: "/recipes", icon: ChefHat },
    { label: "Meal planner", href: "/planner", icon: CalendarDays },
  ];

  const run = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="no-print border-input bg-background/80 text-muted-foreground hover:bg-muted hover:text-foreground fixed right-4 bottom-20 z-40 hidden items-center gap-2 rounded-full border px-3 py-2 text-xs shadow-md backdrop-blur md:flex md:bottom-4"
        aria-label="Open command palette"
      >
        <Search className="size-3.5" aria-hidden />
        Search
        <kbd className="bg-muted text-muted-foreground pointer-events-none hidden rounded border px-1.5 py-0.5 text-[10px] font-medium sm:inline-block">
          ⌘K
        </kbd>
      </button>
      <CommandDialog open={open} onOpenChange={setOpen} title="RecipeVault" description="Search recipes and navigate">
        <CommandInput placeholder="Search recipes or jump…" />
        <CommandList>
          <CommandEmpty>No matches.</CommandEmpty>
          <CommandGroup heading="Go to">
            {top.map(({ label, href, icon: Icon }) => (
              <CommandItem key={href} onSelect={() => run(href)}>
                <Icon className="size-4" aria-hidden />
                {label}
              </CommandItem>
            ))}
            <CommandItem onSelect={() => run("/recipes/new")}>
              <Calculator className="size-4" aria-hidden />
              New recipe
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Recipes">
            {recipes.slice(0, 50).map((r) => (
              <CommandItem
                key={r.id}
                onSelect={() => run(`/recipes/${r.id}`)}
                keywords={[...r.tags, ...r.meal_types, r.title]}
              >
                <ChefHat className="size-4 opacity-60" aria-hidden />
                {r.title}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
