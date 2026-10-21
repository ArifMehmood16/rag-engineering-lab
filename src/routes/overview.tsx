import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Clock } from "lucide-react";
import { LESSONS } from "@/content/lessons";
import { ContextDrawer } from "@/components/learn/ContextDrawer";
import { Badge, btnVariants } from "@/components/learn/ui";
import { cn } from "@/lib/utils";

const TITLE = "Overview — RAG Learning: five AI engineering concepts";
const DESC =
  "An interactive learning resource on RAG, caching and routing, evaluation, guardrails, and tool use, with the design-phase EvidenceLens project as a case study.";

export const Route = createFileRoute("/overview")({
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
  return (
    <div className="mx-auto max-w-4xl px-5 py-12 lg:px-10 lg:py-16">
      <p className="eyebrow">A personal learning resource</p>
      <h1 className="mt-3 text-5xl font-medium leading-[1.05] sm:text-6xl">
        THE INTELLIGENCE LAB{" "}
        <span className="block text-2xl font-normal text-muted-foreground">
          Overview of the five lessons
        </span>
      </h1>
      <p className="mt-3 font-serif text-2xl text-muted-foreground">
        Five concepts. One real project. Learn how the pieces fit.
      </p>
      <p className="prose-body mt-6 max-w-2xl">
        A grounded answer takes more than a good model. Explore how context, efficiency, evaluation,
        guardrails, and tools work together—and where each belongs in a real RAG design.
      </p>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Link
          to="/lessons/$slug"
          params={{ slug: "context" }}
          className={btnVariants({ variant: "primary" })}
        >
          Start with Lesson 1 <ArrowRight className="size-4" aria-hidden />
        </Link>
        <ContextDrawer />
      </div>

      <div className="mt-6 flex items-start gap-2 text-sm text-muted-foreground">
        <Badge tone="planned">Design phase</Badge>
        <span>
          EvidenceLens supplies the examples. Its capabilities are planned, not implemented, and no
          benchmark results exist.
        </span>
      </div>

      <h2 className="mt-14 text-3xl font-medium">Five lessons</h2>
      <ol className="mt-5 divide-y divide-border border-y border-border">
        {LESSONS.map((l) => {
          return (
            <li key={l.slug}>
              <Link
                to="/lessons/$slug"
                params={{ slug: l.slug }}
                className={cn(
                  "group grid gap-2 py-5 sm:grid-cols-[3rem_1fr_auto] sm:items-baseline",
                  l.status === "planned" && "text-muted-foreground",
                )}
              >
                <span className="font-mono text-sm">0{l.number}</span>
                <span>
                  <span className="block font-serif text-2xl text-foreground group-hover:text-primary">
                    {l.concept}
                  </span>
                  <span className="mt-1 block text-sm">
                    {l.title} — {l.summary}
                  </span>
                </span>
                <span>
                  {l.status === "planned" ? (
                    <Badge tone="planned">
                      <Clock className="size-3" aria-hidden /> Planned
                    </Badge>
                  ) : (
                    <Badge tone="proposed">Available</Badge>
                  )}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>

      <section aria-labelledby="across-h" className="mt-14">
        <h2 id="across-h" className="text-3xl font-medium">
          Across the lessons
        </h2>
        <ul className="mt-5 grid gap-3 sm:grid-cols-3">
          {(
            [
              [
                "/architecture",
                "Architecture map",
                "Click through the planned query workflow and turn on caching, routing, tool, and evaluation overlays.",
              ],
              [
                "/roadmap",
                "Implementation priorities",
                "A phased, qualitative roadmap — and what to defer until evidence justifies it.",
              ],
              [
                "/writing",
                "Writing exercises",
                "Reflection prompts and six-part post outlines, copyable as Markdown.",
              ],
            ] as const
          ).map(([to, t, d]) => (
            <li key={to}>
              <Link
                to={to}
                className="block h-full rounded-lg border border-border bg-card p-4 hover:border-primary"
              >
                <span className="block font-semibold">{t}</span>
                <span className="mt-1 block text-sm text-muted-foreground">{d}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
