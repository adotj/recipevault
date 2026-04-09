"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { addDays, format, parseISO } from "date-fns";
import { addDaysIso } from "@/lib/dates";
import { ChevronLeft, ChevronRight, Dices, Trash2 } from "lucide-react";
import Link from "next/link";
import type { MealPlanRow, MealPlanSlot, MealType, Recipe } from "@/types";
import {
  clearMealPlanDay,
  clearMealPlanWeek,
  fetchMealPlansRange,
  upsertMealPlan,
} from "@/app/actions/meal-plans";
import { sumNutrition } from "@/lib/recipe-filters";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const SLOTS: { key: MealPlanSlot; label: string }[] = [
  { key: "breakfast", label: "Breakfast" },
  { key: "lunch", label: "Lunch" },
  { key: "dinner", label: "Dinner" },
  { key: "snack", label: "Snack" },
  { key: "dessert", label: "Dessert" },
];

const SLOT_TO_MEAL: Record<MealPlanSlot, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
  dessert: "Dessert",
};

const COL: Record<MealPlanSlot, keyof MealPlanRow> = {
  breakfast: "breakfast_recipe_id",
  lunch: "lunch_recipe_id",
  dinner: "dinner_recipe_id",
  snack: "snack_recipe_id",
  dessert: "dessert_recipe_id",
};

function slotForDragId(id: string | undefined): MealPlanSlot | null {
  if (!id || !id.includes("|")) return null;
  const slot = id.split("|")[1] as MealPlanSlot;
  return SLOTS.some((s) => s.key === slot) ? slot : null;
}

function dateForDragId(id: string | undefined) {
  if (!id || !id.includes("|")) return null;
  return id.split("|")[0] ?? null;
}

function mapPlansByDate(rows: MealPlanRow[]) {
  const m = new Map<string, MealPlanRow>();
  for (const r of rows) m.set(r.plan_date, r);
  return m;
}

function DraggableRecipeChip({
  recipe,
  disabled,
}: {
  recipe: Recipe;
  disabled?: boolean;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `recipe:${recipe.id}`,
    disabled,
  });
  return (
    <button
      type="button"
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(
        "border-border bg-card max-w-[140px] cursor-grab rounded-lg border px-2 py-1 text-left text-xs shadow-sm active:cursor-grabbing",
        isDragging && "opacity-50"
      )}
    >
      <span className="line-clamp-2 font-medium">{recipe.title}</span>
    </button>
  );
}

function DroppableCell({
  id,
  label,
  recipe,
  children,
}: {
  id: string;
  label: string;
  recipe: Recipe | null;
  children?: React.ReactNode;
}) {
  const { isOver, setNodeRef } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "border-border bg-muted/20 min-h-[72px] rounded-xl border border-dashed p-2 transition-colors",
        isOver && "border-primary bg-primary/5"
      )}
    >
      <p className="text-muted-foreground mb-1 text-[10px] font-medium tracking-wide uppercase">
        {label}
      </p>
      {recipe ? (
        <Link
          href={`/recipes/${recipe.id}`}
          className="text-primary text-sm font-medium hover:underline"
        >
          {recipe.title}
        </Link>
      ) : (
        <p className="text-muted-foreground text-xs">Drop a recipe</p>
      )}
      {children}
    </div>
  );
}

function DayMacroSummary({ recipes }: { recipes: (Recipe | null | undefined)[] }) {
  const t = sumNutrition(recipes);
  return (
    <div className="text-muted-foreground flex flex-wrap gap-2 text-[10px] tabular-nums">
      <span>{Math.round(t.calories)} kcal</span>
      <span>{Math.round(t.protein)}g P</span>
      <span>{Math.round(t.carbs)}g C</span>
      <span>{Math.round(t.fat)}g F</span>
    </div>
  );
}

export function WeeklyPlanner({
  recipes,
  initialWeekStart,
  initialPlans,
}: {
  recipes: Recipe[];
  initialWeekStart: string;
  initialPlans: MealPlanRow[];
}) {
  const [weekStart, setWeekStart] = useState(initialWeekStart);
  const [planMap, setPlanMap] = useState(() => mapPlansByDate(initialPlans));
  const [activeId, setActiveId] = useState<string | null>(null);
  const [highProtein, setHighProtein] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const recipeById = useMemo(() => {
    const m = new Map<string, Recipe>();
    for (const r of recipes) m.set(r.id, r);
    return m;
  }, [recipes]);

  const weekEnd = useMemo(() => addDaysIso(weekStart, 6), [weekStart]);

  const days = useMemo(() => {
    const start = parseISO(weekStart);
    return Array.from({ length: 7 }, (_, i) =>
      format(addDays(start, i), "yyyy-MM-dd")
    );
  }, [weekStart]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const rows = await fetchMealPlansRange(weekStart, weekEnd);
      if (!cancelled) setPlanMap(mapPlansByDate(rows));
    })();
    return () => {
      cancelled = true;
    };
  }, [weekStart, weekEnd]);

  const getSlotRecipe = useCallback(
    (date: string, slot: MealPlanSlot): Recipe | null => {
      const row = planMap.get(date);
      if (!row) return null;
      const col = COL[slot];
      const id = row[col] as string | null;
      if (!id) return null;
      return recipeById.get(id) ?? null;
    },
    [planMap, recipeById]
  );

  const persistSlot = useCallback(
    async (date: string, slot: MealPlanSlot, recipeId: string | null) => {
      const prev = planMap.get(date);
      const base: Record<string, string | null> = {
        breakfast_recipe_id: prev?.breakfast_recipe_id ?? null,
        lunch_recipe_id: prev?.lunch_recipe_id ?? null,
        dinner_recipe_id: prev?.dinner_recipe_id ?? null,
        snack_recipe_id: prev?.snack_recipe_id ?? null,
        dessert_recipe_id: prev?.dessert_recipe_id ?? null,
      };
      base[COL[slot]] = recipeId;
      const res = await upsertMealPlan({
        plan_date: date,
        ...base,
      });
      if (res.error) {
        toast.error(res.error);
        return;
      }
      if (res.plan) {
        setPlanMap((m) => {
          const next = new Map(m);
          next.set(date, res.plan!);
          return next;
        });
      }
    },
    [planMap]
  );

  async function onDragEnd(e: DragEndEvent) {
    const overId = e.over?.id?.toString();
    const active = e.active.id.toString();
    if (!overId || !active.startsWith("recipe:")) return;
    const recipeId = active.replace("recipe:", "");
    const date = dateForDragId(overId);
    const slot = slotForDragId(overId);
    if (!date || !slot) return;
    await persistSlot(date, slot, recipeId);
  }

  async function quickPick() {
    const pickFor = (slot: MealPlanSlot): string | null => {
      const meal = SLOT_TO_MEAL[slot];
      let pool = recipes.filter((r) =>
        r.meal_types.includes(meal as MealType)
      );
      if (highProtein) {
        pool = [...pool].sort(
          (a, b) => (b.nutrition?.protein ?? 0) - (a.nutrition?.protein ?? 0)
        );
      }
      if (pool.length === 0) return null;
      const pick = pool[Math.floor(Math.random() * pool.length)];
      return pick ? pick.id : null;
    };

    for (const date of days) {
      const nextRow: Record<string, string | null> = {
        breakfast_recipe_id: pickFor("breakfast"),
        lunch_recipe_id: pickFor("lunch"),
        dinner_recipe_id: pickFor("dinner"),
        snack_recipe_id: pickFor("snack"),
        dessert_recipe_id: pickFor("dessert"),
      };
      const res = await upsertMealPlan({ plan_date: date, ...nextRow });
      if (res.error) toast.error(res.error);
      else if (res.plan)
        setPlanMap((m) => new Map(m).set(date, res.plan!));
    }
    toast.success("Week filled with quick picks");
  }

  const weekEndLabel = format(parseISO(weekEnd), "MMM d");
  const weekStartLabel = format(parseISO(weekStart), "MMM d");

  return (
    <DndContext
      sensors={sensors}
      onDragStart={(e) => setActiveId(e.active.id.toString())}
      onDragEnd={(e) => {
        setActiveId(null);
        void onDragEnd(e);
      }}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="space-y-6">
        <div className="no-print flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              aria-label="Previous week"
              onClick={() =>
                setWeekStart(
                  format(addDays(parseISO(weekStart), -7), "yyyy-MM-dd")
                )
              }
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              aria-label="Next week"
              onClick={() =>
                setWeekStart(
                  format(addDays(parseISO(weekStart), 7), "yyyy-MM-dd")
                )
              }
            >
              <ChevronRight className="size-4" />
            </Button>
            <span className="text-muted-foreground text-sm tabular-nums">
              {weekStartLabel} – {weekEndLabel}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Switch
                id="hi-pro"
                checked={highProtein}
                onCheckedChange={setHighProtein}
              />
              <Label htmlFor="hi-pro" className="text-xs font-normal">
                Bias high protein
              </Label>
            </div>
            <Button
              type="button"
              variant="secondary"
              className="gap-1 rounded-full"
              onClick={() => void quickPick()}
            >
              <Dices className="size-3.5" aria-hidden />
              Quick pick week
            </Button>
            <Button
              type="button"
              variant="outline"
              className="gap-1 rounded-full"
              onClick={() => {
                void (async () => {
                  const res = await clearMealPlanWeek(weekStart, weekEnd);
                  if ("error" in res && res.error) toast.error(res.error);
                  else {
                    const rows = await fetchMealPlansRange(weekStart, weekEnd);
                    setPlanMap(mapPlansByDate(rows));
                    toast.success("Week cleared");
                  }
                })();
              }}
            >
              <Trash2 className="size-3.5" aria-hidden />
              Clear week
            </Button>
          </div>
        </div>

        <Card className="no-print">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Drag recipes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="no-scrollbar flex w-full gap-2 overflow-x-auto pb-2">
              {recipes.slice(0, 40).map((r) => (
                <DraggableRecipeChip key={r.id} recipe={r} />
              ))}
            </div>
            <p className="text-muted-foreground text-xs">
              Tip: tap a cell on mobile to assign in the full recipe list below (drag works best on desktop).
            </p>
          </CardContent>
        </Card>

        <Card className="border-dashed">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Week totals</CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const all: Recipe[] = [];
              for (const date of days) {
                for (const s of SLOTS) {
                  const r = getSlotRecipe(date, s.key);
                  if (r) all.push(r);
                }
              }
              const t = sumNutrition(all);
              return (
                <p className="text-muted-foreground text-sm tabular-nums">
                  Planned meals: {all.length} · {Math.round(t.calories)} kcal ·{" "}
                  {Math.round(t.protein)}g protein · {Math.round(t.carbs)}g carbs ·{" "}
                  {Math.round(t.fat)}g fat
                  <span className="mt-1 block text-xs">
                    Sums per-serving macros across every assigned slot (same recipe repeated
                    on multiple days counts each time).
                  </span>
                </p>
              );
            })()}
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:grid-cols-7">
          {days.map((date) => {
            const dayRecipes = SLOTS.map((s) => getSlotRecipe(date, s.key));
            const label = format(parseISO(date), "EEE MMM d");
            return (
              <Card key={date} className="flex flex-col">
                <CardHeader className="space-y-2 pb-2">
                  <CardTitle className="text-sm font-semibold">{label}</CardTitle>
                  <DayMacroSummary recipes={dayRecipes} />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground h-7 self-start px-1 text-[10px]"
                    onClick={() => {
                      void (async () => {
                        const res = await clearMealPlanDay(date);
                        if ("error" in res && res.error) toast.error(res.error);
                        else {
                          setPlanMap((m) => {
                            const next = new Map(m);
                            next.delete(date);
                            return next;
                          });
                          toast.success("Day cleared");
                        }
                      })();
                    }}
                  >
                    Clear day
                  </Button>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-2 pt-0">
                  {SLOTS.map((s) => (
                    <DroppableCell
                      key={s.key}
                      id={`${date}|${s.key}`}
                      label={s.label}
                      recipe={getSlotRecipe(date, s.key)}
                    />
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <DragOverlay>
        {activeId?.startsWith("recipe:") ? (
          <Badge variant="secondary" className="shadow-md">
            {recipeById.get(activeId.replace("recipe:", ""))?.title}
          </Badge>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
