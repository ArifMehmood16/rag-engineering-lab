import { createFileRoute } from "@tanstack/react-router";
import { ArchitectureMap } from "@/components/learn/ArchitectureMap";

const TITLE = "EvidenceLens architecture map — The Intelligence Lab";
const DESC =
  "Clickable map of the planned EvidenceLens query workflow with caching, routing, tool-call, and evaluation overlays.";

export const Route = createFileRoute("/architecture")({
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
  component: () => (
    <article className="mx-auto max-w-5xl px-5 py-10 lg:px-10">
      <p className="eyebrow">Across all lessons</p>
      <h1 className="mt-2 text-4xl font-medium sm:text-5xl">Architecture map</h1>
      <p className="prose-body mt-4 max-w-2xl text-muted-foreground">
        The default view is the bounded query workflow in the EvidenceLens design. Choose a stage to
        see what it does, what crosses its trust boundary, and which lesson explains it. Turn on
        overlays to see where optional techniques would fit.
      </p>
      <div className="mt-8">
        <ArchitectureMap />
      </div>
    </article>
  ),
});
