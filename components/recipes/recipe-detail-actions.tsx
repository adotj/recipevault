"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Copy,
  Pencil,
  Printer,
  Trash2,
  Flame,
} from "lucide-react";
import type { Recipe } from "@/types";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { duplicateRecipe, deleteRecipe } from "@/app/actions/recipes";
import { LogCookDialog } from "@/components/recipes/log-cook-dialog";
import { toast } from "sonner";

export function RecipeDetailActions({ recipe }: { recipe: Recipe }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [delOpen, setDelOpen] = useState(false);

  function printRecipe() {
    window.print();
  }

  return (
    <div className="no-print flex flex-wrap gap-2">
      <LogCookDialog
        recipeId={recipe.id}
        trigger={
          <Button type="button" variant="default" className="gap-1 rounded-full">
            <Flame className="size-3.5" aria-hidden />
            I cooked this
          </Button>
        }
      />
      <Button
        type="button"
        variant="outline"
        className="gap-1 rounded-full"
        onClick={printRecipe}
      >
        <Printer className="size-3.5" aria-hidden />
        Print
      </Button>
      <Link
        href={`/recipes/${recipe.id}/edit`}
        className={cn(
          buttonVariants({ variant: "outline" }),
          "inline-flex gap-1 rounded-full"
        )}
      >
        <Pencil className="size-3.5" aria-hidden />
        Edit
      </Link>
      <Button
        type="button"
        variant="outline"
        className="gap-1 rounded-full"
        disabled={pending}
        onClick={() => {
          startTransition(async () => {
            try {
              const dup = await duplicateRecipe(recipe.id);
              toast.success("Duplicated");
              router.push(`/recipes/${dup.id}`);
              router.refresh();
            } catch {
              toast.error("Could not duplicate");
            }
          });
        }}
      >
        <Copy className="size-3.5" aria-hidden />
        Duplicate
      </Button>
      <AlertDialog open={delOpen} onOpenChange={setDelOpen}>
        <AlertDialogTrigger
          className={cn(
            buttonVariants({ variant: "destructive" }),
            "inline-flex gap-1 rounded-full"
          )}
        >
          <Trash2 className="size-3.5" aria-hidden />
          Delete
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this recipe?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone. Cook history for this recipe will be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                startTransition(async () => {
                  try {
                    await deleteRecipe(recipe.id);
                    toast.success("Deleted");
                    router.push("/recipes");
                    router.refresh();
                  } catch {
                    toast.error("Delete failed");
                  }
                });
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
