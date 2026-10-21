import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, Clock } from "lucide-react";
import { LESSONS } from "@/content/lessons";
import { useProgress } from "@/lib/storage";
import { ContextDrawer } from "@/components/learn/ContextDrawer";
import { Badge, btnVariants } from "@/components/learn/ui";
import { cn } from "@/lib/utils";

const TITLE = "AI Engineering, Made Practical — Five concepts, one real project";
const DESC = "An interactive learning resource on RAG, caching and routing, evaluation, guardrails, and tool use, with the design-phase EvidenceLens project as a case study.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Overview,
});

function Overview() {
  const { completed } = useProgress();
  const next = LESSONS.find((l) => l.status === "available" && !completed.includes(l.slug));
  const allAvailableDone = !next;

  return (
    <div className="mx-auto max-w-4xl px-5 py-12 lg:px-10 lg:py-16">
      <p className="eyebrow">A personal learning resource</p>
      <h1 className="mt-3 text-5xl font-medium leading-[1.05] sm:text-6xl">
        AI Engineering, <em className="text-primary">Made Practical</em>
      </h1>
      <p className="mt-3 font-serif text-2xl text-muted-foreground">Five concepts. One real project. Learn how the pieces fit.</p>
      <p className="prose-body mt-6 max-w-2xl">
        A grounded answer takes more than a good model. Explore how context, efficiency, evaluation, guardrails, and tools work together—and where
        each belongs in a real RAG design.
      </p>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        {next ? (
          <Link to="/lessons/$slug" params={{ slug: next.slug }} className={btnVariants({ variant: "primary" })}>
            {completed.length ? "Continue learning" : "Start learning"}: Lesson {next.number} <ArrowRight className="size-4" aria-hidden />
          </Link>
        ) : (
          <Link to="/lessons/$slug" params={{ slug: "context" }} className={btnVariants({ variant: "primary" })}>
            Revisit Lesson 1 <ArrowRight className="size-4" aria-hidden />
          </Link>
        )}
        <ContextDrawer />
      </div>
      {allAvailableDone && (
        <p className="mt-3 text-sm text-muted-foreground">You’ve completed every lesson available so far. Lessons 3–5 arrive in later increments.</p>
      )}

      <div className="mt-6 flex items-start gap-2 text-sm text-muted-foreground">
        <Badge tone="planned">Design phase</Badge>
        <span>EvidenceLens supplies the examples. Its capabilities are planned, not implemented, and no benchmark results exist.</span>
      </div>

      <h2 className="mt-14 text-3xl font-medium">Five lessons</h2>
      <ol className="mt-5 divide-y divide-border border-y border-border">
        {LESSONS.map((l) => {
          const done = completed.includes(l.slug);
          return (
            <li key={l.slug}>
              <Link
                to="/lessons/$slug"
                params={{ slug: l.slug }}
                className={cn("group grid gap-2 py-5 sm:grid-cols-[3rem_1fr_auto] sm:items-baseline", l.status === "planned" && "text-muted-foreground")}
              >
                <span className="font-mono text-sm">0{l.number}</span>
                <span>
                  <span className="block font-serif text-2xl text-foreground group-hover:text-primary">{l.concept}</span>
                  <span className="mt-1 block text-sm">{l.title} — {l.summary}</span>
                </span>
                <span>
                  {done ? (
                    <Badge tone="done"><CheckCircle2 className="size-3" aria-hidden /> Completed</Badge>
                  ) : l.status === "planned" ? (
                    <Badge tone="planned"><Clock className="size-3" aria-hidden /> Planned</Badge>
                  ) : (
                    <Badge tone="proposed">Available</Badge>
                  )}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>

      <section aria-labelledby="arch-h" className="mt-14 rounded-lg border border-dashed border-border bg-card p-5">
        <h2 id="arch-h" className="font-sans text-sm font-semibold">Interactive architecture view</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          A clickable map of the planned query workflow, with caching, routing, tool, and evaluation overlays, is scheduled for a later increment. Until
          then, the planned query flow is listed in the EvidenceLens context panel.
        </p>
      </section>
    </div>
  );
}
