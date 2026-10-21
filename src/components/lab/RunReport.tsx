import { CheckCircle2, CircleAlert, ArrowRight } from "lucide-react";
import type { EvidenceRecord } from "@/content/apollo";
import { evaluateApolloRun, type ApolloEvaluation, type Ratio } from "@/lib/apollo-evaluation";
import { DEFAULT_CONFIG, runAll, type EngineState } from "@/lib/apollo-engine";
import { Badge, CopyButton } from "@/components/learn/ui";

export const showRatio = (r: Ratio) => (r.den ? `${r.num}/${r.den}` : "N/A");
const METRICS: { key: keyof ApolloEvaluation; label: string; detail: string }[] = [
  {
    key: "recall",
    label: "Evidence fact recall",
    detail: "required facts represented in retrieved source passages",
  },
  {
    key: "citationCorrectness",
    label: "Draft citation correctness",
    detail: "supporting links / all draft citation links",
  },
  {
    key: "citationCompleteness",
    label: "Draft citation completeness",
    detail: "adequately cited claims / draft claims checked",
  },
  {
    key: "unsupportedDraft",
    label: "Unsupported draft claims",
    detail: "unsupported factual content / draft claims",
  },
  {
    key: "releasedCoverage",
    label: "Released fact coverage",
    detail: "required facts in the released answer",
  },
  {
    key: "correctAbstention",
    label: "Correct abstention",
    detail: "appropriate gaps / unanswerable attempts without outage",
  },
  {
    key: "falseAbstention",
    label: "False abstention",
    detail: "gaps or refusals / answerable attempts without outage",
  },
  {
    key: "infrastructureErrors",
    label: "Infrastructure errors",
    detail: "operational failures / completed attempts",
  },
];
export const OUTCOMES = {
  pending: "Not finished",
  supported: "Supported answer",
  evidence_gap: "Evidence gap",
  blocked: "Withheld by a check",
  infrastructure_error: "Infrastructure failure",
  false_abstention: "False refusal",
};
export function RunReport({
  engine,
  records,
  onEvidence,
}: {
  engine: EngineState;
  records: EvidenceRecord[];
  onEvidence: (id: string) => void;
}) {
  const metrics = evaluateApolloRun(engine, records);
  const done = engine.ctx.outcome !== "pending";
  return (
    <section className="run-report" aria-labelledby="run-result-heading">
      <div className="flex items-center justify-between gap-3">
        <p className="eyebrow">Observable result</p>
        <Badge tone={engine.ctx.outcome === "supported" ? "proposed" : done ? "warn" : "neutral"}>
          {OUTCOMES[engine.ctx.outcome]}
        </Badge>
      </div>
      <h2 id="run-result-heading">What reached the user?</h2>
      {engine.ctx.released ? (
        <div className="released-answer">
          <CheckCircle2 size={19} aria-hidden />
          <div>
            {engine.ctx.released.claims.map((c) => (
              <p key={c.id}>
                {c.text}{" "}
                <span className="citation-buttons">
                  {c.cites.map((id) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => onEvidence(id)}
                      aria-label={`Inspect citation ${id}`}
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
          <CircleAlert size={18} aria-hidden />
          <p>
            {!done
              ? "No answer has been released. Follow the data through the stages above."
              : engine.ctx.outcome === "evidence_gap"
                ? `Required evidence is missing${engine.ctx.missing.length ? `: ${engine.ctx.missing.join(", ")}` : " from the tool result"}. A larger model would not add sources to this corpus.`
                : engine.ctx.outcome === "infrastructure_error"
                  ? "A service boundary failed. This is not successful abstention or evidence that a fact is absent."
                  : "The draft did not reach release. Inspect the blocked stage for the failed check."}
          </p>
        </div>
      )}
      {done && (
        <>
          <details className="lab-details">
            <summary>
              Measure this run{" "}
              <span>Fixture-derived ratios · N/A means no applicable denominator</span>
            </summary>
            <div className="run-metrics">
              {METRICS.map((m) => (
                <div key={m.key}>
                  <strong>{showRatio(metrics[m.key])}</strong>
                  <h3>{m.label}</h3>
                  <p>{m.detail}</p>
                </div>
              ))}
            </div>
            <p className="control-note">
              One annotated preset, not an aggregate benchmark. Evidence recall counts required
              facts, so repeated chunks do not inflate it. The judge is a rule-based fixture
              verifier; no LLM or human reviewer runs live.
            </p>
          </details>
          <details className="lab-details">
            <summary>Inspect rejected or unverified drafts</summary>
            {engine.ctx.claims.length ? (
              engine.ctx.claims.map((c) => (
                <p className="draft-inspection" key={c.id}>
                  <code>{c.id}</code> {c.text} <span>[{c.cites.join(", ") || "no citations"}]</span>
                </p>
              ))
            ) : (
              <p className="control-note">No draft was generated on this path.</p>
            )}
          </details>
          <div className="work-strip">
            <span>
              Generation calls <strong>{engine.ctx.usage.generationCalls}</strong>
            </span>
            <span>
              Vectors computed / reused{" "}
              <strong>
                {engine.ctx.usage.embeddingCalls} / {engine.ctx.usage.embeddingHits}
              </strong>
            </span>
            <span>
              Modelled work <strong>{engine.ctx.usage.workUnits} units</strong>
            </span>
          </div>
          <p className="control-note">
            Fictional work units: (input − cached prefix × 0.9 + output × 2) × profile (small 1,
            large 3). Stable prefix assumes 160 tokens. Not price, latency, or a measured model
            result.
          </p>
        </>
      )}
    </section>
  );
}
export function CompareRuns({
  modified,
  records,
}: {
  modified: EngineState;
  records: EvidenceRecord[];
}) {
  const baseline = runAll(modified.ctx.question, records, DEFAULT_CONFIG);
  const variants = [
    { label: "Baseline · cold", run: baseline },
    {
      label: "Your configuration · cold",
      run: runAll(modified.ctx.question, records, modified.config),
    },
  ];
  const cold = variants[1]!.run;
  if (
    modified.config.promptCache ||
    modified.config.answerCache ||
    modified.config.retrievalCache ||
    modified.config.embeddingCache
  )
    variants.push({
      label: "Your configuration · repeated",
      run: runAll(modified.ctx.question, records, modified.config, cold.memory),
    });
  const markdown =
    `# Controlled RAG lab comparison\n\nQuestion: ${modified.ctx.question}\n\nLocal source-backed fixtures. Generation and judges are simulated.\n\n` +
    variants
      .map(
        ({ label, run }) =>
          `## ${label}\n\n- Outcome: ${OUTCOMES[run.ctx.outcome]}\n- Context: ${run.ctx.context.join(", ") || "none"}\n- Released coverage: ${showRatio(evaluateApolloRun(run, records).releasedCoverage)}\n- Generation calls: ${run.ctx.usage.generationCalls}\n- Fictional work units: ${run.ctx.usage.workUnits}\n`,
      )
      .join("\n");
  return (
    <section className="comparison-panel" aria-labelledby="compare-heading">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow">Hold the question and corpus fixed</p>
          <h2 id="compare-heading">What did the change actually do?</h2>
        </div>
        <CopyButton text={markdown} label="Copy comparison" />
      </div>
      <div className="comparison-grid">
        {variants.map(({ label, run }) => (
          <article key={label}>
            <h3>{label}</h3>
            <p className="comparison-outcome">{OUTCOMES[run.ctx.outcome]}</p>
            <dl>
              <dt>Retrieved records</dt>
              <dd>{run.ctx.retrieved.length}</dd>
              <dt>Context records / tokens</dt>
              <dd>
                {run.ctx.context.length} / ≈{run.ctx.tokensUsed}
              </dd>
              <dt>Released coverage</dt>
              <dd>{showRatio(evaluateApolloRun(run, records).releasedCoverage)}</dd>
              <dt>Generation calls</dt>
              <dd>{run.ctx.usage.generationCalls}</dd>
              <dt>Prompt / answer hit</dt>
              <dd>
                {run.ctx.usage.prefixHit ? "yes" : "no"} / {run.ctx.usage.answerHit ? "yes" : "no"}
              </dd>
              <dt>Fictional work units</dt>
              <dd>{run.ctx.usage.workUnits}</dd>
            </dl>
            <details>
              <summary>
                Inspect candidate → context IDs <ArrowRight size={12} />
              </summary>
              <p className="font-mono text-xs break-words">
                {run.ctx.retrieved.map((r) => r.id).join(" · ") || "none"}
              </p>
              <hr className="my-2" />
              <p className="font-mono text-xs break-words">
                {run.ctx.context.join(" · ") || "none"}
              </p>
            </details>
          </article>
        ))}
      </div>
      <p className="control-note">
        Same question, corpus bytes, and fixture labels. Baseline uses default settings without
        caches or faults. The cold run uses your full configuration; a repeat shares only that cold
        run’s in-memory cache. Effects can help, harm, or make no difference. These are
        demonstrations, not EvidenceLens benchmarks.
      </p>
    </section>
  );
}
