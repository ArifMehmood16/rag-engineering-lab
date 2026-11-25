import { Link, useRouterState } from "@tanstack/react-router";
import * as Dialog from "@radix-ui/react-dialog";
import {
  BookOpen,
  ChartNoAxesColumn,
  FileStack,
  Github,
  Linkedin,
  Menu,
  Route,
  ShieldCheck,
  X,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { CROSS_LESSON_PAGES, WORKED_EXAMPLES } from "@/content/lab-directory";
import { LESSONS } from "@/content/lessons";
import { AppBrand } from "./AppBrand";
import { btnVariants } from "./ui";
import { cn } from "@/lib/utils";

const exampleIcons = {
  "/demos/top-k": FileStack,
  "/demos/release-evaluation": ChartNoAxesColumn,
  "/showcases/agent-authority": ShieldCheck,
};

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const activeOptions = { exact: true, includeSearch: false };
  return (
    <nav aria-label="Site" className="lab-nav">
      <Link to="/" activeOptions={activeOptions} onClick={onNavigate}>
        <Route size={17} aria-hidden /> Live walkthrough
      </Link>
      <Link to="/overview" activeOptions={activeOptions} onClick={onNavigate}>
        <BookOpen size={17} aria-hidden /> Lab overview
      </Link>
      <h2>Worked examples</h2>
      {WORKED_EXAMPLES.map(({ to, title }) => {
        const Icon = exampleIcons[to];
        return (
          <Link key={to} to={to} onClick={onNavigate} activeOptions={{ includeSearch: false }}>
            <Icon size={17} aria-hidden /> {title}
          </Link>
        );
      })}
      <h2>Five lessons</h2>
      <ol>
        {LESSONS.map((lesson) => (
          <li key={lesson.slug}>
            <Link
              to="/lessons/$slug"
              params={{ slug: lesson.slug }}
              activeOptions={activeOptions}
              onClick={onNavigate}
            >
              <span className="nav-lesson-number">{String(lesson.number).padStart(2, "0")}</span>
              <span>
                {lesson.concept}
                {lesson.status === "planned" && <small className="block">Planned</small>}
              </span>
            </Link>
          </li>
        ))}
      </ol>
      <h2>Across lessons</h2>
      {CROSS_LESSON_PAGES.map(({ to, title }) => (
        <Link key={to} to={to} activeOptions={activeOptions} onClick={onNavigate}>
          {title}
        </Link>
      ))}
    </nav>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const lab = useRouterState({ select: (st) => st.location.pathname }) === "/";
  return (
    <div
      className={cn(
        "min-h-screen",
        lab && "immersive-shell",
        !lab && "reader-shell lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]",
      )}
    >
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-card focus:p-2"
      >
        Skip to content
      </a>
      <aside
        className={cn(
          "sticky top-0 hidden h-screen overflow-y-auto border-r border-border bg-sidebar px-3 py-6",
          !lab && "lg:block",
        )}
      >
        <AppBrand className="mx-3" />
        <div className="mt-8">
          <NavList />
        </div>
      </aside>

      <header
        className={cn(
          "sticky top-0 z-40 flex items-center justify-between border-b border-border bg-background/80 px-4 py-3 backdrop-blur",
          !lab && "lg:hidden",
        )}
      >
        <AppBrand />
        <Dialog.Root open={open} onOpenChange={setOpen}>
          <Dialog.Trigger
            className={btnVariants({ variant: "outline", size: "sm" })}
            aria-label="Open lesson menu"
          >
            <Menu className="size-4" aria-hidden /> Menu
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-50 bg-foreground/30" />
            <Dialog.Content className="fixed inset-y-0 left-0 z-50 w-[85%] max-w-xs overflow-y-auto overscroll-contain bg-sidebar px-3 py-6 shadow-xl">
              <div className="flex items-start justify-between">
                <Dialog.Title asChild>
                  <div>
                    <AppBrand className="mx-3" />
                  </div>
                </Dialog.Title>
                <Dialog.Close
                  className={btnVariants({ variant: "ghost", size: "sm" })}
                  aria-label="Close menu"
                >
                  <X className="size-4" aria-hidden />
                </Dialog.Close>
              </div>
              <Dialog.Description className="sr-only">
                Explore the walkthrough, worked examples and lessons.
              </Dialog.Description>
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

      {!lab && (
        <footer className="site-footer">
          <span>© 2026 Arif Mehmood · RAG Learning — AI Learning Lab</span>
          <nav aria-label="Author links">
            <a
              href="https://www.linkedin.com/in/aarif9516/"
              target="_blank"
              rel="noreferrer noopener"
            >
              <Linkedin className="size-3.5" aria-hidden /> LinkedIn
            </a>
            <a href="https://github.com/ArifMehmood16" target="_blank" rel="noreferrer noopener">
              <Github className="size-3.5" aria-hidden /> GitHub
            </a>
          </nav>
        </footer>
      )}
    </div>
  );
}
