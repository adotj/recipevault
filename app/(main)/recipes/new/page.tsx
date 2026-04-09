import { RecipeForm } from "@/components/recipes/recipe-form";

export default function NewRecipePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">New recipe</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Ingredients power automatic nutrition when Edamam is configured.
        </p>
      </div>
      <RecipeForm />
    </div>
  );
}
