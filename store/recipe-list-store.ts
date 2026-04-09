"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Recipe } from "@/types";

type RecipeListState = {
  /** Cached list for offline / instant paint; server remains source of truth when online. */
  recipes: Recipe[];
  lastSyncedAt: string | null;
  setRecipes: (recipes: Recipe[], syncedAt?: string) => void;
  clear: () => void;
};

export const useRecipeListStore = create<RecipeListState>()(
  persist(
    (set) => ({
      recipes: [],
      lastSyncedAt: null,
      setRecipes: (recipes, syncedAt) =>
        set({
          recipes,
          lastSyncedAt: syncedAt ?? new Date().toISOString(),
        }),
      clear: () => set({ recipes: [], lastSyncedAt: null }),
    }),
    { name: "recipevault-recipes-cache" }
  )
);
