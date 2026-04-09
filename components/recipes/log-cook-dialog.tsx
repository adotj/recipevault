"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { logCookedRecipe } from "@/app/actions/cooked-logs";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function LogCookDialog({
  recipeId,
  trigger,
}: {
  recipeId: string;
  trigger: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<Date>(new Date());
  const [rating, setRating] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  const triggerNode = React.isValidElement<
    React.HTMLAttributes<HTMLElement> & { onClick?: (e: React.MouseEvent) => void }
  >(trigger) ? (
    React.cloneElement(trigger, {
      onClick: (e: React.MouseEvent) => {
        trigger.props.onClick?.(e);
        setOpen(true);
      },
    })
  ) : (
    <Button type="button" variant="default" onClick={() => setOpen(true)}>
      {trigger}
    </Button>
  );

  async function submit() {
    setBusy(true);
    const cooked_at = format(date, "yyyy-MM-dd");
    const res = await logCookedRecipe({
      recipe_id: recipeId,
      cooked_at,
      rating: rating ? Number(rating) : null,
      notes: notes.trim() || null,
    });
    setBusy(false);
    if ("error" in res && res.error) {
      toast.error(res.error);
      return;
    }
    toast.success("Logged cook!");
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      {triggerNode}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Log a cook</DialogTitle>
            <DialogDescription>
              Track when you made this and optionally rate it.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 size-4 opacity-70" aria-hidden />
                  {date ? format(date, "PPP") : "Pick date"}
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rating">Rating (optional)</Label>
              <Select
                value={rating || "none"}
                onValueChange={(v) => setRating(v === "none" || v == null ? "" : v)}
              >
                <SelectTrigger id="rating">
                  <SelectValue placeholder="No rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No rating</SelectItem>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n} star{n > 1 ? "s" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cook-notes">Notes</Label>
              <Textarea
                id="cook-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="How did it go?"
                className="min-h-[80px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="button" disabled={busy} onClick={() => void submit()}>
              {busy ? "Saving…" : "Save log"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
