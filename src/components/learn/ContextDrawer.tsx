import * as Dialog from "@radix-ui/react-dialog";
import { BookOpen, X } from "lucide-react";
import { Badge, btnVariants } from "./ui";

const QUERY_FLOW = [
  "Authentication and request limits",
  "Interpret question and explicit filters",
  "Pin one physical index release",
  "Lexical and dense retrieval",
  "Fuse and deduplicate",
  "Rerank and assemble evidence context",
  "Assess evidence sufficiency",
  "Generate a structured, cited draft",
  "Verify claims and citations",
  "Recheck current source eligibility",
  "Release a supported brief, partial answer, or evidence gap",
];

export function ContextDrawer() {
  return (
    <Dialog.Root>
      <Dialog.Trigger className={btnVariants({ variant: "outline" })}>
        <BookOpen className="size-4" aria-hidden /> EvidenceLens context
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-foreground/30" />
        <Dialog.Content className="fixed inset-y-0 right-0 z-50 w-full max-w-lg overflow-y-auto border-l border-border bg-card p-6 shadow-xl fade-in">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Badge tone="planned">Design phase</Badge>
              <Dialog.Title className="mt-2 font-serif text-2xl">EvidenceLens, the case study</Dialog.Title>
            </div>
            <Dialog.Close className={btnVariants({ variant: "ghost", size: "sm" })} aria-label="Close context">
              <X className="size-4" aria-hidden />
            </Dialog.Close>
          </div>
          <Dialog.Description className="mt-3 text-sm leading-relaxed">
            EvidenceLens is a <strong>planned</strong> evidence research application for practitioners investigating supplement questions. The
            repository holds architecture, evaluation specifications, and planning — not an implemented application, completed benchmarks, deployed
            infrastructure, or clinical validation.
          </Dialog.Description>

          <h3 className="mt-6 font-sans text-sm font-semibold">Proposed workflows</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            <li>Investigate an evidence question</li>
            <li>Audit a published claim</li>
            <li>Inspect disagreement between sources</li>
          </ul>

          <h3 className="mt-6 font-sans text-sm font-semibold">Intended output: an evidence brief</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Findings with passage-level citations, populations, formulations, reported doses and durations, outcomes, limitations, conflicts, missing
            evidence, and the source versions and index release used. A reported study dose stays distinct from a treatment recommendation.
          </p>

          <h3 className="mt-6 font-sans text-sm font-semibold">Planned query flow</h3>
          <ol className="mt-2 space-y-1 text-sm">
            {QUERY_FLOW.map((s, i) => (
              <li key={s} className="flex gap-2">
                <span className="w-5 shrink-0 text-right font-mono text-xs text-muted-foreground">{i + 1}</span>
                {s}
              </li>
            ))}
          </ol>
          <p className="mt-3 text-sm text-muted-foreground">
            At most one targeted follow-up retrieval and one bounded revision are permitted — bounded application decisions, not an autonomous agent.
          </p>

          <h3 className="mt-6 font-sans text-sm font-semibold">Proposed stack</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Python, FastAPI, typed schemas, React/TypeScript, PostgreSQL, versioned object storage, OpenSearch (lexical and vector), separate ingestion
            workers, Docker Compose, provider adapters, OpenTelemetry. AWS is a proposed reference deployment. The generator, embedding model, reranker,
            parser, and budget are <strong>not finalized</strong>.
          </p>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
