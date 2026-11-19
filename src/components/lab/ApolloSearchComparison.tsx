import * as Dialog from "@radix-ui/react-dialog";
import { GitCompareArrows, X } from "lucide-react";
import { useId, useState } from "react";
import { EvidenceCard } from "@/components/lab/RunInspector";
import { OUTCOMES } from "@/components/lab/RunReport";
import { Badge, btnVariants } from "@/components/learn/ui";
import { APOLLO_RECORDS, DEFAULT_QUESTION } from "@/content/apollo";
import { runAll, type EngineState } from "@/lib/apollo-engine";

const PUBLIC_PASSAGES = APOLLO_RECORDS.filter(
  (record) => record.kind === "source" && record.eligibility === "eligible",
);
const CANDIDATE_LIMIT = 6;

function ComparisonRun({ run, title }: { run: EngineState; title: string }) {
  const headingId = useId();
  const evidenceId = useId();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { context, missing, outcome, released, usage } = run.ctx;
  const selected = PUBLIC_PASSAGES.find((record) => record.id === selectedId);

  function inspect(id: string) {
    setSelectedId((current) => (current === id ? null : id));
  }

  return (
    <section className="apollo-comparison-run" aria-labelledby={headingId}>
      <div className="apollo-comparison-run-heading">
        <h3 id={headingId}>{title}</h3>
        <Badge tone={released ? "proposed" : "warn"}>{OUTCOMES[outcome]}</Badge>
      </div>
      {released ? (
        <div className="released-answer">
          <div>
            {released.claims.map((claim) => (
              <p key={claim.id}>
                {claim.text}{" "}
                <span className="citation-buttons">
                  {claim.cites.map((id) => (
                    <button
                      key={id}
                      type="button"
                      aria-label={`Inspect citation ${id} for ${claim.text}`}
                      aria-expanded={selectedId === id}
                      aria-controls={evidenceId}
                      onClick={() => inspect(id)}
                    >
                      {id}
                    </button>
                  ))}
                </span>
              </p>
            ))}
          </div>
        </div>
      ) : (
        <div className="withheld-answer">
          <div>
            <strong>Answer withheld</strong>
            {missing.length > 0 && (
              <p>
                Missing evidence for{" "}
                {missing
                  .map((fact) => (fact === "moonwalkers" ? "who walked on the Moon" : fact))
                  .join(", ")}
                .
              </p>
            )}
          </div>
        </div>
      )}
      <p className="apollo-comparison-count">
        Simulated generation calls <strong>{usage.generationCalls}</strong>
      </p>
      <h4>Selected passages</h4>
      <ul className="apollo-comparison-passages">
        {context.map((id) => (
          <li key={id}>
            <button
              type="button"
              className="choice-button"
              aria-label={`Inspect passage ${id}`}
              aria-expanded={selectedId === id}
              aria-controls={evidenceId}
              onClick={() => inspect(id)}
            >
              {id}
            </button>
          </li>
        ))}
      </ul>
      <div id={evidenceId} hidden={!selected}>
        {selected && <EvidenceCard record={selected} />}
      </div>
    </section>
  );
}

export function ApolloSearchComparison({
  onOpenChange,
}: {
  onOpenChange: (open: boolean) => void;
}) {
  const [runs, setRuns] = useState<{ keyword: EngineState; hybrid: EngineState } | null>(null);

  function changeOpen(open: boolean) {
    setRuns(
      open
        ? {
            keyword: runAll(DEFAULT_QUESTION, PUBLIC_PASSAGES, {
              mode: "keyword",
              topK: CANDIDATE_LIMIT,
            }),
            hybrid: runAll(DEFAULT_QUESTION, PUBLIC_PASSAGES, {
              mode: "hybrid",
              topK: CANDIDATE_LIMIT,
            }),
          }
        : null,
    );
    onOpenChange(open);
  }

  return (
    <Dialog.Root open={runs !== null} onOpenChange={changeOpen}>
      <Dialog.Trigger type="button" className={btnVariants({ variant: "primary" })}>
        <GitCompareArrows size={16} aria-hidden />
        Compare Keyword and Hybrid
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="lab-drawer-overlay" />
        <Dialog.Content className="evidence-dialog apollo-comparison-dialog">
          <div className="apollo-comparison-heading">
            <div>
              <Dialog.Title>Compare Keyword and Hybrid</Dialog.Title>
              <Dialog.Description>{DEFAULT_QUESTION}</Dialog.Description>
            </div>
            <Dialog.Close
              className={btnVariants({ variant: "ghost", size: "sm" })}
              aria-label="Close search comparison"
            >
              <X size={18} aria-hidden />
            </Dialog.Close>
          </div>
          <p className="apollo-comparison-settings">
            Same NASA passages and {CANDIDATE_LIMIT}-candidate limit. Both runs start with fresh
            state. Generation is simulated.
          </p>
          {runs && (
            <div className="apollo-comparison-grid">
              <ComparisonRun run={runs.keyword} title="Keyword" />
              <ComparisonRun run={runs.hybrid} title="Hybrid" />
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
