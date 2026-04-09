import { fetchRecipesForUser } from "@/app/actions/recipes";
import { RecipeBrowser } from "@/components/recipes/recipe-browser";
import { RecipeImportExport } from "@/components/recipes/recipe-import-export";

export default async function RecipesPage() {
  const recipes = await fetchRecipesForUser();

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Recipes</h1>
          <p className="text-muted-foreground mt-1 max-w-xl text-sm">
            Search, filter by meal type, and switch between grid and table views.
          </p>
        </div>
        <RecipeImportExport />
      </header>
      <RecipeBrowser initialRecipes={recipes} />
    </div>
  );
}
