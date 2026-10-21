import type { ReactNode } from "react";
import { ArrowRight, Check, Database, FileText } from "lucide-react";
import { getApolloQuestion, type EvidenceRecord } from "@/content/apollo";
import { ENGINE_STAGES, TOY_FEATURES, routeDecision } from "@/lib/apollo-engine";
import { buildKnowledgeIndex } from "@/lib/knowledge-index";
import { stageInput, stageOutput, type WalkthroughState } from "@/lib/rag-walkthrough";
import { cn } from "@/lib/utils";

const FEATURE_NAMES = ["Surface", "Orbit", "Crew", "Module", "Launch", "Backup", "Food"];
function SourceText({ record }: { record: EvidenceRecord }) {
  return (
    <article className="tour-source-text">
      <span>
        Prepared source text ·{" "}
        {record.representation === "paraphrase"
          ? "paraphrase"
          : record.kind === "source"
            ? "excerpt"
            : "synthetic test"}
      </span>
      <p>{record.text}</p>
      <dl className="tour-key-values">
        <dt>Source</dt>
        <dd>{record.source.title}</dd>
        <dt>Locator</dt>
        <dd>{record.locator}</dd>
        <dt>Version</dt>
        <dd>{record.version}</dd>
      </dl>
      {record.source.url && (
        <a href={record.source.url} target="_blank" rel="noreferrer">
          Open source page <ArrowRight size={11} />
        </a>
      )}
    </article>
  );
}

function Passage({ record, highlight = false }: { record: EvidenceRecord; highlight?: boolean }) {
  const terms = new Set(TOY_FEATURES.flat());
  return (
    <article className="tour-passage">
      <div className="tour-passage-id">
        <code>{record.id}</code>
        <span>
          {record.kind === "source"
            ? record.representation === "paraphrase"
              ? "Source paraphrase"
              : "Source excerpt"
            : "Synthetic test"}
        </span>
      </div>
      <p>
        {record.text
          .split(/\b/)
          .map((word, n) =>
            highlight && terms.has(word.toLowerCase()) ? <mark key={n}>{word}</mark> : word,
          )}
      </p>
      <footer>
        <strong>
          {record.source.publisher} · {record.source.title}
        </strong>
        <span>{record.locator}</span>
        <span>{record.version}</span>
      </footer>
    </article>
  );
}

function ChunkPicker({
  ids,
  selected,
  onSelect,
  records,
  children,
}: {
  ids: string[];
  selected: string;
  onSelect: (id: string) => void;
  records: EvidenceRecord[];
  children?: ReactNode;
}) {
  const id = ids.includes(selected) ? selected : ids[0];
  const record = records.find((r) => r.id === id);
  if (!record) return <p className="tour-empty">No passages are available on this path.</p>;
  return (
    <div className="tour-chunk-browser">
      <div className="tour-chunk-counter">
        <span>
          Passage {ids.indexOf(record.id) + 1} of {ids.length}
        </span>
        <span>Choose a number to follow that chunk</span>
      </div>
      <div className="tour-chunk-picker" role="group" aria-label="Passages in this step">
        {ids.map((id, n) => (
          <button
            key={id}
            type="button"
            aria-pressed={record.id === id}
            aria-label={`Passage ${n + 1}: ${id}`}
            onClick={() => onSelect(id)}
          >
            {n + 1}
          </button>
        ))}
      </div>
      {children}
      <Passage record={record} />
    </div>
  );
}

export function Vector({ values }: { values: number[] }) {
  return (
    <div className="tour-vector" aria-label="Seven-dimensional toy embedding">
      {values.map((v, n) => (
        <span key={n}>
          <small>{FEATURE_NAMES[n]}</small>
          <code>{v.toFixed(2)}</code>
          <i style={{ transform: `scaleX(${v})` }} />
        </span>
      ))}
    </div>
  );
}

export function KnowledgeInput({
  stage,
  beat,
  record,
  records,
  onSelect,
}: {
  stage: number;
  beat: number;
  record: EvidenceRecord;
  records: EvidenceRecord[];
  onSelect: (id: string) => void;
}) {
  const index = buildKnowledgeIndex(records);
  return (
    <>
      {stage === 0 ? (
        <>
          <div className="tour-source-list">
            {index.sources.map((s) => (
              <button
                type="button"
                key={s.url}
                aria-pressed={record.source.url === s.url}
                onClick={() => onSelect(index.chunks.find((c) => c.source.url === s.url)!.id)}
              >
                <FileText size={15} />
                <span>
                  {s.title}
                  <small>{s.publisher} · prepared source text</small>
                </span>
              </button>
            ))}
          </div>
          <p className="tour-data-note">
            2 source pages, plus separately labelled test material. No question has been asked.
          </p>
          <div className="tour-source-preview">
            <span>Selected source text</span>
            <p>{record.text}</p>
          </div>
        </>
      ) : (
        <>
          <p className="tour-data-note">
            {stage === 1
              ? "A reviewed source passage, before its chunk record is shown."
              : "The same chunk text stays attached to its numeric representation."}
          </p>
          {stage === 1 ? (
            <SourceText record={record} />
          ) : (
            <Passage record={record} highlight={stage === 2 && beat >= 2} />
          )}
          {stage === 3 && <Vector values={index.chunks.find((c) => c.id === record.id)!.vector} />}
        </>
      )}
    </>
  );
}

export function KnowledgeOutput({
  stage,
  record,
  selected,
  onSelect,
  records,
}: {
  stage: number;
  record: EvidenceRecord;
  selected: string;
  onSelect: (id: string) => void;
  records: EvidenceRecord[];
}) {
  const index = buildKnowledgeIndex(records);
  const chunk = index.chunks.find((c) => c.id === record.id)!;
  if (stage === 0)
    return (
      <>
        <p className="tour-result-summary">
          <Check size={14} /> Usable text + source identity retained
        </p>
        <SourceText record={record} />
      </>
    );
  return (
    <>
      <p className="tour-result-summary">
        {stage === 3 ? <Database size={14} /> : <Check size={14} />}
        {stage === 1
          ? `${index.chunks.length} curated chunks · ≈${chunk.tokens} tokens in this one`
          : stage === 2
            ? `${index.chunks.length} vectors · ${index.dimensions} dimensions each`
            : `${index.chunks.length} searchable records · ready for questions`}
      </p>
      <ChunkPicker
        ids={index.chunks.map((c) => c.id)}
        selected={selected}
        onSelect={onSelect}
        records={records}
      >
        {stage >= 2 && <Vector values={chunk.vector} />}
      </ChunkPicker>
    </>
  );
}

export function RequestInput({
  tour,
  records,
  selected,
  onSelect,
}: {
  tour: WalkthroughState;
  records: EvidenceRecord[];
  selected: string;
  onSelect: (id: string) => void;
}) {
  const before = stageInput(tour);
  const stage = ENGINE_STAGES[tour.stage]!.id;
  const ids = stage === "assemble" ? before.ctx.retrieved.map((r) => r.id) : before.ctx.context;
  return (
    <>
      {stage === "question" && (
        <div className="tour-question">
          <span>Question carried through this complete run</span>
          <p>{before.ctx.question}</p>
        </div>
      )}
      {stage === "request" && (
        <dl className="tour-key-values">
          <dt>Scope</dt>
          <dd>{before.config.scope}</dd>
          <dt>Index</dt>
          <dd>{before.config.indexVersion}</dd>
        </dl>
      )}
      {stage === "question" && (
        <p className="tour-data-note">
          The prepared index already exists. Asking a question does not rebuild it or retrain the
          model.
        </p>
      )}
      {stage === "cache" && (
        <dl className="tour-key-values">
          <dt>Model profile</dt>
          <dd>{before.config.profile} · simulated</dd>
          <dt>Cache contract</dt>
          <dd>Question + scope + index + settings</dd>
          <dt>Prefix reuse</dt>
          <dd>{before.config.promptCache ? "Enabled; generation still runs" : "Disabled"}</dd>
        </dl>
      )}
      {stage === "retrieve" && (
        <>
          <dl className="tour-key-values">
            <dt>Search</dt>
            <dd>{before.config.mode}</dd>
            <dt>Candidate limit</dt>
            <dd>{before.config.topK} passages</dd>
            <dt>Index snapshot</dt>
            <dd>{before.config.indexVersion}</dd>
          </dl>
          <p className="tour-data-note">
            Compare the query representation with the stored passages. Return IDs and scores, not an
            answer.
          </p>
        </>
      )}
      {stage === "tool" && (
        <p className="tour-data-note">
          Tool scenario: {before.config.tool}. At most one bounded read and no automatic retries.
        </p>
      )}
      {["assemble", "tool", "sufficiency", "draft"].includes(stage) && (
        <ChunkPicker ids={ids} selected={selected} onSelect={onSelect} records={records} />
      )}
      {["verify", "eligibility", "release"].includes(stage) && (
        <div className="tour-claims">
          {before.ctx.claims.map((claim) => (
            <p key={claim.id}>
              <code>{claim.id}</code> {claim.text}
              <small>{claim.cites.join(" · ") || "No citation supplied"}</small>
            </p>
          ))}
        </div>
      )}
    </>
  );
}

export function RequestOutput({
  tour,
  records,
  selected,
  onSelect,
  onEvidence,
}: {
  tour: WalkthroughState;
  records: EvidenceRecord[];
  selected: string;
  onSelect: (id: string) => void;
  onEvidence: (id: string) => void;
}) {
  const after = stageOutput(tour)!;
  const stage = ENGINE_STAGES[tour.stage]!.id;
  const result = after.results[tour.stage]!;
  if (after.halted)
    return (
      <div className="user-receipt" role="status">
        <span>RETURNED TO YOU · NO FACTUAL ANSWER RELEASED</span>
        <h3>
          {after.ctx.outcome === "evidence_gap"
            ? "The sources do not answer this question"
            : after.ctx.outcome === "infrastructure_error"
              ? "The request could not be completed"
              : "This request was stopped safely"}
        </h3>
        <p>
          {result.output.find((line) =>
            /denied|rejected|absent|MISSING|INELIGIBLE|unavailable|deadline/i.test(line),
          ) ?? result.output[0]}
        </p>
        {after.ctx.checks.some((c) => !c.resolves || !c.supported) && (
          <>
            <p>The draft failed its output check. Its factual content was withheld.</p>
            <pre className="operation-code">
              <code>
                {JSON.stringify(
                  {
                    cites: after.ctx.claims[0]?.cites,
                    resolves: after.ctx.checks[0]?.resolves,
                    supported: after.ctx.checks[0]?.supported,
                  },
                  null,
                  2,
                )}
              </code>
            </pre>
          </>
        )}
        <small>
          {after.ctx.usage.generationCalls
            ? "The model produced a draft; it did not reach the user."
            : "Neither LLM was called."}
        </small>
      </div>
    );
  if (stage === "tool" && after.config.tool === "off") {
    const before = stageInput(tour);
    const missing = getApolloQuestion(before.ctx.question).required.filter(
      (fact) =>
        !before.ctx.context.some((id) => records.find((r) => r.id === id)?.facts?.includes(fact)),
    );
    return (
      <>
        <p className="tour-result-summary">No extra tool call</p>
        <p className="tour-data-note">
          {missing.length
            ? "A tool is disabled for this run. The evidence check comes next; the workflow will stop if facts are missing."
            : "The selected passages already cover every requested fact. Another source-read call would add no useful evidence. Keep the tool idle and continue to the evidence check."}
        </p>
        <p className="tour-data-note">
          A fixed RAG workflow can answer this question without an autonomous agent.
        </p>
      </>
    );
  }
  if (stage === "cache") {
    const decision = routeDecision(after.ctx.question, after.config);
    return (
      <div className="router-receipt">
        <span>ROUTER DECISION FOR THIS QUESTION</span>
        <h3>
          {after.ctx.usage.answerHit
            ? "Reuse the answer → output checks"
            : after.ctx.route === "application"
              ? "Known-record lookup → application code"
              : `Retrieval → context → ${after.ctx.route === "large" ? "large LLM" : "small LLM"}`}
        </h3>
        <p>
          {after.ctx.usage.answerHit
            ? "The exact question, scope, index snapshot, and relevant settings match an approved answer from a previous successful fixture run."
            : decision.reason}
        </p>
        <p>
          {after.ctx.usage.answerHit
            ? "Approved-answer cache hit. Retrieval, tools, and both LLMs are bypassed. The reused claims must still pass citation and current-permission checks."
            : after.config.answerCache
              ? "Approved-answer cache miss: no prior answer matches this contract. This same question continues to retrieval."
              : "Approved-answer cache disabled. This same question continues to retrieval."}
        </p>
        <small>
          {after.ctx.usage.generationCalls} model calls so far · a routing decision is not a
          generation call
        </small>
      </div>
    );
  }
  if (stage === "retrieve" && result.status !== "skipped")
    return (
      <>
        <p className="tour-result-summary">
          {after.ctx.retrieved.length} ranked candidate passages
        </p>
        <ChunkPicker
          ids={after.ctx.retrieved.map((r) => r.id)}
          selected={selected}
          onSelect={onSelect}
          records={records}
        />
      </>
    );
  if (stage === "assemble" && result.status !== "skipped")
    return (
      <>
        <p className="tour-result-summary">
          {after.ctx.context.length} passages · ≈{after.ctx.tokensUsed} / {after.config.budget}{" "}
          tokens
        </p>
        {after.ctx.excluded.some((x) => x.reason.includes("instruction")) && (
          <p className="tour-warning">
            SYN-ADV-01 was excluded: its instruction to change astronaut roles is untrusted document
            content. It was not executed or passed to the generator.
          </p>
        )}
        <ChunkPicker
          ids={after.ctx.context}
          selected={selected}
          onSelect={onSelect}
          records={records}
        />
      </>
    );
  if (stage === "draft" && after.ctx.claims.length && result.status !== "skipped")
    return (
      <>
        <p className="tour-warning">Unverified draft · not yet released to the user</p>
        <p className="tour-data-note">
          {after.ctx.route === "application"
            ? "Application code produced this answer. Neither LLM was called."
            : `${after.ctx.route === "large" ? "LLM (large profile)" : "Small LLM"} produced this fixture draft after retrieval and context assembly.`}
        </p>
        <div className="tour-claims">
          {after.ctx.claims.map((claim) => (
            <p key={claim.id}>
              <code>{claim.id}</code> {claim.text}
              <small>{claim.cites.join(" · ") || "No citation supplied"}</small>
            </p>
          ))}
        </div>
      </>
    );
  if (stage === "verify" && after.ctx.checks.length)
    return (
      <div className="tour-claims">
        {after.ctx.checks.map((check) => (
          <p key={check.id}>
            <strong>
              {check.id} · {check.resolves && check.supported ? "Supported" : "Withheld"}
            </strong>
            <span>{check.reason}</span>
          </p>
        ))}
      </div>
    );
  if (stage === "release" && after.ctx.released)
    return (
      <>
        <p className="tour-result-summary">
          <Check size={14} /> Checked answer released
        </p>
        <div className="tour-answer">
          <p>{after.ctx.released.answer}</p>
          <p className="tour-data-note">
            {after.ctx.usage.answerHit
              ? "Route used: approved-answer cache → checks → you. No model or search call ran."
              : after.ctx.route === "application"
                ? "Route used: direct application lookup → checks → you. Neither LLM was called."
                : `Route used: ${after.ctx.route === "large" ? "large LLM" : "small LLM"} → checks → you. One fixture draft was generated after retrieval.`}
          </p>
          <div>
            {[...new Set(after.ctx.released.claims.flatMap((c) => c.cites))].map((id) => (
              <button key={id} type="button" onClick={() => onEvidence(id)}>
                {id} <ArrowRight size={11} />
              </button>
            ))}
          </div>
        </div>
      </>
    );
  return (
    <>
      <p className={cn("tour-result-summary", result.status === "blocked" && "tour-warning")}>
        {result.status === "skipped"
          ? "This stage was bypassed on this route"
          : result.status === "blocked"
            ? "Stopped here · no factual answer released"
            : "Stage complete"}
      </p>
      <ul className="tour-result-lines">
        {result.output.map((line, n) => (
          <li key={n}>{line}</li>
        ))}
      </ul>
    </>
  );
}
