import { notFound } from "next/navigation";
import Image from "next/image";
import type { Metadata } from "next";
import { format } from "date-fns";
import { Clock, Heart } from "lucide-react";
import { fetchRecipeById } from "@/app/actions/recipes";
import { NutritionDisplay } from "@/components/recipes/nutrition-display";
import { RecipeDetailActions } from "@/components/recipes/recipe-detail-actions";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const recipe = await fetchRecipeById(id);
  if (!recipe) return { title: "Recipe" };
  return {
    title: recipe.title,
    description: recipe.description ?? undefined,
    openGraph: recipe.image_url
      ? { images: [recipe.image_url] }
      : undefined,
  };
}

export default async function RecipeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const recipe = await fetchRecipeById(id);
  if (!recipe) notFound();

  const totalTime =
    (recipe.prep_time ?? 0) + (recipe.cook_time ?? 0) || null;

  return (
    <article className="space-y-8" id="recipe-print">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            {recipe.favorite ? (
              <Badge variant="secondary" className="gap-1 rounded-full">
                <Heart className="size-3 fill-primary text-primary" aria-hidden />
                Favorite
              </Badge>
            ) : null}
            {recipe.meal_types.map((m) => (
              <Badge key={m} variant="outline" className="rounded-full">
                {m}
              </Badge>
            ))}
          </div>
          <h1 className="text-3xl font-bold tracking-tight lg:text-4xl">
            {recipe.title}
          </h1>
          {recipe.description ? (
            <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
              {recipe.description}
            </p>
          ) : null}
          <div className="text-muted-foreground flex flex-wrap gap-4 text-xs">
            {totalTime ? (
              <span className="flex items-center gap-1 tabular-nums">
                <Clock className="size-3.5" aria-hidden />
                {recipe.prep_time ? `${recipe.prep_time}m prep` : null}
                {recipe.prep_time && recipe.cook_time ? " · " : null}
                {recipe.cook_time ? `${recipe.cook_time}m cook` : null}
                {recipe.prep_time || recipe.cook_time ? ` · ${totalTime}m total` : null}
              </span>
            ) : null}
            <span className="tabular-nums">
              Serves {recipe.servings}
            </span>
            <span className="tabular-nums">
              Cooked {recipe.cook_count}×
              {recipe.last_cooked_at
                ? ` · last ${format(new Date(recipe.last_cooked_at), "MMM d, yyyy")}`
                : ""}
            </span>
          </div>
        </div>
        <RecipeDetailActions recipe={recipe} />
      </header>

      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.9fr]">
        <div className="space-y-6">
          {recipe.image_url ? (
            <div className="bg-muted relative aspect-video w-full overflow-hidden rounded-2xl border shadow-sm">
              <Image
                src={recipe.image_url}
                alt=""
                fill
                className="object-cover"
                priority
                sizes="(max-width:1024px) 100vw, 60vw"
              />
            </div>
          ) : null}

          <section aria-labelledby="ingredients-heading">
            <h2 id="ingredients-heading" className="mb-3 text-lg font-semibold">
              Ingredients
            </h2>
            <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed">
              {recipe.ingredients.map((i, idx) => (
                <li key={idx}>
                  <span className="font-medium tabular-nums">
                    {i.quantity ? `${i.quantity} ` : ""}
                  </span>
                  {i.name}
                </li>
              ))}
            </ul>
          </section>

          <Separator />

          <section aria-labelledby="instructions-heading">
            <h2 id="instructions-heading" className="mb-3 text-lg font-semibold">
              Instructions
            </h2>
            {recipe.instructions ? (
              <div className="text-sm leading-relaxed whitespace-pre-wrap">
                {recipe.instructions}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No steps yet.</p>
            )}
          </section>

          {recipe.notes ? (
            <>
              <Separator />
              <section aria-labelledby="notes-heading">
                <h2 id="notes-heading" className="mb-2 text-lg font-semibold">
                  How it turned out
                </h2>
                <p className="text-muted-foreground text-sm whitespace-pre-wrap">
                  {recipe.notes}
                </p>
              </section>
            </>
          ) : null}

          {recipe.tags.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {recipe.tags.map((t) => (
                <Badge key={t} variant="secondary">
                  {t}
                </Badge>
              ))}
            </div>
          ) : null}
        </div>

        <div className="space-y-4">
          <NutritionDisplay nutrition={recipe.nutrition} />
          <Card className="print:hidden">
            <CardContent className="text-muted-foreground p-4 text-xs leading-relaxed">
              Nutrition is estimated per serving from ingredients (Edamam) unless you
              override it on edit. Values are a guide, not lab-tested data.
            </CardContent>
          </Card>
        </div>
      </div>
    </article>
  );
}
