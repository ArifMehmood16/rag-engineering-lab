import { atOutput, stageOutput, type WalkthroughState } from "./rag-walkthrough";

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
  source: [-4.6, 1.25, 0],
  chunks: [-2.6, 0.8, 0.5],
  vectors: [-0.45, 0.55, 0.15],
  index: [1.3, -1.45, 0.2],
  model: [3.1, 0.9, -0.6],
};
export const REQUEST_POSITIONS: Partial<Record<SceneNode, Point3>> = {
  source: [-4.6, 1.85, -0.9],
  index: [-2.5, 1.75, -0.3],
  question: [-4.8, -0.8, 0.5],
  router: [-3.2, -0.85, 0.4],
  retrieve: [-2, -0.7, 0.4],
  cache: [-0.3, 2.15, -0.5],
  context: [-0.15, -0.85, 0.3],
  tool: [0.1, -2.25, -0.1],
  model: [2.6, 0.75, -0.4],
  check: [4.7, -1.25, 0.4],
  answer: [4.7, -1.25, 0.4],
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
  const transfer = (prep ? preparation : request)[tour.stage]!;
  const result = stageOutput(tour)?.results[tour.stage];
  const skipped = !prep && result?.status === "skipped";
  const blocked = !prep && result?.status === "blocked";
  return {
    positions: prep ? PREPARATION_POSITIONS : REQUEST_POSITIONS,
    transfer,
    active: tour.beat === 0 ? transfer.from : transfer.to,
    moving: tour.beat > 0 && !atOutput(tour) && !skipped && !blocked,
    skipped,
    blocked,
  };
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
