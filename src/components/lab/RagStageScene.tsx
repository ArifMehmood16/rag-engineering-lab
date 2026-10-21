import { Component, lazy, Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import { Pause, Play, RotateCcw, Sparkles } from "lucide-react";
import type { EvidenceRecord } from "@/content/apollo";
import { atOutput, walkthroughStep, type WalkthroughState } from "@/lib/rag-walkthrough";
import { scenePlan, type SceneNode } from "@/lib/rag-scene";
import { cn } from "@/lib/utils";
import type { RagWorldProps } from "./RagWorld";

const LABELS: Partial<Record<SceneNode, [string, number, string?]>> = {
  source: ["Documents", -0.94, "2 sources"],
  chunks: ["Chunks", -1.05, "10 passages"],
  vectors: ["Vectors · 7D", -0.85, "Actual toy values"],
  index: ["Knowledge index", -0.7],
  question: ["Question", -0.7],
  retrieve: ["Retrieve", -0.65],
  context: ["Context", -0.75],
  cache: ["Cache", -0.65],
  tool: ["Read-only tool", -0.48],
  model: ["AI entity", -2.05],
  check: ["Release gate", -0.8],
  answer: ["Answer", -0.8],
};
function SceneLabels({
  tour,
  width,
  height,
}: {
  tour: WalkthroughState;
  width: number;
  height: number;
}) {
  const plan = scenePlan(tour);
  const zoom = Math.min(width / 11.8, height / 5.35);
  return (
    <div className="scene-labels" aria-hidden>
      {Object.entries(plan.positions).map(([key, p]) => {
        const node = key as SceneNode;
        const label = LABELS[node];
        if (
          !label ||
          node === "answer" ||
          (node === "source" && tour.phase === "request") ||
          (node === "tool" && tour.stage !== 5) ||
          (node === "cache" && tour.stage !== 2)
        )
          return null;
        const isModel = node === "model";
        const name = node === "check" && tour.stage === 10 ? "Answer" : label[0];
        const note = isModel
          ? tour.phase === "knowledge"
            ? "Standby · no model call"
            : tour.stage === 7
              ? "Fixture generation"
              : "LLM · simulated"
          : label[2];
        return (
          <div
            key={node}
            className={cn("world-label", plan.active === node && "world-label-active")}
            style={{
              left: width / 2 + p[0] * zoom,
              top: height / 2 - ((p[1] + label[1]) * 0.989 - (p[2] + 0.2) * 0.148) * zoom,
            }}
          >
            {plan.active === node && <span className="world-focus-arrow">↓</span>}
            <strong>{name}</strong>
            {note && <small>{note}</small>}
          </div>
        );
      })}
    </div>
  );
}

// Keep WebGL and Three out of SSR and the ordinary lesson bundles.
const RagWorld = lazy(() => import("./RagWorld"));
function StaticWorld({ tour }: { tour: WalkthroughState }) {
  const kind = scenePlan(tour).transfer.kind;
  return (
    <div className="world-fallback" aria-label="Static system illustration">
      <div className="fallback-pages">
        <i />
        <i />
        <i />
      </div>
      <span>→</span>
      <div className="fallback-chunks">
        {Array.from({ length: 6 }, (_, i) => (
          <i key={i} />
        ))}
      </div>
      <span>→</span>
      <div className="fallback-vectors">
        {[0.3, 0.7, 0.4, 0.9, 0.2, 0.6, 0.35].map((n, i) => (
          <i key={i} style={{ height: `${n * 60}px` }} />
        ))}
      </div>
      <div className="fallback-entity">
        <Sparkles size={50} />
      </div>
      <p>
        {kind === "split"
          ? "Document → bounded chunks"
          : kind === "encode"
            ? "Chunk → numeric vector"
            : "Documents → index → context → AI → checked answer"}
        <small>Static view · the same data is available in the step reader</small>
      </p>
    </div>
  );
}
class SceneBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  override state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  override render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
export function RagStageScene(
  props: Omit<RagWorldProps, "paused" | "replay"> & {
    paused: boolean;
    lowEffects?: boolean;
    onPause: () => void;
  },
) {
  const { tour, reduced, paused, onPause, lowEffects } = props;
  const viewport = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 800, height: 400 });
  const [ready, setReady] = useState(false);
  const [replay, setReplay] = useState(0);
  useEffect(() => {
    setReady(typeof window.WebGL2RenderingContext !== "undefined");
  }, []);
  useEffect(() => {
    if (!viewport.current || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setSize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(viewport.current);
    return () => observer.disconnect();
  }, []);
  const output = atOutput(tour);
  const plan = scenePlan(tour);
  const fallback = <StaticWorld tour={tour} />;
  return (
    <figure
      className={cn(
        "tour-system-scene",
        tour.phase === "knowledge" && "scene-preparing",
        reduced && "scene-still",
      )}
      aria-label={`Visual RAG system: ${walkthroughStep(tour).title}`}
    >
      <figcaption>
        <span className="scene-live-dot" /> SYSTEM / 3D{" "}
        <span>{tour.phase === "knowledge" ? "Prepare the evidence" : "Follow the request"}</span>
      </figcaption>
      <div className="system-viewport" ref={viewport}>
        <SceneBoundary fallback={fallback}>
          {ready && !lowEffects ? (
            <Suspense fallback={fallback}>
              <RagWorld {...props} replay={replay} />
            </Suspense>
          ) : (
            fallback
          )}
        </SceneBoundary>
        {ready && !lowEffects && (
          <SceneLabels tour={tour} width={size.width} height={size.height} />
        )}
        <div className="scene-mode-label">
          {plan.blocked
            ? "RELEASE BLOCKED"
            : plan.skipped
              ? "STAGE SKIPPED"
              : output
                ? "OUTPUT READY"
                : tour.beat === 0
                  ? "INPUT READY"
                  : "DATA IN MOTION"}
          <span>{reduced ? "Motion reduced" : paused ? "Motion paused" : "Neon / depth view"}</span>
        </div>
        <div className="scene-motion-controls">
          <button
            type="button"
            aria-label={paused ? "Resume visual motion" : "Pause visual motion"}
            onClick={onPause}
            disabled={reduced}
          >
            {paused ? <Play size={13} /> : <Pause size={13} />}
          </button>
          <button
            type="button"
            aria-label="Replay visual transfer"
            onClick={() => setReplay((n) => n + 1)}
            disabled={!plan.moving || reduced || paused}
          >
            <RotateCcw size={13} />
          </button>
        </div>
      </div>
      <div className="scene-flow-caption" aria-hidden>
        {tour.phase === "knowledge" ? (
          <>
            <span data-active={tour.stage === 0}>Documents</span>
            <b>→</b>
            <span data-active={tour.stage === 1}>Chunks</span>
            <b>→</b>
            <span data-active={tour.stage === 2}>Vectors</span>
            <b>→</b>
            <span data-active={tour.stage === 3}>Index</span>
          </>
        ) : (
          <>
            <span>Question</span>
            <b>→</b>
            <span data-active={tour.stage === 3}>Retrieve</span>
            <b>→</b>
            <span data-active={tour.stage === 4}>Context</span>
            <b>→</b>
            <span data-active={tour.stage === 7}>AI</span>
            <b>→</b>
            <span data-active={tour.stage >= 8}>Check & release</span>
          </>
        )}
      </div>
    </figure>
  );
}
