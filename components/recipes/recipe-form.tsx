"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { createRecipe, updateRecipe } from "@/app/actions/recipes";
import { recipeFormSchema, type RecipeFormValues } from "@/lib/validations/recipe";
import type { IngredientRow, Recipe } from "@/types";
import { MEAL_TYPES } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { RecipeImageUpload } from "@/components/recipes/recipe-image-upload";
import {
  BulkIngredientsPasteDialog,
  BulkIngredientsPasteTriggerButton,
  type BulkIngredientsApplyMode,
} from "@/components/recipes/bulk-ingredients-paste-dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const emptyNutrition = {
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
  fiber: 0,
  sugar: 0,
  sodium: 0,
};

function isEmptyNutrition(n: unknown): boolean {
  if (!n || typeof n !== "object") return false;
  const o = n as Record<string, unknown>;
  return (
    o.calories === 0 &&
    o.protein === 0 &&
    o.carbs === 0 &&
    o.fat === 0 &&
    o.fiber === 0 &&
    o.sugar === 0 &&
    o.sodium === 0
  );
}

function recipeToFormDefaults(r?: Recipe | null): RecipeFormValues {
  if (!r) {
    return {
      title: "",
      description: null,
      meal_types: ["Dinner"],
      ingredients: [{ name: "", quantity: "" }],
      instructions: null,
      prep_time: null,
      cook_time: null,
      servings: 4,
      nutrition: null,
      image_url: null,
      tags: [],
      notes: null,
      favorite: false,
    };
  }
  return {
    title: r.title,
    description: r.description,
    meal_types: r.meal_types.length ? r.meal_types : ["Dinner"],
    ingredients:
      r.ingredients.length > 0
        ? r.ingredients
        : [{ name: "", quantity: "" }],
    instructions: r.instructions,
    prep_time: r.prep_time,
    cook_time: r.cook_time,
    servings: r.servings,
    nutrition: r.nutrition,
    image_url: r.image_url,
    tags: r.tags,
    notes: r.notes,
    favorite: r.favorite,
  };
}

export function RecipeForm({
  recipe,
  className,
}: {
  recipe?: Recipe | null;
  className?: string;
}) {
  const router = useRouter();
  /** When true, server runs Edamam (if configured) on save and overwrites macros. */
  const [autoNutrition, setAutoNutrition] = useState(true);
  const [bulkPasteOpen, setBulkPasteOpen] = useState(false);

  const defaults = useMemo(() => recipeToFormDefaults(recipe), [recipe]);

  const form = useForm<RecipeFormValues>({
    resolver: zodResolver(recipeFormSchema) as Resolver<RecipeFormValues>,
    defaultValues: defaults,
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "ingredients",
  });

  const tagsInput = form.watch("tags")?.join(", ") ?? "";

  function applyBulkIngredients(rows: IngredientRow[], mode: BulkIngredientsApplyMode) {
    const cleaned = rows.filter((r) => r.name.trim() || r.quantity.trim());
    if (cleaned.length === 0) {
      toast.error("Couldn't parse any ingredients. Use one line per item.");
      return;
    }
    const current = form.getValues("ingredients");
    const next =
      mode === "replace"
        ? cleaned
        : [...current.filter((r) => r.name.trim() || r.quantity.trim()), ...cleaned];
    form.setValue("ingredients", next.length ? next : [{ name: "", quantity: "" }], {
      shouldValidate: true,
      shouldDirty: true,
    });
    toast.success(
      mode === "replace"
        ? `Replaced with ${cleaned.length} ingredients`
        : `Added ${cleaned.length} ingredients`
    );
  }

  async function onSubmit(values: RecipeFormValues) {
    const nutritionForSave = autoNutrition
      ? values.nutrition
      : ({ ...emptyNutrition, ...values.nutrition } as NonNullable<RecipeFormValues["nutrition"]>);

    const payload = {
      ...values,
      nutrition: nutritionForSave,
    };

    const opts = { recalculateNutrition: autoNutrition };

    if (recipe?.id) {
      const res = await updateRecipe(recipe.id, payload, opts);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Recipe updated");
      router.push(`/recipes/${recipe.id}`);
      router.refresh();
      return;
    }

    const res = await createRecipe(payload, opts);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    toast.success("Recipe saved");
    if (res.recipe) router.push(`/recipes/${res.recipe.id}`);
    router.refresh();
  }

  const busy = form.formState.isSubmitting;

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className={cn("space-y-8", className)}
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" className="mt-1.5" {...form.register("title")} />
            {form.formState.errors.title ? (
              <p className="text-destructive mt-1 text-xs">
                {form.formState.errors.title.message}
              </p>
            ) : null}
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              className="mt-1.5 min-h-[72px]"
              {...form.register("description")}
            />
          </div>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Meal types</legend>
            <div className="flex flex-wrap gap-3">
              {MEAL_TYPES.map((m) => (
                <label key={m} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={form.watch("meal_types").includes(m)}
                    onCheckedChange={(checked) => {
                      const cur = form.getValues("meal_types");
                      if (checked)
                        form.setValue("meal_types", [...cur, m], {
                          shouldValidate: true,
                        });
                      else
                        form.setValue(
                          "meal_types",
                          cur.filter((x) => x !== m),
                          { shouldValidate: true }
                        );
                    }}
                  />
                  {m}
                </label>
              ))}
            </div>
            {form.formState.errors.meal_types ? (
              <p className="text-destructive text-xs">
                {form.formState.errors.meal_types.message as string}
              </p>
            ) : null}
          </fieldset>
        </div>
        <div>
          <Label className="mb-2 block">Photo</Label>
          <RecipeImageUpload
            value={form.watch("image_url")}
            onChange={(url) =>
              form.setValue("image_url", url, { shouldValidate: true, shouldDirty: true })
            }
          />
        </div>
      </div>

      <Separator />

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold">Ingredients</h2>
            <p className="text-muted-foreground text-xs">
              Natural language lines power Edamam nutrition parsing. Paste a whole list from an LLM with{" "}
              <strong>Paste list</strong>.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <BulkIngredientsPasteTriggerButton onClick={() => setBulkPasteOpen(true)} />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={() => append({ name: "", quantity: "" })}
            >
              <Plus className="size-3.5" aria-hidden />
              Add line
            </Button>
          </div>
        </div>
        <BulkIngredientsPasteDialog
          open={bulkPasteOpen}
          onOpenChange={setBulkPasteOpen}
          onApply={(rows, mode) => applyBulkIngredients(rows, mode)}
        />
        {/* Native overflow: Base UI ScrollArea + max-h-only broke h-full on the viewport, so long lists painted over the next section. */}
        <div
          className="max-h-[min(420px,55dvh)] overflow-y-auto overflow-x-hidden overscroll-y-contain rounded-lg border [scrollbar-gutter:stable] [-webkit-overflow-scrolling:touch]"
        >
          <ul className="space-y-2 p-3">
            {fields.map((field, index) => (
              <li key={field.id} className="flex flex-col gap-2 sm:flex-row sm:items-start">
                <div className="flex-1 space-y-1">
                  <Label className="sr-only" htmlFor={`ing-q-${index}`}>
                    Quantity {index + 1}
                  </Label>
                  <Input
                    id={`ing-q-${index}`}
                    placeholder="e.g. 2 cups"
                    {...form.register(`ingredients.${index}.quantity`)}
                  />
                </div>
                <div className="sm:flex-[2] space-y-1">
                  <Label className="sr-only" htmlFor={`ing-n-${index}`}>
                    Ingredient {index + 1}
                  </Label>
                  <Input
                    id={`ing-n-${index}`}
                    placeholder="ingredient name"
                    {...form.register(`ingredients.${index}.name`)}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => remove(index)}
                  disabled={fields.length <= 1}
                  aria-label={`Remove ingredient ${index + 1}`}
                >
                  <Trash2 className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="space-y-2">
        <Label htmlFor="instructions">Instructions</Label>
        <Textarea
          id="instructions"
          placeholder="Numbered steps optional — write naturally."
          className="min-h-[160px]"
          {...form.register("instructions")}
        />
      </section>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <Label htmlFor="prep">Prep (min)</Label>
          <Input
            id="prep"
            type="number"
            min={0}
            className="mt-1.5"
            onChange={(e) => {
              const v = e.target.value;
              form.setValue("prep_time", v === "" ? null : Number(v), {
                shouldValidate: true,
              });
            }}
            value={form.watch("prep_time") ?? ""}
          />
        </div>
        <div>
          <Label htmlFor="cook">Cook (min)</Label>
          <Input
            id="cook"
            type="number"
            min={0}
            className="mt-1.5"
            onChange={(e) => {
              const v = e.target.value;
              form.setValue("cook_time", v === "" ? null : Number(v), {
                shouldValidate: true,
              });
            }}
            value={form.watch("cook_time") ?? ""}
          />
        </div>
        <div>
          <Label htmlFor="servings">Servings</Label>
          <Input
            id="servings"
            type="number"
            min={1}
            className="mt-1.5"
            {...form.register("servings", { valueAsNumber: true })}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="tags">Tags</Label>
          <Input
            id="tags"
            className="mt-1.5"
            placeholder="comma separated"
            value={tagsInput}
            onChange={(e) => {
              const raw = e.target.value;
              const tags = raw
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean);
              form.setValue("tags", tags, { shouldDirty: true });
            }}
          />
        </div>
        <div className="flex items-end gap-3 pb-1">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={form.watch("favorite")}
              onCheckedChange={(c) =>
                form.setValue("favorite", Boolean(c), { shouldDirty: true })
              }
            />
            Favorite
          </label>
        </div>
      </div>

      <div>
        <Label htmlFor="notes">How it turned out</Label>
        <Textarea id="notes" className="mt-1.5 min-h-[80px]" {...form.register("notes")} />
      </div>

      <Separator />

      <section className="space-y-4 rounded-xl border bg-card p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">Nutrition</h2>
            <p className="text-muted-foreground text-xs">
              Auto-calculates from ingredients on save (Edamam). Turn off to type macros by hand.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="auto-nutrition"
              checked={autoNutrition}
              onCheckedChange={(c) => {
                setAutoNutrition(c);
                if (c) {
                  // Only clear when it's the placeholder all-zeros object.
                  const cur = form.getValues("nutrition");
                  if (isEmptyNutrition(cur)) form.setValue("nutrition", null);
                } else if (!form.getValues("nutrition")) {
                  form.setValue("nutrition", { ...emptyNutrition });
                }
              }}
              aria-label="Auto-calculate nutrition on save"
            />
            <Label htmlFor="auto-nutrition" className="text-sm font-normal">
              Auto on save
            </Label>
          </div>
        </div>

        {!autoNutrition ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {(
              [
                ["calories", "Calories"],
                ["protein", "Protein (g)"],
                ["carbs", "Carbs (g)"],
                ["fat", "Fat (g)"],
                ["fiber", "Fiber (g)"],
                ["sugar", "Sugar (g)"],
                ["sodium", "Sodium (mg)"],
              ] as const
            ).map(([key, label]) => (
              <div key={key}>
                <Label htmlFor={`n-${key}`}>{label}</Label>
                <Input
                  id={`n-${key}`}
                  type="number"
                  min={0}
                  step={key === "sodium" ? 1 : 0.1}
                  className="mt-1"
                  value={
                    (() => {
                      const n = form.watch("nutrition");
                      if (!n) return "";
                      const val = n[key];
                      return val === undefined || val === null ? "" : val;
                    })()
                  }
                  onChange={(e) => {
                    const v = e.target.value === "" ? 0 : Number(e.target.value);
                    const n = form.getValues("nutrition") ?? { ...emptyNutrition };
                    form.setValue(
                      "nutrition",
                      { ...n, [key]: v } as NonNullable<RecipeFormValues["nutrition"]>,
                      { shouldValidate: true, shouldDirty: true }
                    );
                  }}
                />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">
            Macros update when you save, using your ingredient lines. Configure{" "}
            <code className="bg-muted rounded px-1 text-xs">EDAMAM_APP_ID</code> and{" "}
            <code className="bg-muted rounded px-1 text-xs">EDAMAM_APP_KEY</code>.
          </p>
        )}
      </section>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={busy} className="gap-2 rounded-full">
          {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          {recipe ? "Save changes" : "Create recipe"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={() => router.back()}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
