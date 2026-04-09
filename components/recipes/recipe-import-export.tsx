"use client";

import { useRef, useTransition } from "react";
import { Download, Upload } from "lucide-react";
import { exportRecipesJson, importRecipesFromJson } from "@/app/actions/recipes";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function RecipeImportExport() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();

  function download(json: string) {
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `recipevault-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1 rounded-full"
        disabled={pending}
        onClick={() => {
          startTransition(async () => {
            try {
              const json = await exportRecipesJson();
              download(json);
              toast.success("Export started");
            } catch {
              toast.error("Export failed");
            }
          });
        }}
      >
        <Download className="size-3.5" aria-hidden />
        Export JSON
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1 rounded-full"
        disabled={pending}
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="size-3.5" aria-hidden />
        Import JSON
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept="application/json,.json"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          startTransition(async () => {
            try {
              const text = await file.text();
              const res = await importRecipesFromJson(text);
              if (res.error) toast.error(res.error);
              else toast.success(`Imported ${res.imported} recipes`);
              router.refresh();
            } catch {
              toast.error("Import failed");
            } finally {
              e.target.value = "";
            }
          });
        }}
      />
    </div>
  );
}
