import { Component, lazy, Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import { Pause, Play, RotateCcw, Sparkles, Maximize2, Focus } from "lucide-react";
import type { EvidenceRecord } from "@/content/apollo";
import { KNOWLEDGE_TAKEAWAYS, REQUEST_TAKEAWAYS } from "@/content/rag-walkthrough";
import { toyEmbedding } from "@/lib/apollo-engine";
import { atOutput, walkthroughStep, type WalkthroughState } from "@/lib/rag-walkthrough";
import { scenePlan, type SceneNode } from "@/lib/rag-scene";
import { cn } from "@/lib/utils";
import type { RagWorldProps } from "./RagWorld";

// Keep WebGL and Three out of SSR and the ordinary lesson bundles.
const RagWorld = lazy(() => import("./RagWorld"));
function StaticWorld({ tour, record }: { tour: WalkthroughState; record: EvidenceRecord }) {
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
        {Array.from({ length: 10 }, (_, i) => (
          <i key={i} />
        ))}
      </div>
      <span>→</span>
      <div className="fallback-vectors">
        {toyEmbedding(record.text).map((n, i) => (
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
  const labels = useRef(new Map<SceneNode, HTMLDivElement>());
  const [ready, setReady] = useState(false);
  const [replay, setReplay] = useState(0);
  const [overview, setOverview] = useState(false);
  useEffect(() => {
    setReady(typeof window.WebGL2RenderingContext !== "undefined");
  }, []);
  const output = atOutput(tour);
  const plan = scenePlan(tour);
  const fallback = <StaticWorld tour={tour} record={props.record} />;
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
      <div className="system-viewport">
        <SceneBoundary fallback={fallback}>
          {ready && !lowEffects ? (
            <Suspense fallback={fallback}>
              <RagWorld {...props} replay={replay} overview={overview} labels={labels} />
            </Suspense>
          ) : (
            fallback
          )}
        </SceneBoundary>
        {ready && !lowEffects && (
          <div className="scene-labels" aria-hidden>
            {Object.keys(plan.positions).map((key) => {
              const node = key as SceneNode;
              const names: Partial<Record<SceneNode, string>> = {
                source: "Source documents",
                chunks: "Bounded chunks",
                vectors: "Embedding · 7D",
                index: "Knowledge index",
                model: "Neural AI entity",
                question: "Question",
                retrieve: "Retrieve",
                context: "Context tray",
                cache: "Cache",
                tool: "Read-only tool",
                check: "Release gate",
              };
              if (
                (tour.phase === "knowledge" &&
                  ((node === "chunks" && tour.stage < 1) ||
                    (node === "vectors" && tour.stage < 2))) ||
                !names[node] ||
                (node === "source" && tour.phase !== "knowledge") ||
                (node === "tool" && tour.stage !== 5) ||
                (node === "cache" && tour.stage !== 2)
              )
                return null;
              const note =
                node === "model"
                  ? tour.phase === "knowledge"
                    ? "Standby · no model call"
                    : plan.applicationLookup
                      ? "Application lookup · no model"
                      : plan.skipped
                        ? "No generation"
                        : "Simulated LLM · visual metaphor"
                  : node === "index"
                    ? "Passages + vectors · illustrative layout"
                    : undefined;
              return (
                <div
                  key={node}
                  ref={(element) => {
                    if (element) labels.current.set(node, element);
                    else labels.current.delete(node);
                  }}
                  className={cn("world-label", plan.active === node && "world-label-active")}
                  style={{ opacity: 0 }}
                >
                  {plan.active === node && <span className="world-focus-arrow">↓</span>}
                  <strong>{names[node]}</strong>
                  {note && <small>{note}</small>}
                </div>
              );
            })}
          </div>
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
            aria-label={overview ? "Focus active stage" : "Show whole system"}
            title={overview ? "Focus active stage" : "Show whole system"}
            onClick={() => setOverview(!overview)}
          >
            {overview ? <Focus size={14} /> : <Maximize2 size={14} />}
          </button>
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
      {output ? (
        <div className="scene-takeaway">
          <span>WHAT CHANGED</span>
          <p>
            {(tour.phase === "knowledge" ? KNOWLEDGE_TAKEAWAYS : REQUEST_TAKEAWAYS)[tour.stage]}
          </p>
        </div>
      ) : (
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
      )}
    </figure>
  );
}
