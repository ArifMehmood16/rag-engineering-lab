import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export function AppBrand({ className }: { className?: string }) {
  return (
    <Link
      to="/"
      aria-label="RAG Engineering Lab home"
      className={cn("inline-flex min-w-0 items-center gap-2.5 rounded-md", className)}
    >
      <img src="/logo.svg" alt="" width={36} height={36} className="size-9 shrink-0" />
      <span className="lab-wordmark">RAG Engineering Lab</span>
    </Link>
  );
}
