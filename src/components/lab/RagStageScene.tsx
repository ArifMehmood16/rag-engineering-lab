import {
  Component,
  lazy,
  Suspense,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Pause, Play, Sparkles, Maximize2, Focus } from "lucide-react";
import type { EvidenceRecord } from "@/content/apollo";
import { KNOWLEDGE_TAKEAWAYS, REQUEST_TAKEAWAYS } from "@/content/rag-walkthrough";
import { toyEmbedding } from "@/lib/apollo-engine";
import { atOutput, walkthroughStep, type WalkthroughState } from "@/lib/rag-walkthrough";
import {
  scenePlan,
  REQUEST_CONNECTIONS,
  REQUEST_NODE_NAMES,
  travelPoint,
  flowWaypoints,
  type SceneNode,
} from "@/lib/rag-scene";
import { flowLabel } from "@/lib/rag-flow-label";
import { cn } from "@/lib/utils";
import type { RagWorldProps } from "./RagWorld";

// Keep WebGL and Three out of SSR and the ordinary lesson bundles.
const RagWorld = lazy(() => import("./RagWorld"));
function StaticWorld({ tour, record }: { tour: WalkthroughState; record: EvidenceRecord }) {
  const plan = scenePlan(tour);
  const marker = useId();
  const kind = plan.transfer.kind;
  if (tour.phase === "request")
    return (
      <div className="world-fallback request-fallback">
        <svg
          viewBox="-9 -6.2 16 11"
          role="img"
          aria-label="Question flow: user, input checks, router, cache, model branches, tools, output checks, and return to user"
        >
          <defs>
            <marker
              id={marker}
              markerWidth="5"
              markerHeight="5"
              refX="4"
              refY="2.5"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <path d="M0,0 L5,2.5 L0,5" fill="#80c5d4" />
            </marker>
          </defs>
          {REQUEST_CONNECTIONS.map(([from, to]) => {
            const active =
              plan.moving && plan.transfer.from === from && plan.transfer.to === to;
            const points = Array.from({ length: 40 }, (_, n) =>
              travelPoint(
                plan.positions[from]!,
                plan.positions[to]!,
                n / 39,
                flowWaypoints(from, to),
              ),
            );
            return (
              <path
                key={`${from}:${to}`}
                d={points.map(([x, y], n) => `${n ? "L" : "M"}${x},${-y}`).join(" ")}
                fill="none"
                stroke={active ? "#80c4b7" : "#71879e"}
                strokeWidth={active ? 0.04 : 0.025}
                markerEnd={`url(#${marker})`}
              />
            );
          })}
          {Object.entries(REQUEST_NODE_NAMES).map(([name, title]) => {
            const node = name as SceneNode;
            const [x, y] = plan.positions[node]!;
            const radius =
              node === "model" ? 1.05 : node === "index" ? 0.9 : node === "small" ? 0.5 : 0.27;
            return (
              <g key={node} transform={`translate(${x},${-y})`}>
                <circle
                  r={radius}
                  fill="#0b1c2c"
                  stroke={plan.active === node ? "#b7fff0" : "#82b9cc"}
                  strokeWidth="0.025"
                />
                {(node === "model" || node === "small" || node === "index") && (
                  <circle
                    r={radius * 0.7}
                    fill="none"
                    stroke="#6086b0"
                    strokeWidth="0.02"
                    strokeDasharray=".1 .1"
                  />
                )}
                <text y={radius + 0.45} textAnchor="middle" fill="#c4e5ef" fontSize="0.26">
                  {title}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    );
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
  const replay = 0;
  const flow = useRef<HTMLDivElement>(null);
  const annotation = flowLabel(tour, props.record, props.records);
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
              <RagWorld
                {...props}
                replay={replay}
                overview={overview}
                labels={labels}
                flowLabel={flow}
              />
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
                ...REQUEST_NODE_NAMES,
                source: "Source documents",
                chunks: "Bounded chunks",
                vectors: "Embedding · 7D",
              };
              if (
                (tour.phase === "knowledge" &&
                  ((node === "chunks" && tour.stage < 1) ||
                    (node === "vectors" && tour.stage < 2))) ||
                !names[node] ||
                (node === "source" && tour.phase !== "knowledge")
              )
                return null;
              const input = tour.frames[tour.stage] ?? tour.frames[0]!;
              const note =
                node === "question"
                  ? tour.stage === 10
                    ? output
                      ? "Answer received"
                      : "Returning answer"
                    : "Question input"
                  : node === "input"
                    ? "Input + access"
                    : node === "router"
                      ? plan.applicationLookup
                        ? "Application lookup"
                        : "Route selection"
                      : node === "cache"
                        ? plan.cached
                          ? "Hit · output checks still run"
                          : input.config.answerCache
                            ? "Scoped, versioned reuse"
                            : "Disabled in this run"
                        : node === "small"
                          ? plan.generator === "small" && !plan.cached
                            ? "Selected profile · simulated"
                            : "Standby · simulated profile"
                          : node === "tool"
                            ? input.config.tool === "off"
                              ? "Optional · no call in this run"
                              : "Read-only passage lookup"
                            : node === "check"
                              ? "Claims · citations · permissions"
                              : node === "model"
                                ? tour.phase === "knowledge"
                                  ? "Standby · no model call"
                                  : plan.generator === "model" && !plan.cached
                                    ? "Selected large profile · simulated"
                                    : "Standby · large profile"
                                : node === "index"
                                  ? tour.phase === "knowledge" && !(tour.stage === 3 && output)
                                    ? "Scaffold · awaiting indexed passages"
                                    : "Passages + vectors · illustrative layout"
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
                  {note &&
                    (plan.active === node ||
                      (node === "small" && tour.stage === 7) ||
                      (node === "model" && tour.stage === 7) ||
                      (node === "tool" && tour.stage === 5) ||
                      (node === "cache" && tour.stage === 2)) && <small>{note}</small>}
                </div>
              );
            })}
          </div>
        )}
        <div
          ref={flow}
          className={`scene-flow-label flow-${annotation.mode}`}
          aria-label="Flow annotation"
          style={ready && !lowEffects ? { opacity: 0 } : undefined}
        >
          <span>
            {annotation.mode === "work"
              ? "TRANSFORMING"
              : annotation.mode === "input"
                ? "INPUT"
                : "OUTPUT"}
          </span>
          <strong>{annotation.text}</strong>
          <i />
        </div>
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
            aria-label={paused ? "Resume ambient motion" : "Pause ambient motion"}
            onClick={onPause}
            disabled={reduced}
          >
            {paused ? <Play size={13} /> : <Pause size={13} />}
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
