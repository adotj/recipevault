import { createClient } from "@/lib/supabase/server";
import { MainShell } from "@/components/layout/main-shell";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <MainShell userEmail={user?.email}>{children}</MainShell>;
}
