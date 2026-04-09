"use client";

import { useEffect } from "react";
import type { Recipe } from "@/types";
import { useRecipeListStore } from "@/store/recipe-list-store";

export function SyncRecipesToStore({ recipes }: { recipes: Recipe[] }) {
  const setRecipes = useRecipeListStore((s) => s.setRecipes);

  useEffect(() => {
    setRecipes(recipes, new Date().toISOString());
  }, [recipes, setRecipes]);

  return null;
}
