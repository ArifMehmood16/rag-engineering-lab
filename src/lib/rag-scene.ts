import { getApolloQuestion } from "@/content/apollo";
import {
  atOutput,
  stageInput,
  stageOutput,
  walkthroughStep,
  type WalkthroughState,
} from "./rag-walkthrough";

export type SceneNode =
  | "source"
  | "chunks"
  | "vectors"
  | "index"
  | "question"
  | "input"
  | "small"
  | "router"
  | "cache"
  | "retrieve"
  | "context"
  | "tool"
  | "model"
  | "check"
  | "answer";
export type Point3 = [number, number, number];
export interface SceneTransfer {
  from: SceneNode;
  to: SceneNode;
  kind: "document" | "split" | "encode" | "vector" | "query" | "evidence" | "draft" | "answer";
}

// World coordinates, shared by objects, connections and the travelling data.
export const PREPARATION_POSITIONS: Partial<Record<SceneNode, Point3>> = {
  source: [-5, -0.7, 0.7],
  chunks: [-2.5, -0.7, 0.8],
  vectors: [0.2, -0.7, 0.5],
  index: [3.2, 0.7, -0.8],
  model: [7.2, 1.2, -0.5],
};
export const REQUEST_POSITIONS: Partial<Record<SceneNode, Point3>> = {
  question: [-8, 0, 0.4],
  input: [-6, 0, 0.4],
  router: [-4.1, 0, 0.4],
  cache: [-6.4, 2.25, -0.2],
  small: [-3.1, -2.25, 0.6],
  retrieve: [-2.5, 2.05, 0.4],
  index: [-2.35, 4.5, -1.8],
  context: [0.1, 3.1, 0.65],
  model: [1.7, 0, 0],
  tool: [4.2, 3, 0.15],
  check: [5.25, 0, 0.4],
  // The response returns to the same person who supplied the question.
  answer: [-8, 0, 0.4],
};

export const REQUEST_CONNECTIONS: [SceneNode, SceneNode][] = [
  ["question", "input"],
  ["input", "router"],
  ["router", "cache"],
  ["cache", "router"],
  ["router", "small"],
  ["router", "model"],
  ["router", "retrieve"],
  ["router", "context"],
  ["index", "retrieve"],
  ["retrieve", "context"],
  ["context", "model"],
  ["context", "small"],
  ["context", "check"],
  ["model", "check"],
  ["small", "check"],
  ["cache", "check"],
  ["index", "check"],
  ["context", "tool"],
  ["tool", "context"],
  ["model", "tool"],
  ["check", "question"],
];
export const REQUEST_NODE_NAMES: Partial<Record<SceneNode, string>> = {
  question: "You",
  input: "Input checks",
  router: "Router",
  cache: "Answer cache",
  small: "Small LLM",
  retrieve: "Retrieve",
  index: "Knowledge index",
  context: "Context tray",
  model: "LLM",
  tool: "Tools",
  check: "Output checks",
};

/** Shared bends keep lines, arrowheads, data packets, labels and focus on one route. */
const PATH_BENDS: Partial<Record<string, Point3[]>> = {
  "source:chunks": [[-3.8, -0.45, 0.8]],
  "chunks:vectors": [[-1.15, -0.4, 0.8]],
  "vectors:index": [[1.7, -0.35, 0.2]],
  "question:input": [[-7, 0.15, 0.4]],
  "input:router": [[-5.05, 0.15, 0.4]],
  "router:cache": [
    [-4.55, 1.5, 0.4],
    [-5.2, 2.8, 0.2],
  ],
  "cache:router": [
    [-6.1, 1.1, 0.7],
    [-4.8, 0.65, 0.6],
  ],
  "router:small": [
    [-4.25, -1.15, 0.5],
    [-4, -1.3, 0.6],
  ],
  "router:model": [
    [-2, 0.1, 0.4],
    [-0.8, -0.1, 0.3],
  ],
  "router:retrieve": [[-3.65, 1.25, 0.4]],
  "router:context": [
    [-2.9, 0.7, -0.8],
    [-0.5, 1.6, -0.8],
  ],
  "index:retrieve": [[-2.65, 2.65, -0.4]],
  "retrieve:context": [[-1.3, 2.65, 0.55]],
  "context:model": [[0.45, 2.45, 0.5]],
  "context:small": [
    [-1.2, 1.7, 0.8],
    [-2.2, 0.5, 0.9],
    [-2.6, -1.15, 0.8],
  ],
  "model:check": [[4.2, 0, 0.4]],
  "small:check": [
    [-1.2, -3.3, 0.5],
    [3, -3.3, 0.5],
    [4.8, -1.6, 0.5],
  ],
  // Bypass, validation, and release each have their own perimeter lane.
  "cache:check": [
    [-6.7, 5.6, -1],
    [-4.6, 7.2, -1],
    [6.5, 7.2, -1],
    [8.1, 3.6, -0.2],
    [7.1, -0.8, 0.4],
  ],
  "index:check": [
    [-0.3, 6.5, -0.6],
    [5.7, 6.5, -0.6],
    [7.1, 3, 0.2],
    [6.55, 0.5, 0.4],
  ],
  "context:check": [
    [1.5, 4.7, 0.5],
    [5.2, 4.8, 0.4],
    [6.1, 1.6, 0.4],
  ],
  "context:tool": [
    [1.5, 4, 0.6],
    [3.2, 4, 0.4],
  ],
  "tool:context": [
    [3.25, 2.55, 0.8],
    [1.25, 2.65, 0.8],
  ],
  "model:tool": [
    [4.15, 1.05, 0.5],
    [5.5, 1.65, 0.5],
    [5.5, 2.8, 0.3],
  ],
  "check:question": [
    [5.5, -3.7, 0.5],
    [0, -4.3, 0.6],
    [-6.7, -3.5, 0.6],
  ],
  "input:question": [[-7, -1.2, 0.8]],
};
const STRAIGHT_PATH: Point3[] = [];
export const flowWaypoints = (from: SceneNode, to: SceneNode) =>
  PATH_BENDS[`${from}:${to}`] ?? STRAIGHT_PATH;

export const NODE_RADIUS: Partial<Record<SceneNode, number>> = {
  source: 0.7,
  chunks: 0.75,
  vectors: 0.7,
  index: 1.65,
  model: 2.15,
  question: 0.65,
  input: 0.55,
  router: 0.35,
  cache: 0.65,
  small: 1,
  retrieve: 0.45,
  context: 0.65,
  tool: 0.65,
  check: 0.55,
};

/** Connect the outside of each object, rather than drawing through its centre. */
export function flowRoute(
  positions: Partial<Record<SceneNode, Point3>>,
  from: SceneNode,
  to: SceneNode,
) {
  const start = positions[from]!;
  const end = positions[to]!;
  if (from === to) return { from: start, to: end, via: STRAIGHT_PATH };
  const via = flowWaypoints(from, to);
  const port = (center: Point3, toward: Point3, radius: number): Point3 => {
    const length = Math.hypot(...toward.map((v, i) => v - center[i]!));
    return center.map(
      (v, i) => v + ((toward[i]! - v) / Math.max(0.001, length)) * Math.min(radius, length * 0.98),
    ) as Point3;
  };
  return {
    from: port(start, via[0] ?? end, NODE_RADIUS[from] ?? 0.5),
    to: port(end, via.at(-1) ?? start, NODE_RADIUS[to] ?? 0.5),
    via,
  };
}

export const FLOW_STYLES = {
  input: { color: "#79baff", label: "Request" },
  evidence: { color: "#69d6ca", label: "Evidence" },
  generation: { color: "#c4a0ef", label: "Model" },
  cache: { color: "#e7ba7b", label: "Cache" },
  tool: { color: "#eea1b9", label: "Tool" },
  release: { color: "#94d8a3", label: "Checks & return" },
} as const;
export function flowStyle(from: SceneNode, to: SceneNode) {
  return FLOW_STYLES[
    from === "cache" || to === "cache"
      ? "cache"
      : from === "tool" || to === "tool"
        ? "tool"
        : from === "check" || (to === "check" && from !== "model" && from !== "small")
          ? "release"
          : from === "model" ||
              from === "small" ||
              to === "model" ||
              to === "small" ||
              to === "vectors"
            ? "generation"
            : from === "index" || from === "retrieve" || from === "vectors" || to === "index"
              ? "evidence"
              : "input"
  ];
}

export function nodeEmphasis(
  plan: ReturnType<typeof scenePlan>,
  node: SceneNode,
  overview = false,
) {
  if (overview) return 0.9;
  if (node === plan.active) return 1;
  if (!plan.skipped && !plan.blocked && (node === plan.transfer.from || node === plan.transfer.to))
    return 0.85;
  return 0.2;
}

export function requestModel(tour: WalkthroughState): "model" | "small" | "context" {
  const input = stageInput(tour);
  const route =
    tour.stage > 2
      ? input.ctx.route
      : getApolloQuestion(input.ctx.question).kind === "metadata"
        ? "application"
        : input.config.profile === "large"
          ? "large"
          : "small";
  return route === "application" ? "context" : route === "large" ? "model" : "small";
}
const preparation: SceneTransfer[] = [
  { from: "source", to: "source", kind: "document" },
  { from: "source", to: "chunks", kind: "split" },
  { from: "chunks", to: "vectors", kind: "encode" },
  { from: "vectors", to: "index", kind: "vector" },
];
export function scenePlan(tour: WalkthroughState) {
  const prep = tour.phase === "knowledge";
  const input = stageInput(tour);
  const result = stageOutput(tour)?.results[tour.stage];
  const applicationLookup = !prep && requestModel(tour) === "context";
  const generator = prep ? "model" : requestModel(tour);
  const cached = input.ctx.usage.answerHit || Boolean(stageOutput(tour)?.ctx.usage.answerHit);
  const routes: SceneTransfer[] = [
    { from: "question", to: "input", kind: "query" },
    { from: "input", to: "router", kind: "query" },
    { from: "router", to: input.config.answerCache ? "cache" : generator, kind: "query" },
    { from: "index", to: "retrieve", kind: "evidence" },
    { from: "retrieve", to: "context", kind: "evidence" },
    { from: "context", to: "tool", kind: "query" },
    { from: "context", to: "context", kind: "evidence" },
    { from: "context", to: applicationLookup ? "check" : generator, kind: "evidence" },
    { from: cached ? "cache" : generator, to: "check", kind: "draft" },
    { from: "index", to: "check", kind: "evidence" },
    { from: "check", to: "question", kind: "answer" },
  ];
  const transfer = prep ? preparation[tour.stage]! : routes[tour.stage]!;
  // Tool returns travel back into the context before sufficiency/generation.
  const toolReturn = !prep && tour.stage === 5 && tour.beat >= 2 && input.config.tool === "valid";
  const actual = toolReturn
    ? { from: "tool" as const, to: "context" as const, kind: "evidence" as const }
    : transfer;
  const skipped =
    !prep &&
    (result?.status === "skipped" ||
      (tour.stage === 5 && input.config.tool === "off") ||
      (tour.stage >= 3 && tour.stage <= 7 && input.ctx.usage.answerHit));
  const toolFailure =
    !prep &&
    tour.stage === 5 &&
    tour.beat >= 2 &&
    input.config.tool !== "off" &&
    input.config.tool !== "valid";
  const blocked = !prep && result?.status === "blocked";
  return {
    positions: prep ? PREPARATION_POSITIONS : REQUEST_POSITIONS,
    transfer: actual,
    active: skipped
      ? cached
        ? ("cache" as const)
        : actual.from
      : toolFailure
        ? ("tool" as const)
        : tour.beat === 0 || (blocked && tour.stage === 1)
          ? actual.from
          : actual.to,
    moving: tour.beat > 0 && !atOutput(tour) && !skipped && !blocked && !toolFailure,
    skipped,
    blocked,
    applicationLookup,
    generator,
    cached,
  };
}

/** The optional read completes its outward and return legs within one story stage. */
export function transferProgress(tour: WalkthroughState, progress: number) {
  if (tour.phase !== "request" || tour.stage !== 5 || stageInput(tour).config.tool === "off")
    return progress;
  return tour.beat < 2 || stageInput(tour).config.tool !== "valid"
    ? Math.min(1, progress * 2)
    : Math.max(0, (progress - 0.5) * 2);
}

/** Each operation continues the same transformation; scrolling can review it in reverse. */
export function sceneProgressRange(tour: WalkthroughState): [number, number] {
  if (tour.beat === 0) return [0, 0];
  if (atOutput(tour)) return [1, 1];
  const count = walkthroughStep(tour).work.length;
  return [(tour.beat - 1) / count, tour.beat / count];
}

/** Smooth, bounded travel with a small lift into the foreground. No hidden engine mutation. */
export function travelPoint(
  from: Point3,
  to: Point3,
  progress: number,
  via: Point3[] = [],
): Point3 {
  const t = Math.max(0, Math.min(1, progress));
  if (t === 0) return from;
  if (t === 1) return to;
  if (via.length) {
    const points = [from, ...via, to];
    const segment = Math.min(points.length - 2, Math.floor(t * (points.length - 1)));
    const u = t * (points.length - 1) - segment;
    const a = points[Math.max(0, segment - 1)]!;
    const b = points[segment]!;
    const c = points[segment + 1]!;
    const d = points[Math.min(points.length - 1, segment + 2)]!;
    return [0, 1, 2].map(
      (axis) =>
        0.5 *
        (2 * b[axis]! +
          (-a[axis]! + c[axis]!) * u +
          (2 * a[axis]! - 5 * b[axis]! + 4 * c[axis]! - d[axis]!) * u * u +
          (-a[axis]! + 3 * b[axis]! - 3 * c[axis]! + d[axis]!) * u * u * u),
    ) as Point3;
  }
  const eased = t * t * (3 - 2 * t);
  const lift = Math.sin(Math.PI * t);
  return [
    from[0] + (to[0] - from[0]) * eased,
    from[1] + (to[1] - from[1]) * eased + lift * 0.5,
    from[2] + (to[2] - from[2]) * eased + lift * 0.65,
  ];
}
