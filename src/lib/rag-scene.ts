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
  chunks: [-2.8, -1.1, 0.8],
  vectors: [-0.6, -0.45, 0.5],
  index: [-2.5, 2, -1.4],
  model: [3, 0.7, -0.5],
};
export const REQUEST_POSITIONS: Partial<Record<SceneNode, Point3>> = {
  question: [-8, 0, 0.4],
  input: [-6, 0, 0.4],
  router: [-4.1, 0, 0.4],
  cache: [-6.4, 2.25, -0.2],
  small: [-3.1, -2.25, 0.6],
  retrieve: [-2.5, 2.05, 0.4],
  index: [-2.35, 4.5, -1.8],
  context: [0.1, 2.3, 0.65],
  model: [1.7, 0, 0],
  tool: [4.4, 2.45, 0.15],
  check: [5.25, 0, 0.4],
  // The response returns to the same person who supplied the question.
  answer: [-8, 0, 0.4],
};

/** Shared bends keep lines, arrowheads, data packets, labels and focus on one route. */
const PATH_BENDS: Partial<Record<string, Point3[]>> = {
  "check:question": [
    [4.7, -2.9, 0.8],
    [0, -4, 1],
    [-5.8, -3.2, 0.8],
  ],
  "small:check": [
    [-1, -2.9, 0.8],
    [3.7, -2.2, 0.7],
  ],
  "cache:check": [
    [-3.6, 3.3, -0.6],
    [1.9, 3.8, -0.5],
    [4.9, 1.4, 0.4],
  ],
  "context:small": [
    [-1.6, 1.15, 1],
    [-2.2, -0.6, 1],
  ],
  "context:tool": [
    [1.6, 3.35, 0.9],
    [3.5, 3.3, 0.5],
  ],
  "tool:context": [
    [3.6, 1.8, 1],
    [1.5, 1.65, 1],
  ],
  "input:question": [[-7, -1.2, 0.8]],
};
const STRAIGHT_PATH: Point3[] = [];
export const flowWaypoints = (from: SceneNode, to: SceneNode) =>
  PATH_BENDS[`${from}:${to}`] ?? STRAIGHT_PATH;

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
  const toolReturn = !prep && tour.stage === 5 && tour.beat >= 2 && input.config.tool !== "off";
  const actual = toolReturn
    ? { from: "tool" as const, to: "context" as const, kind: "evidence" as const }
    : transfer;
  const skipped =
    !prep &&
    (result?.status === "skipped" ||
      (tour.stage === 5 && input.config.tool === "off") ||
      (tour.stage >= 3 && tour.stage <= 7 && input.ctx.usage.answerHit));
  const blocked = !prep && result?.status === "blocked";
  return {
    positions: prep ? PREPARATION_POSITIONS : REQUEST_POSITIONS,
    transfer: actual,
    active: tour.beat === 0 || blocked ? actual.from : actual.to,
    moving: tour.beat > 0 && !atOutput(tour) && !skipped && !blocked,
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
  return tour.beat < 2 ? Math.min(1, progress * 2) : Math.max(0, (progress - 0.5) * 2);
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
