import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * LEANR × Fitelo brand mark.
 *
 * Renders the real logo asset (`/public/logo.png` — yellow/white artwork on a
 * transparent background) inside a black badge. The badge keeps the mark legible
 * on light surfaces (top nav, auth form) and blends seamlessly into dark ones
 * (the auth brand panel), so one component works everywhere.
 */
const SIZES = {
  sm: "h-5",
  md: "h-6", // top nav
  lg: "h-7", // mobile auth header, 404
  xl: "h-9", // auth brand panel
} as const;

export function Logo({
  size = "md",
  className,
}: {
  size?: keyof typeof SIZES;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md bg-brand-black px-2.5 py-1.5",
        className,
      )}
    >
      <Image
        src="/logo.png"
        alt="LEANR by Fitelo"
        width={2179}
        height={727}
        priority
        className={cn("w-auto", SIZES[size])}
      />
    </span>
  );
}
