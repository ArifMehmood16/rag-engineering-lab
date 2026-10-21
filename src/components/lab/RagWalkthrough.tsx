import { useEffect, useId, useState, type ReactNode } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronsRight,
  Database,
  FileText,
  Pause,
  Play,
  RotateCcw,
  ScanLine,
} from "lucide-react";
import type { EvidenceRecord } from "@/content/apollo";
import { KNOWLEDGE_WALKTHROUGH, REQUEST_WALKTHROUGH } from "@/content/rag-walkthrough";
import {
  ENGINE_STAGES,
  TOY_FEATURES,
  queryTerms,
  toyEmbedding,
  type EngineState,
} from "@/lib/apollo-engine";
import { buildKnowledgeIndex } from "@/lib/knowledge-index";
import {
  atOutput,
  createWalkthrough,
  finishRequest,
  latestEngine,
  nextWalkthrough,
  outputBeat,
  repeatRequest,
  requestFinished,
  selectWalkthroughStage,
  stageInput,
  stageOutput,
  usePreparedIndex,
  walkthroughFinished,
  walkthroughStep,
  type WalkthroughState,
} from "@/lib/rag-walkthrough";
import { cn } from "@/lib/utils";

const FEATURE_NAMES = ["Surface", "Orbit", "Crew", "Module", "Launch", "Backup", "Food"];
const PACES = [
  { seconds: 10, label: "Extra slow · 10s" },
  { seconds: 6, label: "Readable · 6s" },
  { seconds: 4, label: "Steady · 4s" },
];
type Pane = "input" | "work" | "output";

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

function Vector({ values }: { values: number[] }) {
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

function KnowledgeInput({
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

function KnowledgeOutput({
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
        <Check size={14} />
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
        {stage === 3 && (
          <div className="tour-index-link">
            <Database size={15} />
            <code>vector ↔ {chunk.id} ↔ source text</code>
          </div>
        )}
      </ChunkPicker>
    </>
  );
}

function RequestInput({
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

function RequestOutput({
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

export function RagWalkthrough({
  engine,
  records,
  prepared,
  onPrepared,
  onEngine,
  onInspect,
  onKnowledge,
  onEvidence,
  onReset,
  reduced,
  visible,
}: {
  engine: EngineState;
  records: EvidenceRecord[];
  prepared: boolean;
  onPrepared: () => void;
  onEngine: (engine: EngineState) => void;
  onInspect: (stage: number) => void;
  onKnowledge: (stage: number) => void;
  onEvidence: (id: string) => void;
  onReset: () => void;
  reduced: boolean;
  visible: boolean;
}) {
  const [tour, setTour] = useState(() => createWalkthrough(engine, prepared));
  const [auto, setAuto] = useState(false);
  const [seconds, setSeconds] = useState(6);
  const [chunkId, setChunkId] = useState("A11-LA-CAP");
  const [mobilePane, setMobilePane] = useState<Pane | null>(null);
  const titleId = useId();
  const step = walkthroughStep(tour);
  const output = atOutput(tour);
  const ended = walkthroughFinished(tour);
  const attention: Pane = tour.beat === 0 ? "input" : output ? "output" : "work";
  const index = buildKnowledgeIndex(records);
  const record =
    records.find((r) => r.id === chunkId) ?? records.find((r) => r.id === index.chunks[0]!.id)!;
  const active = mobilePane ?? attention;
  const update = (next: WalkthroughState) => {
    setTour(next);
    setMobilePane(null);
    if (latestEngine(next) !== latestEngine(tour)) onEngine(latestEngine(next));
    if (next.preparedThrough === 3) onPrepared();
    if (next.phase === "knowledge") onKnowledge(next.stage);
    else onInspect(next.stage);
  };
  useEffect(() => {
    if (!auto || !visible || output || ended) return;
    const timer = setTimeout(() => {
      const next = nextWalkthrough(tour, records);
      update(next);
      if (atOutput(next)) setAuto(false);
    }, seconds * 1000);
    return () => clearTimeout(timer);
  }, [auto, visible, output, ended, tour, seconds]);

  const select = (phase: WalkthroughState["phase"], stage: number) => {
    setAuto(false);
    update(selectWalkthroughStage(tour, phase, stage));
  };
  const next = () => {
    setAuto(false);
    update(ended ? repeatRequest(tour) : nextWalkthrough(tour, records));
  };
  const play = () => {
    if (ended) update(repeatRequest(tour));
    else if (output) update(nextWalkthrough(tour, records));
    setAuto(true);
  };
  const rawTerms = new Set(record.text.toLowerCase().match(/[a-z0-9]+/g));
  const counts = TOY_FEATURES.map((words) => words.filter((w) => rawTerms.has(w)).length);
  const result = stageOutput(tour)?.results[tour.stage];
  return (
    <section className={cn("rag-tour", reduced && "tour-reduced")} aria-labelledby={titleId}>
      <header className="tour-header">
        <div className="tour-phase-tabs" role="group" aria-label="Learning phase">
          <button
            type="button"
            aria-pressed={tour.phase === "knowledge"}
            onClick={() => select("knowledge", 0)}
          >
            <span>01</span> Build the knowledge
          </button>
          <ArrowRight size={13} aria-hidden />
          <button
            type="button"
            aria-pressed={tour.phase === "request"}
            disabled={tour.preparedThrough < 3}
            onClick={() => select("request", 0)}
          >
            <span>02</span> Answer a question
          </button>
        </div>
        <span className="tour-simulation">Fixture replay · no live LLM</span>
      </header>

      <div className="tour-map" aria-label="Complete RAG pipeline">
        <div className="tour-map-row">
          <span>BEFORE A QUESTION</span>
          <div className="tour-track tour-knowledge-track">
            {KNOWLEDGE_WALKTHROUGH.map((s, n) => (
              <button
                type="button"
                key={s.short}
                aria-pressed={tour.phase === "knowledge" && tour.stage === n}
                disabled={n > tour.preparedThrough + 1}
                data-done={n <= tour.preparedThrough}
                onClick={() => select("knowledge", n)}
              >
                <span>{n <= tour.preparedThrough ? <Check size={11} /> : n + 1}</span>
                {s.short}
                <ArrowRight size={11} aria-hidden />
              </button>
            ))}
          </div>
        </div>
        <div className="tour-map-row">
          <span>FOR EACH QUESTION</span>
          <div className="tour-track tour-request-track">
            {REQUEST_WALKTHROUGH.map((s, n) => (
              <button
                type="button"
                key={s.short}
                aria-pressed={tour.phase === "request" && tour.stage === n}
                disabled={
                  tour.preparedThrough < 3 ||
                  n > latestEngine(tour).cursor + 1 ||
                  (requestFinished(tour) && n > latestEngine(tour).cursor)
                }
                data-done={Boolean(tour.frames[n + 1])}
                onClick={() => select("request", n)}
              >
                <span>{tour.frames[n + 1] ? <Check size={11} /> : n + 1}</span>
                {s.short}
                {n < 10 && <ArrowRight size={10} aria-hidden />}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="tour-stage-heading" aria-live="polite">
        <div>
          <span>
            {tour.phase === "knowledge" ? "Knowledge preparation" : "Request"} · step{" "}
            {tour.stage + 1} of {tour.phase === "knowledge" ? 4 : 11}
          </span>
          <h2 id={titleId}>{step.title}</h2>
        </div>
        <strong className="tour-attention">
          <ScanLine size={15} aria-hidden /> Look here:{" "}
          {attention === "work" ? `work ${tour.beat}/${step.work.length}` : attention}
        </strong>
      </div>

      <div className="tour-pane-tabs" role="group" aria-label="Step panels">
        {(["input", "work", "output"] as const).map((pane) => (
          <button
            type="button"
            key={pane}
            aria-pressed={active === pane}
            onClick={() => setMobilePane(pane)}
          >
            {pane}
            {pane === attention && <ArrowDown size={12} />}
          </button>
        ))}
      </div>
      <div className="tour-panels" data-mobile-pane={active}>
        <section
          className="tour-pane"
          data-pane="input"
          data-attention={attention === "input"}
          aria-label="Step input"
        >
          <h3>
            <span>01</span> Input
            {attention === "input" && (
              <span className="tour-look">
                <ArrowDown size={13} /> Start here
              </span>
            )}
          </h3>
          <div className="tour-pane-content">
            {tour.phase === "knowledge" ? (
              <KnowledgeInput
                stage={tour.stage}
                beat={tour.beat}
                record={record}
                records={records}
                onSelect={setChunkId}
              />
            ) : (
              <RequestInput
                tour={tour}
                records={records}
                selected={chunkId}
                onSelect={setChunkId}
              />
            )}
          </div>
        </section>
        <section
          className="tour-pane tour-work-pane"
          data-pane="work"
          data-attention={attention === "work"}
          aria-label="Step work"
        >
          <h3>
            <span>02</span> Work
            {attention === "work" && (
              <span className="tour-look">
                <ArrowDown size={13} /> Follow this
              </span>
            )}
          </h3>
          <div className="tour-pane-content">
            <ol className="tour-work-steps">
              {step.work.map((work, n) => (
                <li
                  key={work.title}
                  aria-current={tour.beat === n + 1 ? "step" : undefined}
                  data-done={tour.beat > n + 1}
                >
                  <span>{tour.beat > n + 1 ? <Check size={13} /> : n + 1}</span>
                  <div>
                    <strong>{work.title}</strong>
                    <p>{work.detail}</p>
                  </div>
                  {tour.beat === n + 1 && (
                    <ArrowLeft className="tour-work-pointer" size={17} aria-hidden />
                  )}
                </li>
              ))}
            </ol>
            {tour.phase === "knowledge" && tour.stage === 2 && tour.beat >= 2 && (
              <div className="tour-feature-counts">
                <span>Matched features in this chunk</span>
                <div>
                  {counts.map((count, n) => (
                    <span key={n}>
                      {FEATURE_NAMES[n]} <b>{count}</b>
                    </span>
                  ))}
                </div>
                <small>Normalise by √({counts.map((n) => `${n}²`).join(" + ")})</small>
              </div>
            )}
            {tour.phase === "request" && tour.stage === 3 && tour.beat >= 1 && (
              <div className="tour-feature-counts">
                <span>The query in the index’s representation</span>
                {stageInput(tour).config.mode === "keyword" ? (
                  <p>{queryTerms(stageInput(tour).ctx.question).join(" · ")}</p>
                ) : (
                  <Vector values={toyEmbedding(stageInput(tour).ctx.question)} />
                )}
              </div>
            )}
            {result?.status === "skipped" && output && (
              <p className="tour-data-note">
                The engine skipped this stage on the chosen route; no extra model or tool work
                occurred.
              </p>
            )}
          </div>
        </section>
        <section
          className="tour-pane"
          data-pane="output"
          data-attention={attention === "output"}
          aria-label="Step output"
        >
          <h3>
            <span>03</span> Output
            {attention === "output" && (
              <span className="tour-look">
                <ArrowDown size={13} /> Read the result
              </span>
            )}
          </h3>
          <div className="tour-pane-content">
            {!output ? (
              <div className="tour-output-wait">
                <ScanLine size={27} />
                <strong>Output appears after the work</strong>
                <p>
                  Follow each highlighted sub-step. Nothing advances until you choose Next, or play
                  this step slowly.
                </p>
                <span>
                  {tour.beat} / {outputBeat(tour)} transitions
                </span>
              </div>
            ) : tour.phase === "knowledge" ? (
              <KnowledgeOutput
                stage={tour.stage}
                record={record}
                selected={chunkId}
                onSelect={setChunkId}
                records={records}
              />
            ) : (
              <RequestOutput
                tour={tour}
                records={records}
                selected={chunkId}
                onSelect={setChunkId}
                onEvidence={onEvidence}
              />
            )}
          </div>
        </section>
      </div>

      <footer className="tour-controls">
        <div className="tour-main-controls">
          <button type="button" className="tour-next" onClick={next} disabled={auto}>
            {ended
              ? "Repeat question"
              : output
                ? tour.phase === "knowledge" && tour.stage === 3
                  ? "Ask the first question"
                  : "Next stage"
                : tour.beat === outputBeat(tour) - 1
                  ? "Show output"
                  : "Next sub-step"}
            <ArrowRight size={14} />
          </button>
          <button type="button" onClick={auto ? () => setAuto(false) : play}>
            {auto ? <Pause size={14} /> : <Play size={14} />}
            {auto
              ? "Pause"
              : ended
                ? "Play request again"
                : output
                  ? "Play next stage"
                  : "Play this step"}
          </button>
          <div className="tour-pace">
            <label htmlFor={`${titleId}-pace`}>Pace</label>
            <select
              id={`${titleId}-pace`}
              value={seconds}
              onChange={(e) => setSeconds(Number(e.target.value))}
            >
              {PACES.map((pace) => (
                <option key={pace.seconds} value={pace.seconds}>
                  {pace.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <p role="status">
          {auto
            ? `One sub-step every ${seconds}s. Pauses at the output.`
            : output
              ? "Paused at output. Read it for as long as you need."
              : "Manual mode. You control every sub-step."}
        </p>
        <div className="tour-secondary-controls">
          {output && (
            <button
              type="button"
              onClick={() => {
                setAuto(false);
                update({ ...tour, beat: 0 });
              }}
            >
              <ArrowLeft size={12} /> Review input
            </button>
          )}
          <button type="button" aria-label="Restart walkthrough" onClick={onReset}>
            <RotateCcw size={12} />
            Restart
          </button>
          {tour.phase === "knowledge" ? (
            <button
              type="button"
              onClick={() => {
                setAuto(false);
                update(usePreparedIndex(tour));
              }}
            >
              Use prepared index <ChevronsRight size={12} />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setAuto(false);
                update(finishRequest(tour, records));
              }}
            >
              {requestFinished(tour) ? "Repeat instantly" : "Run to result"}
              <ChevronsRight size={12} />
            </button>
          )}
        </div>
      </footer>
    </section>
  );
}
