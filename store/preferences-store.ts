"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SortOption } from "@/types";
import { mondayOfWeekContaining } from "@/lib/dates";

export type RecipeViewMode = "grid" | "list";

type PreferencesState = {
  recipeView: RecipeViewMode;
  sortBy: SortOption;
  filterMeal: string;
  /** Monday-based week start as YYYY-MM-DD */
  plannerWeekStart: string | null;
  setRecipeView: (v: RecipeViewMode) => void;
  setSortBy: (s: SortOption) => void;
  setFilterMeal: (f: string) => void;
  setPlannerWeekStart: (iso: string | null) => void;
};

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      recipeView: "grid",
      sortBy: "recent",
      filterMeal: "All",
      plannerWeekStart: null,
      setRecipeView: (v) => set({ recipeView: v }),
      setSortBy: (s) => set({ sortBy: s }),
      setFilterMeal: (f) => set({ filterMeal: f }),
      setPlannerWeekStart: (iso) => set({ plannerWeekStart: iso }),
    }),
    { name: "recipevault-preferences" }
  )
);

export function getDefaultPlannerWeekStart() {
  return mondayOfWeekContaining();
}
