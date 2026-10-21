import type { WalkthroughState } from "./rag-walkthrough";
import { atOutput } from "./rag-walkthrough";
import {
  flowRoute,
  NODE_RADIUS,
  REQUEST_CONNECTIONS,
  scenePlan,
  type Point3,
  type SceneNode,
} from "./rag-scene";

export interface CameraPose {
  target: Point3;
  span: [width: number, height: number];
}

/** Frame the actual operation and its endpoints. Outputs tighten the shot; the next input opens it. */
export function cameraPose(tour: WalkthroughState, overview = false): CameraPose {
  const plan = scenePlan(tour);
  const points: Point3[] = [];
  const addNode = (node: SceneNode) => {
    const p = plan.positions[node];
    if (!p) return;
    const radius = NODE_RADIUS[node] ?? 0.5;
    points.push([p[0] - radius, p[1] - radius, 0], [p[0] + radius, p[1] + radius, 0]);
  };
  if (overview) {
    Object.keys(plan.positions).forEach((n) => addNode(n as SceneNode));
    const connections: [SceneNode, SceneNode][] =
      tour.phase === "request"
        ? REQUEST_CONNECTIONS
        : [
            ["source", "chunks"],
            ["chunks", "vectors"],
            ["vectors", "index"],
          ];
    connections.forEach(([from, to]) => points.push(...flowRoute(plan.positions, from, to).via));
  } else {
    addNode(plan.transfer.from);
    addNode(plan.transfer.to);
    points.push(...flowRoute(plan.positions, plan.transfer.from, plan.transfer.to).via);
    if (tour.phase === "knowledge" && tour.stage === 0) addNode("chunks");
  }
  const xs = points.map((p) => p[0]),
    ys = points.map((p) => p[1]);
  const left = Math.min(...xs),
    right = Math.max(...xs),
    top = Math.max(...ys),
    bottom = Math.min(...ys);
  const padding = overview ? 2 : tour.beat === 0 ? 2.4 : atOutput(tour) ? 1.3 : 1.8;
  // Leave neighbouring stations in view on the request spine. A short handoff
  // should not magnify the entire background map or its arrowheads.
  const requestFocus = tour.phase === "request" && !overview;
  const output = atOutput(tour) && !overview;
  const minimum = requestFocus ? (output ? [8, 5.6] : [9, 6.2]) : output ? [5.5, 4] : [6.2, 4.6];
  return {
    target: [(left + right) / 2, (top + bottom) / 2, 0],
    span: [
      Math.max(minimum[0]!, right - left + padding),
      Math.max(minimum[1]!, top - bottom + padding),
    ],
  };
}

/** The camera uses the space beside/above the reader, never the area hidden by its cards. */
export function sceneRegion(width: number, height: number, request = false) {
  const wide = width >= 1000;
  const reader = width <= 1100 ? 390 : width < 1200 ? 440 : 480;
  const left = wide ? 30 : 18;
  const right = wide ? width - reader - 45 : width - 18;
  const top = wide ? 166 : request ? 246 : 202;
  const bottom = wide ? height - (request ? 300 : width < 1200 ? 230 : 210) : height * 0.48 - 18;
  return {
    width: Math.max(140, right - left),
    height: Math.max(85, bottom - top),
    x: (left + right) / 2,
    y: (top + bottom) / 2,
  };
}
