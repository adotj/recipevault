"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import type { Recipe } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function RecipeSuggestions({
  pairs,
}: {
  pairs: { meal: string; recipe: Recipe }[];
}) {
  if (pairs.length === 0) {
    return (
      <Card>
        <CardContent className="text-muted-foreground py-10 text-center text-sm">
          Add recipes with meal types to get tailored ideas here.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {pairs.map(({ meal, recipe }, i) => (
        <motion.div
          key={`${meal}-${recipe.id}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05, duration: 0.25 }}
        >
          <Link
            href={`/recipes/${recipe.id}`}
            className="focus-visible:ring-ring group block rounded-2xl focus-visible:ring-2 focus-visible:outline-none"
          >
            <Card className="border-border/80 group-hover:border-primary/40 h-full overflow-hidden shadow-sm transition-colors">
              <div className="relative aspect-[4/3] bg-muted">
                {recipe.image_url ? (
                  <Image
                    src={recipe.image_url}
                    alt=""
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    sizes="(max-width: 768px) 100vw, 25vw"
                  />
                ) : (
                  <div className="text-muted-foreground flex h-full items-center justify-center text-xs">
                    No image
                  </div>
                )}
                <Badge className="absolute top-2 left-2 rounded-md shadow-sm">
                  {meal}
                </Badge>
              </div>
              <CardContent className="space-y-1 p-3">
                <p className="line-clamp-2 text-sm font-semibold leading-snug">
                  {recipe.title}
                </p>
                {recipe.nutrition ? (
                  <p className="text-muted-foreground text-xs tabular-nums">
                    {Math.round(recipe.nutrition.calories)} kcal ·{" "}
                    {recipe.nutrition.protein}g protein
                  </p>
                ) : null}
              </CardContent>
            </Card>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
