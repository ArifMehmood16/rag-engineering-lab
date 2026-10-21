import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export function AppBrand({ className }: { className?: string }) {
  return (
    <Link
      to="/"
      aria-label="The Intelligence Lab home"
      className={cn("inline-flex min-w-0 items-center gap-2.5 rounded-md", className)}
    >
      <img src="/logo.svg" alt="" width={36} height={36} className="size-9 shrink-0" />
      <span className="min-w-0">
        <span className="block font-mono text-[12px] leading-4 tracking-[0.16em] text-muted-foreground">
          THE
        </span>
        <span className="block whitespace-nowrap font-display text-[15px] font-semibold leading-5 tracking-[0.03em]">
          INTELLIGENCE LAB
        </span>
      </span>
    </Link>
  );
}
