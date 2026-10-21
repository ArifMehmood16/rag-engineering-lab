import { Link, useRouterState } from "@tanstack/react-router";
import * as Dialog from "@radix-ui/react-dialog";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { CheckCircle2, Circle, Clock, Menu, RotateCcw, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { LESSONS } from "@/content/lessons";
import { resetAllLocalData, useProgress } from "@/lib/storage";
import { btnVariants } from "./ui";
import { cn } from "@/lib/utils";

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const { completed } = useProgress();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const available = LESSONS.filter((l) => l.status === "available").length;
  return (
    <nav aria-label="Lessons" className="flex flex-col gap-1">
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
          const done = completed.includes(l.slug);
          const Icon = done ? CheckCircle2 : l.status === "planned" ? Clock : Circle;
          const state = done ? "completed" : l.status === "planned" ? "planned" : "not yet completed";
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
                <Icon className={cn("mt-0.5 size-4 shrink-0", done && "text-primary")} aria-hidden />
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
      <p className="mt-4 px-3 text-xs text-muted-foreground">
        {completed.length} of {available} available lesson{available === 1 ? "" : "s"} completed
      </p>
      <ResetProgress />
    </nav>
  );
}

function ResetProgress() {
  return (
    <AlertDialog.Root>
      <AlertDialog.Trigger className={cn(btnVariants({ variant: "ghost", size: "sm" }), "mx-1 mt-1 justify-start text-muted-foreground")}>
        <RotateCcw className="size-4" aria-hidden /> Reset progress and notes
      </AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-50 bg-foreground/30" />
        <AlertDialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-card p-6 shadow-lg">
          <AlertDialog.Title className="font-serif text-xl">Reset everything stored in this browser?</AlertDialog.Title>
          <AlertDialog.Description className="mt-2 text-sm text-muted-foreground">
            This clears lesson completion, quiz answers, and all personal notes and outlines saved by this site in this browser.
            Nothing is stored elsewhere, so copy notes as Markdown first if you want to keep them.
          </AlertDialog.Description>
          <div className="mt-5 flex justify-end gap-2">
            <AlertDialog.Cancel className={btnVariants({ variant: "outline", size: "sm" })}>Cancel</AlertDialog.Cancel>
            <AlertDialog.Action className={btnVariants({ variant: "danger", size: "sm" })} onClick={resetAllLocalData}>
              Reset
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
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
