import { createFileRoute } from "@tanstack/react-router";
import { DEFERRED, PHASES } from "@/content/roadmap";
import { Badge } from "@/components/learn/ui";

const TITLE = "Implementation priorities — RAG Learning";
const DESC =
  "A qualitative, phased roadmap for the design-phase EvidenceLens project, plus what to defer until evidence justifies it.";

export const Route = createFileRoute("/roadmap")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Roadmap,
});

function Roadmap() {
  return (
    <article className="mx-auto max-w-4xl px-5 py-10 lg:px-10">
      <p className="eyebrow">Across all lessons</p>
      <h1 className="mt-2 text-4xl font-medium sm:text-5xl">Implementation priorities</h1>
      <p className="prose-body mt-4 max-w-2xl text-muted-foreground">
        Benefit and effort are qualitative judgements. There are no savings estimates, dates, or
        delivery promises — EvidenceLens is in its design phase.
      </p>
      <div className="mt-8 space-y-3">
        {PHASES.map((p, i) => (
          <details
            key={p.id}
            open={i === 0}
            className="group rounded-lg border border-border bg-card p-4"
          >
            <summary className="cursor-pointer text-lg font-semibold">{p.title}</summary>
            <ul className="mt-3 grid gap-1 text-sm sm:grid-cols-2">
              {p.items.map((x) => (
                <li key={x}>• {x}</li>
              ))}
            </ul>
            <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
              <div>
                <dt className="eyebrow">Benefit</dt>
                <dd>{p.benefit}</dd>
              </div>
              <div>
                <dt className="eyebrow">Effort</dt>
                <dd>{p.effort}</dd>
              </div>
              <div>
                <dt className="eyebrow">References</dt>
                <dd className="font-mono text-xs">{p.refs}</dd>
              </div>
            </dl>
            {p.note && <p className="mt-3 rounded-md bg-muted p-3 text-sm">{p.note}</p>}
            <Badge tone="planned" className="mt-3">
              Planned
            </Badge>
          </details>
        ))}
      </div>
      <h2 className="mt-12 text-3xl font-medium">Defer until justified</h2>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {DEFERRED.map(([t, d]) => (
          <li key={t} className="rounded-lg border border-border bg-card p-4">
            <p className="font-semibold">{t}</p>
            <p className="mt-1 text-sm text-muted-foreground">{d}</p>
          </li>
        ))}
      </ul>
    </article>
  );
}
