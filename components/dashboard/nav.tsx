import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { UserMenu } from "@/components/dashboard/user-menu";
import { NavLinks } from "@/components/dashboard/nav-links";

export function Nav({ email }: { email: string }) {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="container flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" aria-label="LEANR home">
            <Logo size="md" />
          </Link>
          <NavLinks />
        </div>
        <UserMenu email={email} />
      </div>
    </header>
  );
}
