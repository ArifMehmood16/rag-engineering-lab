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
  source: [-5, 2.4, -2],
  index: [-3, 2.4, -1.4],
  question: [-5.7, -1, 0.8],
  router: [-3.9, -1, 0.7],
  retrieve: [-2.2, -0.7, 0.8],
  cache: [-0.5, 3, -0.4],
  context: [-0.5, 1, 1],
  tool: [1, -2, 0.2],
  model: [3, 0.7, -0.5],
  check: [5.6, -0.8, 0.6],
  answer: [5.6, -0.8, 0.6],
};
const preparation: SceneTransfer[] = [
  { from: "source", to: "source", kind: "document" },
  { from: "source", to: "chunks", kind: "split" },
  { from: "chunks", to: "vectors", kind: "encode" },
  { from: "vectors", to: "index", kind: "vector" },
];
const request: SceneTransfer[] = [
  { from: "question", to: "router", kind: "query" },
  { from: "question", to: "router", kind: "query" },
  { from: "router", to: "cache", kind: "query" },
  { from: "index", to: "retrieve", kind: "evidence" },
  { from: "retrieve", to: "context", kind: "evidence" },
  { from: "context", to: "tool", kind: "query" },
  { from: "context", to: "context", kind: "evidence" },
  { from: "context", to: "model", kind: "evidence" },
  { from: "model", to: "check", kind: "draft" },
  { from: "index", to: "check", kind: "evidence" },
  { from: "check", to: "answer", kind: "answer" },
];

export function scenePlan(tour: WalkthroughState) {
  const prep = tour.phase === "knowledge";
  const input = stageInput(tour);
  const applicationLookup = !prep && tour.stage === 7 && input.ctx.route === "application";
  const transfer: SceneTransfer = applicationLookup
    ? { from: "context", to: "check", kind: "draft" }
    : (prep ? preparation : request)[tour.stage]!;
  const result = stageOutput(tour)?.results[tour.stage];
  const skipped =
    !prep &&
    (result?.status === "skipped" ||
      (tour.stage === 5 && input.config.tool === "off") ||
      (tour.stage >= 3 && tour.stage <= 7 && input.ctx.usage.answerHit));
  const blocked = !prep && result?.status === "blocked";
  return {
    positions: prep ? PREPARATION_POSITIONS : REQUEST_POSITIONS,
    transfer,
    active: tour.beat === 0 ? transfer.from : transfer.to,
    moving: tour.beat > 0 && !atOutput(tour) && !skipped && !blocked,
    skipped,
    blocked,
    applicationLookup,
  };
}

/** Each click continues the same transformation; replay restarts only its current segment. */
export function sceneProgressRange(tour: WalkthroughState): [number, number] {
  if (tour.beat === 0) return [0, 0];
  if (atOutput(tour)) return [1, 1];
  const count = walkthroughStep(tour).work.length;
  return [(tour.beat - 1) / count, tour.beat / count];
}

/** Smooth, bounded travel with a small lift into the foreground. No hidden engine mutation. */
export function travelPoint(from: Point3, to: Point3, progress: number): Point3 {
  const t = Math.max(0, Math.min(1, progress));
  const eased = t * t * (3 - 2 * t);
  const lift = Math.sin(Math.PI * t);
  return [
    from[0] + (to[0] - from[0]) * eased,
    from[1] + (to[1] - from[1]) * eased + lift * 0.5,
    from[2] + (to[2] - from[2]) * eased + lift * 0.65,
  ];
}
