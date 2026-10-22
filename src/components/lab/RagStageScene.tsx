import {
  Component,
  lazy,
  Suspense,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
  type CSSProperties,
} from "react";
import { Pause, Play, Sparkles, Maximize2, Focus, RotateCcw } from "lucide-react";
import type { EvidenceRecord } from "@/content/apollo";
import { KNOWLEDGE_TAKEAWAYS, REQUEST_TAKEAWAYS } from "@/content/rag-walkthrough";
import { toyEmbedding } from "@/lib/apollo-engine";
import { atOutput, walkthroughStep, type WalkthroughState } from "@/lib/rag-walkthrough";
import {
  scenePlan,
  sceneConnections,
  REQUEST_NODE_NAMES,
  travelPoint,
  flowRoute,
  flowStyle,
  type SceneNode,
} from "@/lib/rag-scene";
import { flowLabel } from "@/lib/rag-flow-label";
import { cn } from "@/lib/utils";
import type { RagWorldProps } from "./RagWorld";
import { RagTheatreFallback, RagTheatreOverlay } from "./RagTheatrePanel";

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
          viewBox="-11 -8 22 15"
          role="img"
          aria-label="Question flow: user, input checks, router, cache, model branches, tools, output checks, and return to user"
        >
          {sceneConnections(plan).map(([from, to]) => {
            const reverse = plan.transfer.from === to && plan.transfer.to === from;
            const focused = reverse || (plan.transfer.from === from && plan.transfer.to === to);
            const active = plan.moving && focused;
            const route = flowRoute(plan.positions, from, to);
            const style =
              plan.transfer.kind === "notice" && focused
                ? { color: "#e9a0a0" }
                : flowStyle(from, to);
            const points = Array.from({ length: 80 }, (_, n) =>
              travelPoint(route.from, route.to, n / 79, route.via),
            );
            return (
              <g key={`${from}:${to}`} opacity={focused ? 1 : 0.35}>
                <defs>
                  <marker
                    id={`${marker}-${from}-${to}`}
                    markerWidth="5"
                    markerHeight="5"
                    refX="4"
                    refY="2.5"
                    orient="auto-start-reverse"
                    markerUnits="strokeWidth"
                  >
                    <path d="M0,0 L5,2.5 L0,5" fill={style.color} />
                  </marker>
                </defs>
                <path
                  d={points.map(([x, y], n) => `${n ? "L" : "M"}${x},${-y}`).join(" ")}
                  fill="none"
                  stroke={style.color}
                  strokeWidth={active ? 0.045 : 0.03}
                  markerEnd={active && !reverse ? `url(#${marker}-${from}-${to})` : undefined}
                  markerStart={active && reverse ? `url(#${marker}-${from}-${to})` : undefined}
                />
              </g>
            );
          })}
          {Object.entries(REQUEST_NODE_NAMES).map(([name, title]) => {
            const node = name as SceneNode;
            const [x, y] = plan.positions[node]!;
            const radius =
              node === "model" ? 1.05 : node === "index" ? 0.9 : node === "small" ? 0.5 : 0.27;
            return (
              <g key={node} transform={`translate(${x},${-y})`} opacity={1}>
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
                <text y={radius + 0.45} textAnchor="middle" fill="#c4e5ef" fontSize="0.4">
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
    autoOverview?: boolean;
    onPause: () => void;
    annotationOverride?: { mode: "input" | "work" | "output"; text: string; payload?: string };
  },
) {
  const { tour, reduced, paused, onPause, lowEffects } = props;
  const labels = useRef(new Map<SceneNode, HTMLDivElement>());
  const [ready, setReady] = useState(false);
  const [replay, setReplay] = useState(0);
  const [quality, setQuality] = useState<"balanced" | "high">("balanced");
  const flow = useRef<HTMLDivElement>(null);
  const annotation = {
    ...flowLabel(tour, props.record, props.records),
    ...props.annotationOverride,
  };
  const [manualOverview, setOverview] = useState<boolean | null>(null);
  // Idle moments (the intro card, before any flow) show the whole system; flow steps focus.
  const autoOverview = !!props.autoOverview;
  useEffect(() => setOverview(null), [autoOverview]);
  const overview = manualOverview ?? autoOverview;
  useEffect(() => {
    setReady(typeof window.WebGL2RenderingContext !== "undefined");
  }, []);
  const output = atOutput(tour);
  const plan = scenePlan(tour);
  const fallback = props.theatre ? (
    <RagTheatreFallback scene={props.theatre} />
  ) : (
    <StaticWorld tour={tour} record={props.record} />
  );
  return (
    <figure
      className={cn(
        "tour-system-scene",
        tour.phase === "knowledge" && "scene-preparing",
        reduced && "scene-still",
        overview && "scene-overview",
        props.theatre && "scene-theatre",
      )}
      aria-label={
        props.theatre
          ? `3D ${props.theatre.kind} scene: ${props.theatre.title}`
          : `Visual RAG system: ${walkthroughStep(tour).title}`
      }
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
                quality={quality}
                overview={overview}
                labels={labels}
                flowLabel={flow}
              />
            </Suspense>
          ) : (
            fallback
          )}
        </SceneBoundary>
        {ready && !lowEffects && !props.theatre && (
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
                (tour.phase === "knowledge" && node === "vectors" && tour.stage < 2) ||
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
                  data-node={node}
                  data-relevance="visible"
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
          style={
            {
              "--flow-color":
                plan.transfer.kind === "notice"
                  ? "#e9a0a0"
                  : flowStyle(plan.transfer.from, plan.transfer.to).color,
              ...(ready && !lowEffects ? { opacity: 0 } : {}),
              ...(props.theatre ? { display: "none" } : {}),
            } as CSSProperties
          }
        >
          <span>
            {annotation.mode === "work"
              ? tour.phase === "knowledge"
                ? "TRANSFORMING"
                : plan.transfer.from === plan.transfer.to
                  ? "PROCESSING"
                  : "TRANSFERRING"
              : annotation.mode === "input"
                ? "INPUT"
                : "OUTPUT"}
          </span>
          <strong>{annotation.text}</strong>
          <small>{annotation.payload}</small>
          <i />
        </div>
        {props.theatre && <RagTheatreOverlay scene={props.theatre} />}
        <div className="scene-mode-label">
          {props.theatre
            ? "RECORDED EXAMPLE · PLAYS ONCE"
            : plan.blocked
              ? "RELEASE BLOCKED"
              : plan.skipped
                ? "STAGE SKIPPED"
                : output
                  ? "OUTPUT READY"
                  : tour.beat === 0
                    ? "INPUT READY"
                    : plan.transfer.from === plan.transfer.to
                      ? "PROCESSING THIS STEP"
                      : "DATA IN MOTION"}
          <span>
            {reduced
              ? "Motion reduced"
              : paused
                ? "Motion paused"
                : "Scroll to continue · scene rests while you read"}
          </span>
        </div>
        <div className="scene-motion-controls">
          <button
            type="button"
            className="scene-quality"
            aria-label="High detail graphics"
            aria-pressed={quality === "high"}
            title="Balanced uses less power. High detail increases resolution and frame rate."
            onClick={() => setQuality(quality === "high" ? "balanced" : "high")}
          >
            {quality === "high" ? "High detail" : "Balanced"}
          </button>
          {props.theatre && (
            <button
              type="button"
              aria-label="Replay visual example"
              disabled={reduced || paused}
              onClick={() => setReplay((n) => n + 1)}
            >
              <RotateCcw size={14} />
            </button>
          )}
          <button
            type="button"
            aria-label={overview ? "Focus active stage" : "Show whole system"}
            title={overview ? "Focus active stage" : "Show whole system"}
            onClick={() => setOverview(!overview)}
            disabled={Boolean(props.theatre)}
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
