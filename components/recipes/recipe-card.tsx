"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Heart, Timer } from "lucide-react";
import type { Recipe } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toggleFavorite } from "@/app/actions/recipes";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function RecipeCard({
  recipe,
  className,
  layout = "grid",
}: {
  recipe: Recipe;
  className?: string;
  layout?: "grid" | "list";
}) {
  const router = useRouter();
  async function onFav(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    try {
      await toggleFavorite(recipe.id, !recipe.favorite);
      toast.success(recipe.favorite ? "Removed from favorites" : "Marked favorite");
      router.refresh();
    } catch {
      toast.error("Could not update favorite");
    }
  }

  const totalTime =
    (recipe.prep_time ?? 0) + (recipe.cook_time ?? 0) || null;

  if (layout === "list") {
    return (
      <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <Link
          href={`/recipes/${recipe.id}`}
          className={cn(
            "focus-visible:ring-ring group flex gap-4 rounded-2xl border bg-card p-3 shadow-sm transition-colors hover:border-primary/35 focus-visible:ring-2 focus-visible:outline-none",
            className
          )}
        >
          <div className="bg-muted relative size-24 shrink-0 overflow-hidden rounded-xl sm:size-28">
            {recipe.image_url ? (
              <Image
                src={recipe.image_url}
                alt=""
                fill
                className="object-cover"
                sizes="112px"
              />
            ) : (
              <div className="text-muted-foreground flex h-full items-center justify-center text-[10px]">
                No photo
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h3 className="line-clamp-2 font-semibold leading-snug">
                {recipe.title}
              </h3>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="shrink-0 text-muted-foreground hover:text-primary"
                onClick={(e) => void onFav(e)}
                aria-label={recipe.favorite ? "Unfavorite" : "Favorite"}
              >
                <Heart
                  className={cn("size-4", recipe.favorite && "fill-primary text-primary")}
                  aria-hidden
                />
              </Button>
            </div>
            <div className="flex flex-wrap gap-1">
              {recipe.meal_types.map((m) => (
                <Badge key={m} variant="secondary" className="text-[10px]">
                  {m}
                </Badge>
              ))}
            </div>
            <div className="text-muted-foreground flex flex-wrap items-center gap-3 text-xs tabular-nums">
              {recipe.nutrition ? (
                <span>
                  {Math.round(recipe.nutrition.calories)} kcal ·{" "}
                  {recipe.nutrition.protein}g P
                </span>
              ) : null}
              {totalTime ? (
                <span className="flex items-center gap-1">
                  <Timer className="size-3" aria-hidden />
                  {totalTime}m
                </span>
              ) : null}
            </div>
          </div>
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn("h-full", className)}
    >
      <Link
        href={`/recipes/${recipe.id}`}
        className="focus-visible:ring-ring group block h-full rounded-2xl focus-visible:ring-2 focus-visible:outline-none"
      >
        <Card className="border-border/80 group-hover:border-primary/40 h-full overflow-hidden pt-0 shadow-sm transition-colors">
          <div className="relative aspect-[4/3] bg-muted">
            {recipe.image_url ? (
              <Image
                src={recipe.image_url}
                alt=""
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 300px"
              />
            ) : (
              <div className="text-muted-foreground flex h-full items-center justify-center text-xs">
                No image
              </div>
            )}
            <Button
              type="button"
              variant="secondary"
              size="icon-sm"
              className="absolute top-2 right-2 z-10 opacity-90 shadow-md"
              onClick={(e) => void onFav(e)}
              aria-label={recipe.favorite ? "Unfavorite" : "Favorite"}
            >
              <Heart
                className={cn("size-4", recipe.favorite && "fill-primary text-primary")}
                aria-hidden
              />
            </Button>
          </div>
          <CardContent className="space-y-2 p-3">
            <h3 className="line-clamp-2 text-sm font-semibold leading-snug">
              {recipe.title}
            </h3>
            <div className="flex flex-wrap gap-1">
              {recipe.meal_types.slice(0, 3).map((m) => (
                <Badge key={m} variant="outline" className="text-[10px]">
                  {m}
                </Badge>
              ))}
            </div>
            <div className="text-muted-foreground flex items-center justify-between gap-2 text-xs">
              {recipe.nutrition ? (
                <span className="tabular-nums">
                  {Math.round(recipe.nutrition.calories)} kcal
                </span>
              ) : (
                <span />
              )}
              {totalTime ? (
                <span className="flex items-center gap-0.5 tabular-nums">
                  <Timer className="size-3 opacity-70" aria-hidden />
                  {totalTime}m
                </span>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
