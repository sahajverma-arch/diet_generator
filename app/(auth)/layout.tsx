import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { APP_TAGLINE } from "@/lib/theme";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between bg-brand-black p-12 text-white lg:flex">
        <div className="absolute inset-0 bg-grid opacity-[0.06]" />
        <Link href="/" className="relative">
          <Logo size="xl" />
        </Link>
        <div className="relative space-y-6">
          <div className="h-1.5 w-16 rounded bg-brand-yellow" />
          <h1 className="max-w-md text-4xl font-bold leading-tight">
            Turn any diet PDF into a{" "}
            <span className="text-brand-yellow">premium report</span> in seconds.
          </h1>
          <p className="max-w-md text-white/60">
            {APP_TAGLINE}. Upload a plan, let AI extract calories, macros,
            micronutrients, training and recovery — then export a beautiful,
            on-brand PDF for your client.
          </p>
        </div>
        <p className="relative text-xs text-white/40">
          © {new Date().getFullYear()} LEANR. For coaching use only — not medical advice.
        </p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Logo size="lg" />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
