import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowRight, Check, Database, MessageSquare, RotateCcw } from "lucide-react";
import type { EvidenceRecord } from "@/content/apollo";
import {
  KNOWLEDGE_WALKTHROUGH,
  REQUEST_WALKTHROUGH,
  KNOWLEDGE_TAKEAWAYS,
  REQUEST_TAKEAWAYS,
} from "@/content/rag-walkthrough";
import { initEngine, toyEmbedding, type EngineState } from "@/lib/apollo-engine";
import { atOutput, stageInput, stageOutput, walkthroughStep } from "@/lib/rag-walkthrough";
import {
  buildStoryFrames,
  CHAPTER_VIEWPORTS,
  storyMoment,
  storyPosition,
  storyTour,
  type StoryStream,
} from "@/lib/rag-scroll-story";
import { cn } from "@/lib/utils";
import { RagStageScene } from "./RagStageScene";
import {
  KnowledgeInput,
  KnowledgeOutput,
  RequestInput,
  RequestOutput,
  Vector,
} from "./RagStoryData";

type Props = {
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
  const { records, stream, onStream, explored, reduced, lowEffects = false, visible } = props;
  // Parent updates the inspector while we scroll. It must not become a new request seed.
  const [frames, setFrames] = useState(() => buildStoryFrames(props.engine, records));
  const [position, setPosition] = useState({ stream, stage: 0, progress: 0 });
  const [chunkId, setChunkId] = useState("A11-LA-CAP");
  const [motionPaused, setMotionPaused] = useState(false);
  const places = useRef<Record<StoryStream, number>>({ knowledge: 0, request: 0 });
  const highestFrame = useRef(0);
  const callbacks = useRef(props);
  callbacks.current = props;
  const steps = stream === "knowledge" ? KNOWLEDGE_WALKTHROUGH : REQUEST_WALKTHROUGH;
  const count = stream === "knowledge" ? 4 : frames.length - 1;
  const currentPosition =
    position.stream === stream
      ? position
      : storyPosition(
          places.current[stream],
          typeof window === "undefined" ? 720 : window.innerHeight,
          count,
        );
  const stage = Math.min(currentPosition.stage, count - 1);
  const { beat, transfer } = storyMoment(stream, stage, currentPosition.progress);
  const tour = useMemo(() => storyTour(stream, stage, beat, frames), [stream, stage, beat, frames]);
  const step = walkthroughStep(tour);
  const output = atOutput(tour);
  const mode = beat === 0 ? "input" : output ? "output" : "work";
  const record = records.find((r) => r.id === chunkId) ?? records[0]!;
  const values = toyEmbedding(record.text);
  const result = stageOutput(tour)?.results[stage];
  const final = stage === count - 1 && output;
  const next = steps[stage + 1];
  const seen = explored.filter((id) => id.startsWith(`${stream}:`)).length;

  useLayoutEffect(() => {
    window.scrollTo({ top: places.current[stream], behavior: "instant" });
    setPosition({ stream, ...storyPosition(places.current[stream], window.innerHeight, count) });
  }, [stream, count]);
  useEffect(() => {
    let frame = 0;
    const measure = () => {
      frame = 0;
      if (!callbacks.current.visible) return;
      places.current[stream] = window.scrollY;
      const next = storyPosition(window.scrollY, window.innerHeight, count);
      next.progress = Math.round(next.progress * 500) / 500;
      setPosition((prev) =>
        prev.stream === stream && prev.stage === next.stage && prev.progress === next.progress
          ? prev
          : { stream, ...next },
      );
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    measure();
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      cancelAnimationFrame(frame);
    };
  }, [stream, count, visible]);
  useEffect(() => {
    if (stream === "knowledge") callbacks.current.onKnowledge(stage);
    else callbacks.current.onInspect(stage);
  }, [stream, stage]);
  useEffect(() => {
    if (!visible) return;
    if (output) callbacks.current.onExplore(`${stream}:${stage}`);
    if (stream === "request") {
      const frame = stage + (output ? 1 : 0);
      if (frame >= highestFrame.current) {
        highestFrame.current = frame;
        callbacks.current.onEngine(frames[frame]!);
      }
    }
  }, [stream, stage, output, frames, visible]);

  const repeat = () => {
    const last = frames.at(-1)!;
    setFrames(buildStoryFrames(initEngine(last.ctx.question, last.config, last.memory), records));
    highestFrame.current = 0;
    places.current.request = 0;
    setPosition({ stream, stage: 0, progress: 0 });
    window.scrollTo({ top: 0, behavior: "instant" });
  };
  return (
    <section
      id="rag-stage"
      className={cn("rag-scroll-story", reduced && "tour-reduced")}
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
        scrollProgress={transfer}
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
      <div className="story-chapters" aria-hidden>
        {Array.from({ length: count }, (_, n) => (
          <div
            key={n}
            id={`story-${stream}-${n}`}
            data-story-chapter={n}
            style={{ height: `${CHAPTER_VIEWPORTS * 100}svh` }}
          />
        ))}
        <div className="story-end-space" />
      </div>
      <aside className="story-card" aria-label="Current story step">
        <div className="story-card-heading">
          <div className="story-kicker">
            <span>{stream === "knowledge" ? "BUILD KNOWLEDGE" : "ANSWER A QUESTION"}</span>
            <span>
              {String(stage + 1).padStart(2, "0")} / {count}
            </span>
          </div>
          <h2>{step.title}</h2>
          <div className="story-beats" aria-label={`Current focus: ${mode}`}>
            {(["input", "work", "output"] as const).map((part, n) => (
              <span key={part} data-active={mode === part}>
                <b>{n + 1}</b>
                {part}
                <i />
              </span>
            ))}
          </div>
        </div>
        <div className="story-card-body" key={`${stream}:${stage}:${mode}`}>
          {mode === "input" ? (
            <section aria-label="Step input">
              <span className="story-focus-label">
                <ArrowDown size={12} /> Incoming data
              </span>
              {stream === "knowledge" ? (
                <KnowledgeInput
                  stage={stage}
                  beat={beat}
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
            </section>
          ) : mode === "work" ? (
            <section aria-label="Step work">
              <span className="story-focus-label">
                <ArrowDown size={12} /> Watch the glowing path
              </span>
              <ol className="story-operations">
                {step.work.map((work, i) => (
                  <li key={work.title} data-active={beat === i + 1} data-done={beat > i + 1}>
                    <span>{beat > i + 1 ? <Check size={12} /> : i + 1}</span>
                    <div>
                      <strong>{work.title}</strong>
                      {beat === i + 1 && <p>{work.detail}</p>}
                    </div>
                  </li>
                ))}
              </ol>
              {stream === "knowledge" && stage === 2 && <Vector values={values} />}
              {stream === "request" && stage === 3 && (
                <Vector values={toyEmbedding(stageInput(tour).ctx.question)} />
              )}
              <p className="story-work-note">
                {stream === "knowledge"
                  ? "Prepared local data · no LLM call"
                  : "Deterministic replay · no live model"}
              </p>
            </section>
          ) : (
            <section aria-label="Step output">
              <span className="story-focus-label">
                <Check size={12} />{" "}
                {result?.status === "blocked" ? "Stopped at this boundary" : "Result of this step"}
              </span>
              {stream === "knowledge" ? (
                <KnowledgeOutput
                  stage={stage}
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
                  onEvidence={props.onEvidence}
                />
              )}
            </section>
          )}
        </div>
        <footer className="story-card-footer">
          <p>
            {output
              ? (stream === "knowledge" ? KNOWLEDGE_TAKEAWAYS : REQUEST_TAKEAWAYS)[stage]
              : mode === "input"
                ? "Scroll to see what the system does with this input."
                : "The label follows the data along its curved path."}
          </p>
          <div>
            <ArrowDown size={14} />
            <span>
              {final
                ? result?.status === "blocked"
                  ? "Request stopped here"
                  : "Stream complete"
                : output
                  ? `Next: ${next?.short ?? "stream complete"}`
                  : mode === "input"
                    ? `Next: ${step.work[0]!.title}`
                    : "Keep scrolling to reveal the output"}
            </span>
          </div>
          {final && (
            <div className="story-end-actions">
              {stream === "request" && (
                <button type="button" onClick={repeat}>
                  <RotateCcw size={12} /> Replay with warm caches
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
          )}
        </footer>
      </aside>
      <nav className="story-ruler" aria-label="Stream chapters">
        <div>
          <span>{stream === "knowledge" ? "KNOWLEDGE" : "REQUEST"} STREAM</span>
          <small>
            {seen} / {stream === "knowledge" ? 4 : 11} explored
          </small>
        </div>
        <ol>
          {steps.slice(0, count).map((s, n) => (
            <li
              key={s.short}
              data-active={stage === n}
              data-seen={explored.includes(`${stream}:${n}`)}
            >
              <a
                href={`#story-${stream}-${n}`}
                aria-current={stage === n ? "step" : undefined}
                aria-label={`Jump to ${s.short}`}
                onClick={(event) => {
                  event.preventDefault();
                  window.scrollTo({
                    top: n * CHAPTER_VIEWPORTS * window.innerHeight,
                    behavior: "instant",
                  });
                }}
              >
                <span>
                  {explored.includes(`${stream}:${n}`) ? (
                    <Check size={10} />
                  ) : (
                    String(n + 1).padStart(2, "0")
                  )}
                </span>
                <small>{s.short}</small>
              </a>
            </li>
          ))}
        </ol>
        <p>
          <ArrowDown size={14} /> Scroll to explore · scroll back to review
        </p>
      </nav>
    </section>
  );
}
