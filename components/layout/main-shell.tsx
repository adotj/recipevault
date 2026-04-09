"use client";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { CommandMenu } from "@/components/layout/command-menu";

export function MainShell({
  children,
  userEmail,
}: {
  children: React.ReactNode;
  userEmail?: string | null;
}) {
  return (
    <div className="bg-background text-foreground flex min-h-screen">
      <AppSidebar className="hidden md:flex" userEmail={userEmail} />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="no-print border-border md:hidden flex items-center justify-between border-b px-4 py-3">
          <span className="text-primary text-sm font-bold tracking-tight">RecipeVault</span>
        </div>
        <main className="flex-1 px-4 pt-4 pb-24 md:px-8 md:pt-8 md:pb-10">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
      <MobileNav />
      <CommandMenu />
    </div>
  );
}
