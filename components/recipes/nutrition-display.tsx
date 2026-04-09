"use client";

import type { NutritionFacts } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

function MacroBar({
  label,
  value,
  max,
  barClassName,
}: {
  label: string;
  value: number;
  max: number;
  barClassName?: string;
}) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums">{value}g</span>
      </div>
      <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
        <div
          className={cn("h-full rounded-full transition-all", barClassName)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function NutritionDisplay({
  nutrition,
  className,
  title = "Nutrition (per serving)",
}: {
  nutrition: NutritionFacts | null | undefined;
  className?: string;
  title?: string;
}) {
  if (!nutrition) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">
          Save the recipe with ingredients to auto-calculate macros, or enter them
          manually.
        </CardContent>
      </Card>
    );
  }

  const maxMacro = Math.max(nutrition.protein, nutrition.carbs, nutrition.fat, 1) * 1.2;

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
        <Badge variant="secondary" className="tabular-nums">
          {Math.round(nutrition.calories)} kcal
        </Badge>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-3">
          <MacroBar
            label="Protein"
            value={nutrition.protein}
            max={maxMacro}
            barClassName="bg-blue-500/85"
          />
          <MacroBar
            label="Carbs"
            value={nutrition.carbs}
            max={maxMacro}
            barClassName="bg-amber-500/85"
          />
          <MacroBar
            label="Fat"
            value={nutrition.fat}
            max={maxMacro}
            barClassName="bg-rose-500/85"
          />
        </div>
        <dl className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <dt className="text-muted-foreground">Fiber</dt>
            <dd className="font-medium tabular-nums">{nutrition.fiber} g</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Sugar</dt>
            <dd className="font-medium tabular-nums">{nutrition.sugar} g</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-muted-foreground">Sodium</dt>
            <dd className="font-medium tabular-nums">{nutrition.sodium} mg</dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
