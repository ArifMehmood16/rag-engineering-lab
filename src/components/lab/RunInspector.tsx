import { Link } from "@tanstack/react-router";
import { ExternalLink, ArrowUpRight, Check, CircleAlert } from "lucide-react";
import { type EvidenceRecord } from "@/content/apollo";
import { STAGE_EXPLANATIONS } from "@/content/rag-lab";
import { ENGINE_STAGES, type EngineState } from "@/lib/apollo-engine";
import { buildKnowledgeIndex } from "@/lib/knowledge-index";
import { Badge } from "@/components/learn/ui";

export function EvidenceCard({ record }: { record: EvidenceRecord }) {
  return (
    <article className="evidence-card">
      <div className="flex flex-wrap items-center gap-2">
        <code>{record.id}</code>
        <Badge tone={record.kind === "source" ? "proposed" : "warn"}>
          {record.kind === "source" ? "Source-backed" : "Synthetic test"}
        </Badge>
      </div>
      <p className="mt-2 text-sm leading-relaxed">
        {record.representation === "paraphrase" ? "Summary: " : ""}
        {record.text}
      </p>
      <dl className="evidence-metadata">
        <dt>Source</dt>
        <dd>
          {record.source.url ? (
            <a href={record.source.url} target="_blank" rel="noreferrer">
              {record.source.publisher} · {record.source.title} <ExternalLink size={11} />
            </a>
          ) : (
            record.source.title
          )}
        </dd>
        <dt>Locator</dt>
        <dd>{record.locator}</dd>
        <dt>Version</dt>
        <dd>{record.version}</dd>
        <dt>Eligibility</dt>
        <dd>
          {record.eligibility} · {record.eligibilityReason}
        </dd>
      </dl>
    </article>
  );
}
export function RunInspector({
  engine,
  selected,
  knowledge,
  records,
  onEvidence,
}: {
  engine: EngineState;
  selected: number;
  knowledge: number | null;
  records: EvidenceRecord[];
  onEvidence: (id: string) => void;
}) {
  const stage = ENGINE_STAGES[selected]!;
  const result = engine.results[selected];
  const why = STAGE_EXPLANATIONS[stage.id]!;
  const index = buildKnowledgeIndex(records);
  if (knowledge !== null) {
    const titles = [
      "Documents → usable text",
      "Text → provenance-preserving chunks",
      "Passages → numeric vectors",
      "Vectors + IDs → searchable index",
    ];
    return (
      <aside className="inspector-panel" aria-label="Knowledge preparation inspector">
        <p className="eyebrow">Before questions · step {knowledge + 1}</p>
        <h2>{titles[knowledge]}</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          The index is prepared before a question arrives. Retrieval later uses the same
          representation to compare the query with these stored passages. This lab uses curated
          source passages; it does not claim to parse NASA pages live.
        </p>
        {knowledge === 0 &&
          index.sources.map((s) => (
            <a className="source-link" key={s.url} href={s.url} target="_blank" rel="noreferrer">
              <ExternalLink size={13} />
              {s.publisher} · {s.title}
            </a>
          ))}
        {knowledge === 1 &&
          index.chunks.map((c) => (
            <button
              className="inspect-record"
              key={c.id}
              type="button"
              onClick={() => onEvidence(c.id)}
            >
              <code>{c.id}</code>
              <span>≈{c.tokens} tokens · source locator retained</span>
            </button>
          ))}
        {knowledge >= 2 && (
          <>
            <p className="text-xs text-muted-foreground">
              Seven explicit word-group features. These are toy vectors, not learned embeddings or
              confidence scores.
            </p>
            <div className="vector-table">
              {index.chunks.map((c) => (
                <button key={c.id} type="button" onClick={() => onEvidence(c.id)}>
                  <code>{c.id}</code>
                  <span>[{c.vector.map((v) => v.toFixed(2)).join(", ")}]</span>
                </button>
              ))}
            </div>
            <p className="control-note">
              {index.model} · {index.dimensions} dimensions · IDs resolve to the original passage,
              version, and locator.
            </p>
          </>
        )}
      </aside>
    );
  }
  return (
    <aside className="inspector-panel" aria-label="Selected stage inspector">
      <div className="flex items-center justify-between gap-2">
        <p className="eyebrow">Inspect stage {String(selected + 1).padStart(2, "0")}</p>
        <Badge tone={result?.status === "blocked" ? "warn" : "neutral"}>
          {result?.status ?? "waiting"}
        </Badge>
      </div>
      <h2>{stage.name}</h2>
      <p className="text-sm leading-relaxed text-muted-foreground">{why.why}</p>
      <div className="inspector-io">
        <h3>Input</h3>
        {result ? (
          <ul>
            {result.input.length ? (
              result.input.map((x) => <li key={x}>{x}</li>)
            ) : (
              <li>Stage bypassed on this path.</li>
            )}
          </ul>
        ) : (
          <p>Not reached yet. Run or step through the pipeline.</p>
        )}
      </div>
      <div className="inspector-io">
        <h3>Output</h3>
        {result ? (
          <ul>
            {result.output.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        ) : (
          <p>No output before execution.</p>
        )}
      </div>
      {stage.id === "draft" && engine.ctx.prompt && (
        <details className="prompt-inspection">
          <summary>Inspect the assembled model input</summary>
          <p className="control-note">
            Question + instructions + selected source text. This is the payload represented by the
            fixture generator, not a live API request.
          </p>
          <pre tabIndex={0}>
            <code>{JSON.stringify(engine.ctx.prompt, null, 2)}</code>
          </pre>
        </details>
      )}
      {(stage.id === "retrieve" || stage.id === "assemble") && engine.ctx.retrieved.length > 0 && (
        <div>
          <p className="hud-label">Trace a passage</p>
          {engine.ctx.retrieved.map((r, n) => (
            <button
              className="inspect-record"
              key={r.id}
              type="button"
              onClick={() => onEvidence(r.id)}
            >
              <code>
                {n + 1}. {r.id}
              </code>
              <span>
                {engine.ctx.context.includes(r.id)
                  ? "in context"
                  : (engine.ctx.excluded.find((x) => x.id === r.id)?.reason ??
                    `score ${r.score.toFixed(3)}`)}
              </span>
            </button>
          ))}
        </div>
      )}
      {stage.id === "verify" && engine.ctx.checks.length > 0 && (
        <div className="claim-verdicts">
          {engine.ctx.checks.map((c) => (
            <p key={c.id}>
              {c.supported && c.resolves ? <Check size={14} /> : <CircleAlert size={14} />}
              <span>
                {c.id} · {c.reason}
              </span>
            </p>
          ))}
        </div>
      )}
      <div className="boundary-note">
        <strong>Trust boundary</strong>
        <p>{why.boundary}</p>
        {result?.note && <p className="mt-2">{result.note}</p>}
      </div>
      <Link to="/lessons/$slug" params={{ slug: stage.lesson }} className="lab-lesson-link">
        Understand this concept <ArrowUpRight size={14} />
      </Link>
    </aside>
  );
}
