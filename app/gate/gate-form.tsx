"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";

export function GateForm({ nextHref }: { nextHref: string }) {
  const router = useRouter();
  const [passphrase, setPassphrase] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/vault-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passphrase }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        toast.error(data.error ?? "Could not unlock");
        return;
      }
      toast.success("Welcome in");
      router.push(nextHref);
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-muted/30 flex min-h-screen flex-col items-center justify-center p-4">
      <Link
        href="/"
        className="text-foreground mb-8 flex items-center gap-2 text-lg font-bold tracking-tight"
      >
        <span className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-lg shadow-sm">
          <Sparkles className="size-5" aria-hidden />
        </span>
        RecipeVault
      </Link>
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle>Enter passphrase</CardTitle>
          <CardDescription>
            Shared household access. Anyone with the link and passphrase can view and edit recipes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="vault-pass">Passphrase</Label>
              <Input
                id="vault-pass"
                type="password"
                autoComplete="off"
                required
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                className="text-base"
              />
            </div>
            <Button type="submit" className="w-full rounded-full" disabled={loading}>
              {loading ? "Checking…" : "Continue"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
