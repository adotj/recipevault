import Link from "next/link";
import { format } from "date-fns";
import { ArrowRight, ChefHat, Sparkles, TrendingUp } from "lucide-react";
import { fetchRecipesForUser } from "@/app/actions/recipes";
import {
  countCooksThisMonth,
  fetchRecentCookedLogs,
} from "@/app/actions/cooked-logs";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RecipeSuggestions } from "@/components/home/recipe-suggestions";
import { SyncRecipesToStore } from "@/components/home/sync-recipes-to-store";
import type { Recipe } from "@/types";
import { MEAL_TYPES } from "@/types";

function pickSuggestion(recipes: Recipe[], predicate: (r: Recipe) => boolean) {
  const pool = recipes.filter(predicate);
  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

export default async function DashboardPage() {
  const recipes = await fetchRecipesForUser();
  const recentLogs = await fetchRecentCookedLogs(6);
  const now = new Date();
  const cookedThisMonth = await countCooksThisMonth();

  const favorites = recipes.filter((r) => r.favorite).length;

  const suggestions = MEAL_TYPES.map((meal) => {
    const r = pickSuggestion(recipes, (x) => x.meal_types.includes(meal));
    return { meal, recipe: r };
  }).filter(
    (x): x is { meal: (typeof MEAL_TYPES)[number]; recipe: Recipe } =>
      x.recipe != null
  );

  const recent = recipes.slice(0, 6);

  return (
    <>
      <SyncRecipesToStore recipes={recipes} />
      <div className="space-y-10">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-muted-foreground text-sm">
              {format(now, "EEEE, MMMM d, yyyy")}
            </p>
            <h1 className="text-3xl font-bold tracking-tight">
              Welcome back
            </h1>
            <p className="text-muted-foreground mt-1 max-w-xl text-sm">
              Plan meals, hit your macros, and cook with confidence.
            </p>
          </div>
          <Link
            href="/recipes/new"
            className={cn(
              buttonVariants({ variant: "default" }),
              "inline-flex shrink-0 gap-2 rounded-full shadow-sm"
            )}
          >
            <ChefHat className="size-4" aria-hidden />
            New recipe
          </Link>
        </header>

        <section className="grid gap-4 sm:grid-cols-3">
          <Card className="border-border/80 from-card to-accent/5 bg-gradient-to-br shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription>Total recipes</CardDescription>
              <CardTitle className="text-3xl tabular-nums">{recipes.length}</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground flex items-center gap-2 text-xs">
              <Sparkles className="size-3.5 text-primary" aria-hidden />
              Your living cookbook
            </CardContent>
          </Card>
          <Card className="border-border/80 from-card to-accent/5 bg-gradient-to-br shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription>Favorites</CardDescription>
              <CardTitle className="text-3xl tabular-nums">{favorites}</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground flex items-center gap-2 text-xs">
              <TrendingUp className="size-3.5 text-primary" aria-hidden />
              Heart-count wins
            </CardContent>
          </Card>
          <Card className="border-border/80 from-card to-accent/5 bg-gradient-to-br shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription>Cooked this month</CardDescription>
              <CardTitle className="text-3xl tabular-nums">
                {cookedThisMonth}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground text-xs">
              From “last cooked” timestamps
            </CardContent>
          </Card>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold tracking-tight">
              What should I cook today?
            </h2>
            <Link
              href="/planner"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "gap-1 text-primary"
              )}
            >
              Open planner
              <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          </div>
          <RecipeSuggestions pairs={suggestions} />
        </section>

        <section className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold tracking-tight">
                Recent recipes
              </h2>
              <Link
                href="/recipes"
                className={cn(
                  buttonVariants({ variant: "link", size: "sm" }),
                  "text-primary h-auto p-0"
                )}
              >
                View all
              </Link>
            </div>
            {recent.length === 0 ? (
              <Card>
                <CardContent className="text-muted-foreground py-10 text-center text-sm">
                  No recipes yet — add your first favorite meal.
                </CardContent>
              </Card>
            ) : (
              <ul className="space-y-2">
                {recent.map((r) => (
                  <li key={r.id}>
                    <Link
                      href={`/recipes/${r.id}`}
                      className="border-border hover:border-primary/30 focus-visible:ring-ring flex items-center justify-between gap-3 rounded-xl border bg-card px-3 py-2 text-sm shadow-xs transition-colors focus-visible:ring-2 focus-visible:outline-none"
                    >
                      <span className="min-w-0 truncate font-medium">{r.title}</span>
                      <div className="flex shrink-0 gap-1">
                        {r.meal_types.slice(0, 2).map((m) => (
                          <Badge key={m} variant="secondary" className="text-[10px]">
                            {m}
                          </Badge>
                        ))}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-semibold tracking-tight">Last cooked</h2>
            {recentLogs.length === 0 ? (
              <Card>
                <CardContent className="text-muted-foreground py-10 text-center text-sm">
                  Log a cook from any recipe page to build history.
                </CardContent>
              </Card>
            ) : (
              <ul className="space-y-2">
                {recentLogs.map((log: { id: string; cooked_at: string; recipes: { title?: string } | null }) => (
                  <li
                    key={log.id}
                    className="border-border flex items-center justify-between gap-2 rounded-xl border bg-card px-3 py-2 text-sm shadow-xs"
                  >
                    <span className="min-w-0 truncate">
                      {log.recipes?.title ?? "Recipe"}
                    </span>
                    <time
                      dateTime={log.cooked_at}
                      className="text-muted-foreground shrink-0 text-xs tabular-nums"
                    >
                      {format(new Date(log.cooked_at), "MMM d")}
                    </time>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
