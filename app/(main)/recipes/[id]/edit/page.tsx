import { notFound } from "next/navigation";
import { fetchRecipeById } from "@/app/actions/recipes";
import { RecipeForm } from "@/components/recipes/recipe-form";

export default async function EditRecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const recipe = await fetchRecipeById(id);
  if (!recipe) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit recipe</h1>
        <p className="text-muted-foreground mt-1 text-sm">{recipe.title}</p>
      </div>
      <RecipeForm recipe={recipe} />
    </div>
  );
}
