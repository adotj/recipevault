"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { LayoutGrid, List, Search } from "lucide-react";
import type { Recipe } from "@/types";
import { MEAL_TYPES } from "@/types";
import { usePreferencesStore } from "@/store/preferences-store";
import { useRecipeListStore } from "@/store/recipe-list-store";
import {
  filterByMealType,
  filterRecipesBySearch,
  sortRecipes,
} from "@/lib/recipe-filters";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RecipeCard } from "@/components/recipes/recipe-card";
import { RecipesDataTable } from "@/components/recipes/recipes-data-table";
import type { SortOption } from "@/types";

const SORT_LABELS: { value: SortOption; label: string }[] = [
  { value: "recent", label: "Recently added" },
  { value: "most_cooked", label: "Most cooked" },
  { value: "az", label: "A–Z" },
  { value: "high_protein", label: "Highest protein" },
  { value: "low_cal", label: "Lowest calories" },
];

export function RecipeBrowser({ initialRecipes }: { initialRecipes: Recipe[] }) {
  const setCache = useRecipeListStore((s) => s.setRecipes);
  const recipeView = usePreferencesStore((s) => s.recipeView);
  const setRecipeView = usePreferencesStore((s) => s.setRecipeView);
  const sortBy = usePreferencesStore((s) => s.sortBy);
  const setSortBy = usePreferencesStore((s) => s.setSortBy);
  const filterMeal = usePreferencesStore((s) => s.filterMeal);
  const setFilterMeal = usePreferencesStore((s) => s.setFilterMeal);

  const [q, setQ] = useState("");

  useEffect(() => {
    setCache(initialRecipes, new Date().toISOString());
  }, [initialRecipes, setCache]);

  const visible = useMemo(() => {
    let r = initialRecipes;
    r = filterRecipesBySearch(r, q);
    r = filterByMealType(r, filterMeal);
    r = sortRecipes(r, sortBy);
    return r;
  }, [initialRecipes, q, filterMeal, sortBy]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" aria-hidden />
          <Input
            aria-label="Search recipes"
            placeholder="Search title, tags, ingredients…"
            className="rounded-full pl-9"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant={recipeView === "grid" ? "default" : "outline"}
            size="icon-sm"
            onClick={() => setRecipeView("grid")}
            aria-label="Grid view"
            aria-pressed={recipeView === "grid"}
          >
            <LayoutGrid className="size-4" />
          </Button>
          <Button
            type="button"
            variant={recipeView === "list" ? "default" : "outline"}
            size="icon-sm"
            onClick={() => setRecipeView("list")}
            aria-label="List view"
            aria-pressed={recipeView === "list"}
          >
            <List className="size-4" />
          </Button>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="w-[200px] rounded-full">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              {SORT_LABELS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Link
            href="/recipes/new"
            className={cn(buttonVariants({ variant: "default" }), "rounded-full")}
          >
            New recipe
          </Link>
        </div>
      </div>

      <Tabs value={filterMeal} onValueChange={setFilterMeal}>
        <TabsList className="no-scrollbar flex h-auto w-full flex-nowrap justify-start gap-1 overflow-x-auto bg-muted/50 p-1">
          <TabsTrigger value="All" className="shrink-0 rounded-full px-3 text-xs sm:text-sm">
            All
          </TabsTrigger>
          {MEAL_TYPES.map((m) => (
            <TabsTrigger key={m} value={m} className="shrink-0 rounded-full px-3 text-xs sm:text-sm">
              {m}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {visible.length === 0 ? (
        <div className="border-border text-muted-foreground rounded-2xl border border-dashed py-16 text-center text-sm">
          No recipes match. Clear filters or add a new recipe.
        </div>
      ) : recipeView === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((r) => (
            <RecipeCard key={r.id} recipe={r} />
          ))}
        </div>
      ) : (
        <RecipesDataTable data={visible} />
      )}
    </div>
  );
}
