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
  return {
    target: [(left + right) / 2, (top + bottom) / 2, 0],
    span: [
      Math.max(atOutput(tour) && !overview ? 5.5 : 6.2, right - left + padding),
      Math.max(atOutput(tour) && !overview ? 4 : 4.6, top - bottom + padding),
    ],
  };
}

/** The camera uses the space beside/above the reader, never the area hidden by its cards. */
export function sceneRegion(width: number, height: number) {
  const wide = width >= 1000;
  const reader = width <= 1100 ? 390 : width < 1200 ? 440 : 480;
  const left = wide ? 30 : 18;
  const right = wide ? width - reader - 45 : width - 18;
  const top = wide ? 166 : 190;
  const bottom = wide ? height - (width < 1200 ? 230 : 210) : height * 0.45 - 18;
  return {
    width: Math.max(140, right - left),
    height: Math.max(85, bottom - top),
    x: (left + right) / 2,
    y: (top + bottom) / 2,
  };
}
