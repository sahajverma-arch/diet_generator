import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 text-center">
      <Logo size="lg" />
      <div>
        <p className="text-6xl font-black text-brand-yellow">404</p>
        <h1 className="mt-2 text-xl font-semibold">Page not found</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
      </div>
      <Button asChild variant="brand">
        <Link href="/dashboard">Back to dashboard</Link>
      </Button>
    </div>
  );
}
