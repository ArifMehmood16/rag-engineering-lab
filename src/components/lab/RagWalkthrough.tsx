import { FLOW_STYLES } from "@/lib/rag-scene";
import { KNOWLEDGE_GUIDES, REQUEST_GUIDES } from "@/content/rag-step-guides";
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
import { RagLearningDock, RagLearningLab, type LearningScene } from "./RagLearningLab";
import type { ExperimentId } from "@/content/rag-lab";

type Props = {
  conceptsExplored: string[];
  onConceptExplore: (id: string) => void;
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
    conceptsExplored,
    onConceptExplore,
  } = props;
  const [concept, setConcept] = useState<ExperimentId | null>(null);
  const [learningScene, setLearningScene] = useState<LearningScene | null>(null);
  const closeLearning = useCallback(() => {
    setConcept(null);
    setLearningScene(null);
  }, []);
  const chooseLearning = (id: ExperimentId) => {
    if (concept === id) return;
    setLearningScene(null);
    setConcept(id);
  };
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
  const gallery = useRagGallery(cards, stream, visible && concept === null, reduced, true);
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
    if (!visible || concept !== null) return;
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
  }, [stream, stage, output, decisionVisible, frames, visible, concept]);
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
        const guide = (stream === "knowledge" ? KNOWLEDGE_GUIDES : REQUEST_GUIDES)[item.stage]!;
        const final = item.stage === count - 1 && item.kind === "output";
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
                <p>
                  Scroll this column. Each step shows its input, the change, and the result. The
                  scene settles so you can read; scrolling continues the story.
                </p>
                <p className="gallery-intro-context">
                  {stream === "knowledge"
                    ? "Follow source documents into chunks, vectors, and a searchable index."
                    : (scenario?.purpose ??
                      "Follow the configured question from input to answer. Routing selects a model for later; retrieval comes first.")}
                </p>
                <ol className="reading-method" aria-label="How to follow each step">
                  <li>See the input</li>
                  <li>Follow the change</li>
                  <li>Read the result</li>
                </ol>
                {stream === "request" && scenario && (
                  <details className="step-thinking">
                    <summary>What to look for</summary>
                    <p>{scenario.expected}</p>
                  </details>
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
                  {item.kind === "work"
                    ? `Change ${item.beat}/${step.work.length}`
                    : item.kind === "output"
                      ? "Result"
                      : "Input"}
                </span>
              </div>
              <h2>{item.kind === "work" ? step.work[item.beat - 1]!.title : item.title}</h2>
              <div className="step-phase-rail" aria-label="Position within this step">
                {(["input", "work", "output"] as const).map((phase) => (
                  <span key={phase} aria-current={phase === item.kind ? "step" : undefined}>
                    {phase === "work" ? "Change" : phase === "output" ? "Result" : "Input"}
                  </span>
                ))}
              </div>
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
                  <div className="step-data-pair" aria-label="This step's data">
                    <span>
                      <small>Starts with</small>
                      <strong>{guide.input}</strong>
                    </span>
                    <ArrowRight size={16} aria-hidden />
                    <span>
                      <small>Produces</small>
                      <strong>{guide.output}</strong>
                    </span>
                  </div>
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
            {item.kind === "output" && (
              <footer className="story-card-footer">
                <p>
                  {(stream === "knowledge" ? KNOWLEDGE_TAKEAWAYS : REQUEST_TAKEAWAYS)[item.stage]}
                </p>
                <details className="step-thinking">
                  <summary>Pause and think</summary>
                  <p>{guide.think}</p>
                </details>
                {!final && (
                  <div className="story-next">
                    Next: {steps[stages[stages.indexOf(item.stage) + 1]!]!.short}
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
                              ? onScenario(
                                  scenario.id === "large-answer" ? "cache-hit" : scenario.id,
                                )
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
            )}
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
      data-learning={concept ?? undefined}
      data-theatre={learningScene?.theatre?.kind}
    >
      <RagStageScene
        tour={learningScene?.tour ?? tour}
        record={record}
        records={records}
        reduced={reduced}
        lowEffects={lowEffects}
        paused={motionPaused}
        visible={visible}
        duration={4.2}
        scrollProgress={learningScene?.progress ?? gallery.selected.transfer}
        autoOverview={!learningScene && card.kind === "intro"}
        {...(learningScene?.theatre ? { theatre: learningScene.theatre } : {})}
        {...(learningScene
          ? {
              annotationOverride: {
                mode: learningScene.mode,
                text: learningScene.title,
                ...(learningScene.offline
                  ? { payload: "3 reviewed fixtures · offline comparisons" }
                  : {}),
              },
            }
          : {})}
        onPause={() => setMotionPaused(!motionPaused)}
      />
      <header className="story-navigation">
        <div className="story-streams" role="group" aria-label="Independent learning streams">
          <button
            type="button"
            aria-pressed={concept === null && stream === "knowledge"}
            onClick={() => {
              closeLearning();
              onStream("knowledge");
            }}
          >
            <Database size={15} />
            <span>
              Build knowledge<small>Documents → searchable index</small>
            </span>
          </button>
          <button
            type="button"
            aria-pressed={concept === null && stream === "request"}
            onClick={() => {
              closeLearning();
              onStream("request");
            }}
          >
            <MessageSquare size={15} />
            <span>
              Answer a question<small>Prepared index → checked answer</small>
            </span>
          </button>
        </div>
        <div className="story-visit-progress">
          <span
            role="progressbar"
            aria-label="Concepts explored this visit"
            aria-valuemin={0}
            aria-valuemax={5}
            aria-valuenow={conceptsExplored.length}
          >
            <strong>{conceptsExplored.length}</strong> / 5 concepts explored
          </span>
          <small
            role="progressbar"
            aria-label="Stages explored this visit"
            aria-valuemin={0}
            aria-valuemax={15}
            aria-valuenow={explored.length}
          >
            {explored.length}/15 flow outputs · this visit
          </small>
          <i style={{ transform: `scaleX(${conceptsExplored.length / 5})` }} />
        </div>
      </header>
      <RagLearningDock active={concept} seen={conceptsExplored} onSelect={chooseLearning} />
      {concept && (
        <RagLearningLab
          key={concept}
          concept={concept}
          records={records}
          reduced={reduced}
          visible={visible}
          onClose={closeLearning}
          onScene={setLearningScene}
          onExplore={onConceptExplore}
        />
      )}
      <div className="story-gallery-shell" style={concept ? { display: "none" } : undefined}>
        {stream === "request" && <RagExamplePicker scenario={scenario} onSelect={onScenario} />}
        <header className="gallery-header">
          <div>
            <ArrowDownUp size={15} />
            <span>
              <span aria-live="polite">
                {card.kind === "intro"
                  ? "Start here"
                  : `${walkthroughStep(tour).short} · ${card.kind === "work" ? "Change" : card.kind === "output" ? "Result" : "Input"}`}
              </span>
              <small>Scroll ↓ · input → change → result</small>
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
      {concept && !learningScene?.theatre && (
        <aside className="learning-world-note">
          <span>
            {learningScene?.offline
              ? "OFFLINE OBSERVER · NO LIVE REQUEST STEP"
              : "ISOLATED TEACHING EXAMPLE"}
          </span>
          <h3>{learningScene?.title ?? "Preparing the example"}</h3>
          <p>{learningScene?.question}</p>
          <small>
            {learningScene?.offline
              ? "The system is held at its completed result. The cards compare separate recorded fixture runs."
              : "Your two stream positions and request state are retained. Back to flow resumes the same story."}
          </small>
        </aside>
      )}
      <nav
        className="story-ruler"
        aria-label="Stream chapters"
        style={concept ? { display: "none" } : undefined}
      >
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
