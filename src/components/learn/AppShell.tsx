import { Link, useRouterState } from "@tanstack/react-router";
import * as Dialog from "@radix-ui/react-dialog";
import { Circle, Clock, Menu, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { LESSONS } from "@/content/lessons";
import { btnVariants } from "./ui";
import { cn } from "@/lib/utils";

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav aria-label="Site" className="flex flex-col gap-1">
      <Link
        to="/"
        onClick={onNavigate}
        className={cn("rounded-md px-3 py-2 text-sm hover:bg-muted", path === "/" && "bg-card font-semibold shadow-sm")}
      >
        Overview
      </Link>
      <p className="eyebrow mt-4 px-3">Five lessons</p>
      <ol className="mt-1 flex flex-col gap-0.5">
        {LESSONS.map((l) => {
          const active = path === `/lessons/${l.slug}`;
          const Icon = l.status === "planned" ? Clock : Circle;
          const state = l.status === "planned" ? "planned" : "available";
          return (
            <li key={l.slug}>
              <Link
                to="/lessons/$slug"
                params={{ slug: l.slug }}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex gap-3 rounded-md px-3 py-2 text-sm hover:bg-muted",
                  active && "bg-card shadow-sm",
                  l.status === "planned" && "text-muted-foreground",
                )}
              >
                <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
                <span>
                  <span className="font-mono text-xs">0{l.number}</span>{" "}
                  <span className={cn(active && "font-semibold")}>{l.concept}</span>
                  <span className="sr-only"> ({state})</span>
                  {l.status === "planned" && <span className="block text-xs">Planned next increment</span>}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
      <p className="eyebrow mt-4 px-3">Across lessons</p>
      {([["/architecture", "Architecture map"], ["/roadmap", "Implementation priorities"], ["/writing", "Writing exercises"]] as const).map(([to, label]) => (
        <Link key={to} to={to} onClick={onNavigate} aria-current={path === to ? "page" : undefined}
          className={cn("rounded-md px-3 py-2 text-sm hover:bg-muted", path === to && "bg-card font-semibold shadow-sm")}>
          {label}
        </Link>
      ))}
    </nav>
  );
}

function Brand() {
  return (
    <Link to="/" className="block px-3">
      <span className="block font-serif text-xl leading-tight">AI Engineering,</span>
      <span className="block font-serif text-xl italic leading-tight text-primary">Made Practical</span>
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[17rem_1fr]">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-card focus:p-2">
        Skip to content
      </a>
      <aside className="sticky top-0 hidden h-screen overflow-y-auto border-r border-border bg-sidebar px-3 py-6 lg:block">
        <Brand />
        <div className="mt-8">
          <NavList />
        </div>
      </aside>

      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-background/95 px-4 py-3 backdrop-blur lg:hidden">
        <Link to="/" className="font-serif text-lg">
          AI Engineering, <em className="text-primary">Made Practical</em>
        </Link>
        <Dialog.Root open={open} onOpenChange={setOpen}>
          <Dialog.Trigger className={btnVariants({ variant: "outline", size: "sm" })} aria-label="Open lesson menu">
            <Menu className="size-4" aria-hidden /> Menu
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-50 bg-foreground/30" />
            <Dialog.Content className="fixed inset-y-0 left-0 z-50 w-[85%] max-w-xs overflow-y-auto bg-sidebar px-3 py-6 shadow-xl">
              <div className="flex items-start justify-between">
                <Dialog.Title asChild>
                  <div>
                    <Brand />
                  </div>
                </Dialog.Title>
                <Dialog.Close className={btnVariants({ variant: "ghost", size: "sm" })} aria-label="Close menu">
                  <X className="size-4" aria-hidden />
                </Dialog.Close>
              </div>
              <Dialog.Description className="sr-only">Navigate between the overview and five lessons.</Dialog.Description>
              <div className="mt-6">
                <NavList onNavigate={() => setOpen(false)} />
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </header>

      <main id="main" className="min-w-0">
        {children}
      </main>
    </div>
  );
}
