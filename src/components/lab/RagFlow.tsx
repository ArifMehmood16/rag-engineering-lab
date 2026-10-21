import { useId, useState, type CSSProperties, type ReactNode } from "react";
import {
  ArrowDown,
  ArrowRight,
  BookOpen,
  Check,
  CircleAlert,
  Cpu,
  Database,
  FileText,
  Layers,
  ListFilter,
  MessageSquare,
  ScanLine,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type { EvidenceRecord } from "@/content/apollo";
import { ENGINE_STAGES, queryTerms, toyEmbedding, type EngineState } from "@/lib/apollo-engine";
import { buildKnowledgeIndex } from "@/lib/knowledge-index";
import { cn } from "@/lib/utils";

type Status = "waiting" | "active" | "done" | "blocked" | "skipped";
interface FlowNode {
  id: string;
  title: string;
  caption: string;
  icon: typeof FileText;
  x: number;
  y: number;
  width?: number;
  status: Status;
  stage: number;
  content: ReactNode;
}
export function RagFlow({
  engine,
  records,
  playing,
  reduced,
  selected,
  onSelect,
  onKnowledge,
  knowledgeStep,
  indexing,
}: {
  engine: EngineState;
  records: EvidenceRecord[];
  playing: boolean;
  reduced: boolean;
  selected: number;
  onSelect: (n: number) => void;
  onKnowledge: (n: number) => void;
  knowledgeStep: number;
  indexing: boolean;
}) {
  const id = useId().replace(/:/g, "");
  const [showKnowledge, setShowKnowledge] = useState(false);
  const index = buildKnowledgeIndex(records);
  const stageIndex = (name: string) => ENGINE_STAGES.findIndex((s) => s.id === name);
  const status = (...names: string[]): Status => {
    if (
      engine.ctx.usage.answerHit &&
      names.every((n) => ["retrieve", "assemble", "tool", "sufficiency", "draft"].includes(n))
    )
      return "skipped";
    const indices = names.map(stageIndex);
    if (indices.some((i) => engine.results[i]?.status === "blocked")) return "blocked";
    if (playing && indices.includes(engine.cursor + 1)) return "active";
    const results = indices.map((i) => engine.results[i]);
    if (results.every((r) => r?.status === "skipped")) return "skipped";
    if (results.every(Boolean)) return "done";
    return "waiting";
  };
  const prepared = (n: number): Status =>
    indexing && n === knowledgeStep ? "active" : n <= knowledgeStep ? "done" : "waiting";
  const firstVector = index.chunks[0]?.vector ?? [];
  const queryVector = toyEmbedding(engine.ctx.question);
  const smallVector = (vec: number[]) => (
    <div
      className="vector-grid"
      aria-label={`Toy vector: ${vec.map((v) => v.toFixed(2)).join(", ")}`}
    >
      {vec.map((v, i) => (
        <span key={i} style={{ opacity: 0.35 + v * 0.65 }}>
          {v.toFixed(2)}
        </span>
      ))}
    </div>
  );
  const nodes: FlowNode[] = [
    {
      id: "sources",
      title: "Documents",
      caption: "Permitted source material",
      icon: FileText,
      x: 28,
      y: 54,
      status: prepared(0),
      stage: -1,
      content: (
        <>
          <div className="document-stack">
            {index.sources.map((source) => (
              <i key={source.url} />
            ))}
            <span>{index.sources.length} sources</span>
          </div>
          <p>Text + identity + version</p>
        </>
      ),
    },
    {
      id: "chunks",
      title: "Chunks",
      caption: "Passages with provenance",
      icon: Layers,
      x: 270,
      y: 54,
      status: prepared(1),
      stage: -2,
      content: (
        <>
          <div className="chunk-strips">
            {[0, 1, 2, 3].map((n) => (
              <i key={n}>
                <span />
                {`passage ${n + 1}`}
              </i>
            ))}
          </div>
          <p>{index.chunks.length} eligible fixture records</p>
        </>
      ),
    },
    {
      id: "vectors",
      title: "Embeddings",
      caption: "Encode passage meaning",
      icon: ScanLine,
      x: 512,
      y: 54,
      status: prepared(2),
      stage: -3,
      content: (
        <>
          {smallVector(firstVector)}
          <p>Same 7-dimensional toy model</p>
        </>
      ),
    },
    {
      id: "index",
      title: "Knowledge index",
      caption: "Store vectors + source IDs",
      icon: Database,
      x: 754,
      y: 54,
      status: prepared(3),
      stage: -4,
      content: (
        <>
          <div className="index-rows">
            <span>vector</span>
            <span>passage ID</span>
            {index.chunks.slice(0, 2).map((chunk) => (
              <span className="index-pair" key={chunk.id}>
                <span>[{chunk.vector[0]?.toFixed(2)}, …]</span>
                <span>{chunk.id}</span>
              </span>
            ))}
          </div>
          <p>Searchable local fixture snapshot</p>
        </>
      ),
    },
    {
      id: "question",
      title: "Your question",
      caption: "01 · Check request & scope",
      icon: MessageSquare,
      x: 28,
      y: 276,
      status: status("question", "request", "cache"),
      stage: stageIndex("question"),
      content: (
        <>
          <p className="flow-question">{engine.ctx.question}</p>
          <span className="flow-micro">
            {engine.ctx.usage.answerHit
              ? "Approved-answer hit → release checks"
              : "Question is kept alongside evidence"}
          </span>
        </>
      ),
    },
    {
      id: "retrieve",
      title: "Retrieve",
      caption: "02 · Query ↔ stored passages",
      icon: ListFilter,
      x: 270,
      y: 276,
      status: status("retrieve"),
      stage: stageIndex("retrieve"),
      content: (
        <>
          {engine.config.mode === "keyword" ? (
            <div className="keyword-tokens">
              {queryTerms(engine.ctx.question)
                .slice(0, 4)
                .map((t) => (
                  <span key={t}>{t}</span>
                ))}
            </div>
          ) : (
            smallVector(queryVector)
          )}
          <p>
            {engine.results[stageIndex("retrieve")]
              ? `${engine.ctx.retrieved.length} candidate passages`
              : "Encode query, compare, rank"}
          </p>
          <span className="flow-micro">{engine.config.mode} · similarity ≠ confidence</span>
        </>
      ),
    },
    {
      id: "context",
      title: "Build the context",
      caption: "03 · Select & check sufficiency",
      icon: BookOpen,
      x: 512,
      y: 276,
      status: status("assemble", "tool", "sufficiency"),
      stage: stageIndex("assemble"),
      content: (
        <>
          <div className="context-bracket">
            <span>Instructions</span>
            <span>Question</span>
            <strong>
              {engine.ctx.context.length
                ? `${engine.ctx.context.length} selected passages`
                : "Relevant passages + source IDs"}
            </strong>
          </div>
          <p>
            {engine.ctx.tokensUsed} / ≈{engine.config.budget} tokens
          </p>
        </>
      ),
    },
    {
      id: "model",
      title: engine.ctx.route === "application" ? "Application lookup" : "Language model",
      caption: "04 · Generate from the context",
      icon: Cpu,
      x: 754,
      y: 276,
      status: status("draft"),
      stage: stageIndex("draft"),
      content: (
        <>
          <div className="model-chip">
            <span>ORBIT</span>
            <Cpu size={27} aria-hidden />
            <small>
              {engine.ctx.usage.answerHit
                ? "REUSED ANSWER"
                : engine.ctx.route === "application"
                  ? "NO MODEL"
                  : "FIXTURE GENERATOR"}
            </small>
          </div>
          <p>Context changes. Weights do not.</p>
        </>
      ),
    },
    {
      id: "draft",
      title: "Draft + citations",
      caption: "05 · Still untrusted output",
      icon: FileText,
      x: 754,
      y: 490,
      status: status("draft"),
      stage: stageIndex("draft"),
      content: (
        <>
          <div className="draft-lines">
            {(engine.ctx.claims.length ? engine.ctx.claims : [{ id: "C?", cites: ["source ID"] }])
              .slice(0, 3)
              .map((c) => (
                <span key={c.id}>
                  {c.id} <i /> <b>[{c.cites[0] ?? "missing"}]</b>
                </span>
              ))}
          </div>
          <p>No factual text released yet</p>
        </>
      ),
    },
    {
      id: "checks",
      title: "Verify & authorize",
      caption: "06 · Claim → cited passage",
      icon: ShieldCheck,
      x: 512,
      y: 490,
      status: status("verify", "eligibility"),
      stage: stageIndex("verify"),
      content: (
        <>
          <div className="check-lines">
            {engine.ctx.checks.length ? (
              engine.ctx.checks.map((c) => (
                <span key={c.id}>
                  {c.resolves && c.supported ? <Check size={12} /> : <CircleAlert size={12} />}
                  {c.id} → {c.resolves && c.supported ? "supported" : "withheld"}
                </span>
              ))
            ) : (
              <>
                <span>Resolve citation IDs</span>
                <span>Check claim support</span>
                <span>Recheck current eligibility</span>
              </>
            )}
          </div>
        </>
      ),
    },
    {
      id: "answer",
      title:
        engine.ctx.outcome === "evidence_gap"
          ? "Evidence gap"
          : engine.ctx.outcome === "blocked"
            ? "Answer withheld"
            : engine.ctx.outcome === "infrastructure_error"
              ? "Service unavailable"
              : "Grounded answer",
      caption: "07 · Release only after checks",
      icon: Sparkles,
      x: 28,
      y: 490,
      width: 422,
      status: engine.halted ? "blocked" : status("release"),
      stage: stageIndex("release"),
      content: (
        <>
          <p className="flow-answer">
            {engine.ctx.released?.answer ??
              (engine.ctx.outcome === "evidence_gap"
                ? "The selected corpus cannot support every required fact. No model escalation can create missing evidence."
                : engine.halted
                  ? "The pipeline stopped before releasing factual content. Inspect the blocked stage to see why."
                  : "A supported response with links back to its evidence will appear here.")}
          </p>
          <span className="flow-micro">
            {engine.ctx.released
              ? `${engine.ctx.verified.length} verified claims · inspect citations below`
              : "A plausible draft is not a verified answer"}
          </span>
        </>
      ),
    },
  ];
  const edges = [
    { d: "M208 118H270", active: indexing && knowledgeStep === 1, label: "split" },
    { d: "M450 118H512", active: indexing && knowledgeStep === 2, label: "encode" },
    { d: "M692 118H754", active: indexing && knowledgeStep === 3, label: "store" },
    { d: "M844 182V234H360V276", active: status("retrieve") === "active", label: "search index" },
    { d: "M208 347H270", active: status("retrieve") === "active", label: "query" },
    { d: "M450 347H512", active: status("assemble") === "active", label: "passages" },
    { d: "M692 347H754", active: status("draft") === "active", label: "prompt" },
    { d: "M844 418V490", active: status("draft") === "active", label: "draft" },
    { d: "M754 558H692", active: status("verify", "eligibility") === "active", label: "check" },
    { d: "M512 558H450", active: status("release") === "active", label: "release" },
  ];
  return (
    <figure
      className={cn(
        "rag-figure",
        reduced && "rag-still",
        (showKnowledge || indexing) && "rag-show-knowledge",
      )}
      aria-labelledby="rag-figure-title"
    >
      <figcaption className="rag-figure-heading">
        <span id="rag-figure-title">Retrieval-augmented generation</span>
        <span>
          <i /> data moving between stages
        </span>
      </figcaption>
      <button
        className="mobile-knowledge-toggle"
        type="button"
        aria-expanded={showKnowledge || indexing}
        onClick={() => setShowKnowledge(!showKnowledge)}
      >
        <Database size={14} />
        <span>
          {index.sources.length} sources → {index.chunks.length} indexed passages
        </span>
        <span>{showKnowledge || indexing ? "Hide" : "How?"}</span>
      </button>
      <div className="rag-diagram">
        <div className="rag-lane-label knowledge-label">
          <span>BEFORE QUESTIONS</span> Prepare searchable knowledge{" "}
          <small>Curated fixture chunks · toy vectors · prebuilt index</small>
        </div>
        <div className="rag-lane-label query-label">
          <span>FOR EACH QUESTION</span> Retrieve → augment → generate → verify
        </div>
        <svg
          className="rag-connections"
          viewBox="0 0 1000 648"
          preserveAspectRatio="none"
          aria-hidden
        >
          <defs>
            <marker
              id={`arrow-${id}`}
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="5"
              markerHeight="5"
              orient="auto-start-reverse"
            >
              <path d="M0 0L10 5L0 10" fill="currentColor" />
            </marker>
          </defs>
          <rect x="12" y="40" width="976" height="158" rx="12" className="knowledge-lane" />
          {edges.map((e) => (
            <g key={e.d} className={cn("rag-edge", e.active && "is-moving")}>
              <path d={e.d} markerEnd={`url(#arrow-${id})`} />
              <path d={e.d} pathLength="1" className="rag-packet" />
            </g>
          ))}
          <text x="570" y="224" className="connection-caption">
            stored evidence feeds retrieval
          </text>
          <text x="874" y="456" className="connection-caption">
            draft
          </text>
          {engine.ctx.usage.answerHit && (
            <g className={cn("rag-edge cache-shortcut", playing && !engine.halted && "is-moving")}>
              <path d="M118 418V448H602V490" markerEnd={`url(#arrow-${id})`} />
              <path d="M118 418V448H602V490" pathLength="1" className="rag-packet" />
              <text x="205" y="440" className="connection-caption">
                approved answer → current release checks
              </text>
            </g>
          )}
        </svg>
        {nodes.map((node, n) => (
          <button
            type="button"
            key={node.id}
            aria-pressed={node.stage >= 0 && selected === node.stage}
            aria-label={`${node.title}: ${node.status}. Inspect ${node.stage < 0 ? "knowledge preparation" : "query stage"}`}
            data-status={node.status}
            onClick={() => (node.stage < 0 ? onKnowledge(-node.stage - 1) : onSelect(node.stage))}
            className={cn(
              "rag-node",
              node.stage < 0 && "rag-knowledge",
              node.id === "model" && "rag-model",
              node.id === "answer" && "rag-answer",
              node.stage >= 0 && selected === node.stage && "is-selected",
            )}
            style={
              {
                "--node-x": `${node.x / 10}%`,
                "--node-y": `${node.y / 6.48}%`,
                "--node-width": `${(node.width ?? 180) / 10}%`,
              } as CSSProperties
            }
          >
            <span className="rag-node-caption">{node.caption}</span>
            <span className="rag-node-title">
              <node.icon size={15} aria-hidden />
              {node.title}
              <span className="rag-state-dot" aria-hidden />
            </span>
            <div className="rag-node-payload">{node.content}</div>
            {n < nodes.length - 1 && (
              <ArrowDown className="mobile-flow-arrow" size={16} aria-hidden />
            )}
          </button>
        ))}
      </div>
      <div className="rag-legend">
        <span>
          <i className="legend-idle" /> Waiting
        </span>
        <span>
          <i className="legend-active" /> Processing
        </span>
        <span>
          <i className="legend-done" /> Complete
        </span>
        <span>
          <i className="legend-blocked" /> Withheld
        </span>
        <span>
          <ArrowRight size={12} /> Flow of data, not model reasoning
        </span>
      </div>
    </figure>
  );
}
