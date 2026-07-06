import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Nav } from "@/components/dashboard/nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Belt-and-braces: middleware already guards this, but never render the
  // shell without a verified user.
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-grid">
      <Nav email={user.email ?? "account"} />
      <main className="container py-8">{children}</main>
    </div>
  );
}
