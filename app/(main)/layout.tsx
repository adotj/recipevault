import { MainShell } from "@/components/layout/main-shell";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MainShell>{children}</MainShell>;
}
