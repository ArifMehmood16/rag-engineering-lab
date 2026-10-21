import { FLOW_STYLES } from "@/lib/rag-scene";
import type { CSSProperties } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  ArrowDownUp,
  Check,
  Database,
  MessageSquare,
  RotateCcw,
  Mouse,
  ScanLine,
  Binary,
  FileText,
  Scissors,
} from "lucide-react";
import type { EvidenceRecord } from "@/content/apollo";
import {
  KNOWLEDGE_WALKTHROUGH,
  REQUEST_WALKTHROUGH,
  KNOWLEDGE_TAKEAWAYS,
  REQUEST_TAKEAWAYS,
} from "@/content/rag-walkthrough";
import { initEngine, toyEmbedding, type EngineState } from "@/lib/apollo-engine";
import { stageInput, stageOutput, walkthroughStep } from "@/lib/rag-walkthrough";
import { buildStoryFrames, storyTour, type StoryStream } from "@/lib/rag-scroll-story";
import { storyCards } from "@/lib/rag-gallery";
import { cn } from "@/lib/utils";
import { RagStageScene } from "./RagStageScene";
import {
  KnowledgeInput,
  KnowledgeOutput,
  RequestInput,
  RequestOutput,
  Vector,
} from "./RagStoryData";
import { RagExamplePicker } from "./RagExamplePicker";
import type { RequestScenario } from "@/content/rag-scenarios";
import { useRagGallery } from "./useRagGallery";

type Props = {
  scenario: RequestScenario | null;
  onScenario: (id: string) => void;
  engine: EngineState;
  records: EvidenceRecord[];
  stream: StoryStream;
  onStream: (stream: StoryStream) => void;
  explored: string[];
  onExplore: (id: string) => void;
  onEngine: (engine: EngineState) => void;
  onInspect: (stage: number) => void;
  onKnowledge: (stage: number) => void;
  onEvidence: (id: string) => void;
  reduced: boolean;
  lowEffects?: boolean;
  visible: boolean;
};

export function RagWalkthrough(props: Props) {
  const {
    records,
    stream,
    onStream,
    explored,
    reduced,
    lowEffects = false,
    visible,
    scenario,
    onScenario,
    onEvidence,
  } = props;
  const [frames, setFrames] = useState(() => buildStoryFrames(props.engine, records));
  const [chunkId, setChunkId] = useState("A11-LA-CAP");
  const [requestSeen, setRequestSeen] = useState<number[]>([]);
  const [motionPaused, setMotionPaused] = useState(false);
  const highestFrame = useRef(0);
  const callbacks = useRef(props);
  callbacks.current = props;
  const steps = stream === "knowledge" ? KNOWLEDGE_WALKTHROUGH : REQUEST_WALKTHROUGH;
  const count = stream === "knowledge" ? 4 : frames.length - 1;
  const cards = useMemo(() => storyCards(stream, count, frames), [stream, count, frames]);
  const stages = useMemo(() => [...new Set(cards.slice(1).map((c) => c.stage))], [cards]);
  const gallery = useRagGallery(cards, stream, visible, reduced);
  const selected = Math.min(gallery.selected.index, cards.length - 1);
  const card = cards[selected]!;
  const { stage, beat } = card;
  const tour = useMemo(() => storyTour(stream, stage, beat, frames), [stream, stage, beat, frames]);
  const output = card.kind === "output";
  const decisionVisible =
    output || (card.kind === "work" && beat === walkthroughStep(tour).work.length);
  const record = records.find((r) => r.id === chunkId) ?? records[0]!;
  const wasSeen = (n: number) =>
    stream === "request" ? requestSeen.includes(n) : explored.includes(`knowledge:${n}`);
  const seen = stages.filter(wasSeen).length;

  useEffect(() => {
    if (stream === "knowledge") callbacks.current.onKnowledge(stage);
    else callbacks.current.onInspect(stage);
  }, [stream, stage]);
  useEffect(() => {
    if (!visible) return;
    if (output) {
      callbacks.current.onExplore(`${stream}:${stage}`);
      if (stream === "request")
        setRequestSeen((prev) => (prev.includes(stage) ? prev : [...prev, stage]));
    }
    if (stream === "request") {
      const frame = stage + (decisionVisible ? 1 : 0);
      if (frame >= highestFrame.current) {
        highestFrame.current = frame;
        callbacks.current.onEngine(frames[frame]!);
      }
    }
  }, [stream, stage, output, decisionVisible, frames, visible]);
  const { goTo } = gallery;
  const repeat = useCallback(() => {
    const last = frames.at(-1)!;
    highestFrame.current = 0;
    setRequestSeen([]);
    goTo(0);
    setFrames(buildStoryFrames(initEngine(last.ctx.question, last.config, last.memory), records));
  }, [frames, records, goTo]);

  // The reading content is stable while scrolling changes only focus and scene progress.
  const cardContent = useMemo(
    () =>
      cards.map((item) => {
        const snapshot = storyTour(stream, item.stage, item.beat, frames);
        const step = walkthroughStep(snapshot);
        const final = item.stage === count - 1 && item.kind === "output";
        const Icon =
          stream === "knowledge" ? [FileText, Scissors, Binary, Database][item.stage]! : ScanLine;
        if (item.kind === "intro")
          return (
            <>
              <header className="story-card-heading gallery-intro-heading">
                <span className="gallery-start">
                  <Mouse size={14} /> START HERE
                </span>
                <h2>
                  {stream === "knowledge" ? (
                    <>
                      Scroll the cards.
                      <br />
                      Watch the system move.
                    </>
                  ) : (
                    <>
                      One question.
                      <br />
                      One complete path.
                    </>
                  )}
                </h2>
              </header>
              <div className="story-card-body gallery-intro-body">
                <p>Read down this column. The card in the middle controls the scene beside it.</p>
                <p className="gallery-intro-context">
                  {stream === "knowledge"
                    ? "Follow source documents into chunks, vectors, and a searchable index."
                    : (scenario?.purpose ??
                      "Follow the configured question from input to answer. Routing selects a model for later; retrieval comes first.")}
                </p>
                {stream === "request" && scenario && (
                  <p className="example-expectation">{scenario.expected}</p>
                )}
              </div>
              <footer className="story-card-footer">
                <div>
                  <ArrowDown size={14} />
                  <span>Scroll here or use ↓ / Page Down</span>
                </div>
              </footer>
            </>
          );
        return (
          <>
            <header className="story-card-heading">
              <div className="story-kicker">
                <span>
                  {String(stages.indexOf(item.stage) + 1).padStart(2, "0")} / {stages.length} ·{" "}
                  {step.short}
                </span>
                <span className={`gallery-kind kind-${item.kind}`}>
                  {item.kind === "work" ? `Work ${item.beat}/${step.work.length}` : item.kind}
                </span>
              </div>
              <h2>{item.kind === "work" ? step.work[item.beat - 1]!.title : item.title}</h2>
            </header>
            <div className="story-card-body">
              {item.kind === "input" ? (
                <section aria-label="Step input">
                  {stream === "knowledge" ? (
                    <KnowledgeInput
                      stage={item.stage}
                      beat={item.beat}
                      record={record}
                      records={records}
                      onSelect={setChunkId}
                    />
                  ) : (
                    <RequestInput
                      tour={snapshot}
                      records={records}
                      selected={chunkId}
                      onSelect={setChunkId}
                    />
                  )}
                </section>
              ) : item.kind === "work" ? (
                <section aria-label="Step work" className="gallery-operation">
                  <Icon size={25} aria-hidden />
                  <p>{step.work[item.beat - 1]!.detail}</p>
                  {stream === "request" && item.stage === 5 && item.beat === 1 && (
                    <pre className="operation-code">
                      <code>{'get_source_passage({\n  evidence_id: "A11-LA-CAP"\n})'}</code>
                    </pre>
                  )}
                  {stream === "knowledge" && item.stage === 2 && item.beat === 3 && (
                    <Vector values={toyEmbedding(record.text)} />
                  )}
                  {stream === "request" && item.stage === 3 && item.beat === 2 && (
                    <Vector values={toyEmbedding(stageInput(snapshot).ctx.question)} />
                  )}
                  <small>
                    {stream === "knowledge"
                      ? "Prepared local data · no LLM call"
                      : "Deterministic replay · no live model"}
                  </small>
                </section>
              ) : (
                <section aria-label="Step output">
                  {stream === "knowledge" ? (
                    <KnowledgeOutput
                      stage={item.stage}
                      record={record}
                      selected={chunkId}
                      onSelect={setChunkId}
                      records={records}
                    />
                  ) : (
                    <RequestOutput
                      tour={snapshot}
                      records={records}
                      selected={chunkId}
                      onSelect={setChunkId}
                      onEvidence={onEvidence}
                    />
                  )}
                </section>
              )}
            </div>
            <footer className="story-card-footer">
              {item.kind === "output" ? (
                <p>
                  {(stream === "knowledge" ? KNOWLEDGE_TAKEAWAYS : REQUEST_TAKEAWAYS)[item.stage]}
                </p>
              ) : (
                <div>
                  <ArrowDown size={12} />
                  <span>
                    {item.kind === "input"
                      ? "Scroll into the work"
                      : "Keep following this question"}
                  </span>
                </div>
              )}
              {item.kind === "output" && !final && (
                <div className="story-next">
                  Next: {steps[stages[stages.indexOf(item.stage) + 1]!]!.short}
                  {stream === "request"
                    ? " · this same question continues"
                    : " · continue building the index"}
                </div>
              )}
              {final && (
                <>
                  <div>
                    <Check size={13} />
                    <span>
                      {stageOutput(snapshot)?.halted ? "Request stopped here" : "Stream complete"}
                    </span>
                  </div>
                  <div className="story-end-actions">
                    {stream === "request" && (
                      <button
                        type="button"
                        onClick={() =>
                          scenario
                            ? onScenario(scenario.id === "large-answer" ? "cache-hit" : scenario.id)
                            : repeat()
                        }
                      >
                        <RotateCcw size={12} />
                        {scenario?.id === "large-answer"
                          ? "Repeat this question from cache"
                          : scenario
                            ? "Replay this example"
                            : "Replay with warm caches"}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onStream(stream === "knowledge" ? "request" : "knowledge")}
                    >
                      Explore {stream === "knowledge" ? "answering" : "knowledge building"}
                      <ArrowRight size={12} />
                    </button>
                  </div>
                </>
              )}
            </footer>
          </>
        );
      }),
    [
      cards,
      stages,
      steps,
      stream,
      frames,
      record,
      chunkId,
      records,
      count,
      onEvidence,
      scenario,
      onScenario,
      onStream,
      repeat,
    ],
  );
  return (
    <section
      id="rag-stage"
      className={cn("rag-scroll-story gallery-story", reduced && "tour-reduced")}
      aria-label="Scroll through the RAG system"
      data-stream={stream}
      data-stage={stage}
      data-beat={beat}
    >
      <RagStageScene
        tour={tour}
        record={record}
        records={records}
        reduced={reduced}
        lowEffects={lowEffects}
        paused={motionPaused}
        visible={visible}
        duration={4.2}
        scrollProgress={gallery.selected.transfer}
        onPause={() => setMotionPaused(!motionPaused)}
      />
      <header className="story-navigation">
        <div className="story-streams" role="group" aria-label="Independent learning streams">
          <button
            type="button"
            aria-pressed={stream === "knowledge"}
            onClick={() => onStream("knowledge")}
          >
            <Database size={15} />
            <span>
              Build knowledge<small>Documents → searchable index</small>
            </span>
          </button>
          <button
            type="button"
            aria-pressed={stream === "request"}
            onClick={() => onStream("request")}
          >
            <MessageSquare size={15} />
            <span>
              Answer a question<small>Prepared index → checked answer</small>
            </span>
          </button>
        </div>
        <div
          className="story-visit-progress"
          role="progressbar"
          aria-label="Stages explored this visit"
          aria-valuemin={0}
          aria-valuemax={15}
          aria-valuenow={explored.length}
        >
          <span>
            <strong>{explored.length}</strong> / 15 explored
          </span>
          <small>This visit · resets on reload</small>
          <i style={{ transform: `scaleX(${explored.length / 15})` }} />
        </div>
      </header>
      <div className="story-gallery-shell">
        {stream === "request" && <RagExamplePicker scenario={scenario} onSelect={onScenario} />}
        <header className="gallery-header">
          <div>
            <ArrowDownUp size={15} />
            <span>
              Scroll the story<small>The centred card moves the system</small>
            </span>
          </div>
          <span>
            {String(selected + 1).padStart(2, "0")} <b>/ {cards.length}</b>
          </span>
        </header>
        <div
          ref={gallery.viewport}
          className="story-gallery"
          role="region"
          aria-label="Scrollable learning cards"
          aria-describedby="gallery-instructions"
          tabIndex={0}
        >
          <p id="gallery-instructions" className="sr-only">
            Scroll vertically, swipe, or use the arrow and Page Down keys. The card nearest the
            middle controls the animation. Previous and next cards stay visible at a smaller size.
          </p>
          <div ref={gallery.track} className="story-gallery-track">
            {cards.map((item, i) => (
              <article
                key={item.id}
                id={
                  i > 0 && cards[i - 1]?.stage !== item.stage
                    ? `story-${stream}-${item.stage}`
                    : undefined
                }
                ref={(el) => {
                  if (el) gallery.elements.current.set(item.id, el);
                  else gallery.elements.current.delete(item.id);
                }}
                className={cn(
                  "story-card gallery-card",
                  item.kind === "intro" && "gallery-intro-card",
                )}
                aria-label={i === selected ? "Current story step" : `${item.title} · ${item.kind}`}
                aria-current={i === selected ? "step" : undefined}
                data-focused={i === selected}
                data-card-id={item.id}
                data-card-stage={item.stage}
                data-card-beat={item.beat}
                data-card-kind={item.kind}
              >
                {cardContent[i]}
              </article>
            ))}
          </div>
        </div>
        <div className="gallery-scroll-cue" aria-hidden>
          <Mouse size={13} />
          <span>SCROLL THE CARDS</span>
          <ArrowDown size={13} />
        </div>
      </div>
      <nav className="story-ruler" aria-label="Stream chapters">
        {stream === "request" && (
          <div className="journey-question" aria-label="Question for this run">
            <span>THIS QUESTION · {scenario?.title ?? "CUSTOM EXPERIMENT"}</span>
            <p>{frames[0]!.ctx.question}</p>
          </div>
        )}
        <div>
          <span>{stream === "knowledge" ? "KNOWLEDGE" : "REQUEST"} STREAM</span>
          <small>
            {seen} / {stages.length} explored
          </small>
        </div>
        <ol>
          {stages.map((n, ordinal) => {
            const s = steps[n]!;
            return (
              <li key={s.short} data-active={stage === n} data-seen={wasSeen(n)}>
                <a
                  href={`#story-${stream}-${n}`}
                  aria-current={stage === n ? "step" : undefined}
                  aria-label={`Jump to ${s.short}`}
                  onClick={(event) => {
                    event.preventDefault();
                    gallery.goTo(
                      cards.findIndex((item) => item.stage === n && item.kind !== "intro"),
                    );
                  }}
                >
                  <span>
                    {wasSeen(n) ? <Check size={10} /> : String(ordinal + 1).padStart(2, "0")}
                  </span>
                  <small>{s.short}</small>
                </a>
              </li>
            );
          })}
        </ol>
        <ul className="route-key" aria-label="Flow colours">
          {Object.entries(FLOW_STYLES)
            .filter(
              ([key]) =>
                key !== "notice" &&
                (stream === "request" || ["input", "evidence", "generation"].includes(key)),
            )
            .map(([key, style]) => (
              <li key={key} style={{ "--route-color": style.color } as CSSProperties}>
                <i aria-hidden />
                {stream === "knowledge"
                  ? key === "input"
                    ? "Documents"
                    : key === "generation"
                      ? "Encoding"
                      : "Index"
                  : style.label}
              </li>
            ))}
        </ul>
      </nav>
    </section>
  );
}
