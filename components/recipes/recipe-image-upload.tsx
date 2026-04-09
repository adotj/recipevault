"use client";

import { useState } from "react";
import Image from "next/image";
import { Upload, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function RecipeImageUpload({
  value,
  onChange,
  className,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  className?: string;
}) {
  const [uploading, setUploading] = useState(false);

  async function onFile(file: File | null) {
    if (!file) return;
    setUploading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Sign in to upload images.");
        return;
      }
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from("recipe-images")
        .upload(path, file, { upsert: true });
      if (error) throw error;
      const {
        data: { publicUrl },
      } = supabase.storage.from("recipe-images").getPublicUrl(path);
      onChange(publicUrl);
      toast.success("Image uploaded");
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div
        className="border-border bg-muted/40 relative flex aspect-video max-h-56 w-full max-w-md items-center justify-center overflow-hidden rounded-xl border-2 border-dashed"
      >
        {value ? (
          <>
            <Image src={value} alt="" fill className="object-cover" sizes="(max-width:768px) 100vw, 400px" />
            <Button
              type="button"
              variant="secondary"
              size="icon-sm"
              className="absolute top-2 right-2 shadow-md"
              onClick={() => onChange(null)}
              aria-label="Remove image"
            >
              <X className="size-4" />
            </Button>
          </>
        ) : (
          <label className="text-muted-foreground hover:text-foreground flex cursor-pointer flex-col items-center gap-2 p-6 text-center text-sm transition-colors">
            <Upload className="size-8 opacity-60" aria-hidden />
            <span>{uploading ? "Uploading…" : "Click to upload or drag in (browser)"}</span>
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              disabled={uploading}
              onChange={(e) => void onFile(e.target.files?.[0] ?? null)}
            />
          </label>
        )}
      </div>
      {value ? (
        <label
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            uploading && "pointer-events-none opacity-50",
            "cursor-pointer"
          )}
        >
          Replace image
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            disabled={uploading}
            onChange={(e) => void onFile(e.target.files?.[0] ?? null)}
          />
        </label>
      ) : null}
    </div>
  );
}
