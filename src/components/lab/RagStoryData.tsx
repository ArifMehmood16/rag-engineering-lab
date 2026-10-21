import type { ReactNode } from "react";
import { ArrowRight, Check, Database, FileText } from "lucide-react";
import type { EvidenceRecord } from "@/content/apollo";
import { ENGINE_STAGES, TOY_FEATURES } from "@/lib/apollo-engine";
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
      <div className="tour-question">
        <span>Question carried through the request</span>
        <p>{before.ctx.question}</p>
      </div>
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
