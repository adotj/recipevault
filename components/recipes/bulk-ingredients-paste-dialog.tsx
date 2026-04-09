"use client";

import { useState } from "react";
import { ClipboardPaste } from "lucide-react";
import { parseIngredientsFromBulkPaste } from "@/lib/parse-ingredients-bulk";
import type { IngredientRow } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export type BulkIngredientsApplyMode = "append" | "replace";

export function BulkIngredientsPasteDialog({
  open,
  onOpenChange,
  onApply,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (rows: IngredientRow[], mode: BulkIngredientsApplyMode) => void;
}) {
  const [text, setText] = useState("");

  function handleApply(mode: BulkIngredientsApplyMode) {
    const rows = parseIngredientsFromBulkPaste(text);
    onApply(rows, mode);
    setText("");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardPaste className="size-4 opacity-70" aria-hidden />
            Paste ingredients
          </DialogTitle>
          <DialogDescription>
            Paste a list from Grok, Gemini, etc. — one ingredient per line. Amounts like{" "}
            <code className="bg-muted rounded px-1">2 cups</code> or{" "}
            <code className="bg-muted rounded px-1">½ tsp</code> are split into quantity and name. Bullets
            and numbering are stripped.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="bulk-ingredients">Ingredient list</Label>
          <Textarea
            id="bulk-ingredients"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={
              "2 cups all-purpose flour\n1 tsp kosher salt\n3 large eggs\n- ½ cup melted butter\n\n(or markdown bullets / numbered lists)"
            }
            className="min-h-[200px] font-mono text-sm"
            autoFocus
          />
        </div>
        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => handleApply("append")}
            disabled={!text.trim()}
          >
            Append to list
          </Button>
          <Button
            type="button"
            onClick={() => handleApply("replace")}
            disabled={!text.trim()}
          >
            Replace list
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function BulkIngredientsPasteTriggerButton({
  onClick,
}: {
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      className="gap-1"
      onClick={onClick}
    >
      <ClipboardPaste className="size-3.5" aria-hidden />
      Paste list
    </Button>
  );
}
