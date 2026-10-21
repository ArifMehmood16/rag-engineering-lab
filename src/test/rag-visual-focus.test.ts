import { describe, expect, it } from "vitest";
import { APOLLO_RECORDS, DEFAULT_QUESTION } from "@/content/apollo";
import { initEngine } from "@/lib/apollo-engine";
import { buildStoryFrames, storyTour } from "@/lib/rag-scroll-story";
import { cameraPose, sceneRegion } from "@/lib/rag-camera";
import {
  FLOW_STYLES,
  REQUEST_CONNECTIONS,
  FAILURE_CONNECTIONS,
  REQUEST_NODE_NAMES,
  REQUEST_POSITIONS,
  NODE_RADIUS,
  flowRoute,
  nodeEmphasis,
  scenePlan,
  travelPoint,
} from "@/lib/rag-scene";

describe("readable routes and scene focus", () => {
  const frames = buildStoryFrames(initEngine(DEFAULT_QUESTION), APOLLO_RECORDS);
  it("keeps the route strokes outside unrelated entities", () => {
    for (const [from, to] of [...REQUEST_CONNECTIONS, ...FAILURE_CONNECTIONS]) {
      const route = flowRoute(REQUEST_POSITIONS, from, to);
      for (const [node, port] of [
        [from, route.from],
        [to, route.to],
      ] as const) {
        const center = REQUEST_POSITIONS[node]!;
        expect(
          Math.hypot(...port.map((v, axis) => v - center[axis]!)),
          `${from} → ${to}: port inside ${node}`,
        ).toBeGreaterThanOrEqual((NODE_RADIUS[node] ?? 0.5) * 0.95);
      }
      for (let i = 0; i <= 100; i++) {
        const p = travelPoint(route.from, route.to, i / 100, route.via);
        for (const node of Object.keys(REQUEST_NODE_NAMES) as (keyof typeof REQUEST_NODE_NAMES)[]) {
          if (node === from || node === to) continue;
          const center = REQUEST_POSITIONS[node]!;
          const distance = Math.hypot(p[0] - center[0], p[1] - center[1]);
          expect(distance, `${from} → ${to} crosses ${node} at ${i}%`).toBeGreaterThan(
            (NODE_RADIUS[node] ?? 0.5) * 0.8,
          );
        }
      }
    }
  });
  it("separates outward and return lanes and uses distinct colours", () => {
    const midpoint = (from: "router" | "cache" | "context" | "tool", to: typeof from) => {
      const route = flowRoute(REQUEST_POSITIONS, from, to);
      return travelPoint(route.from, route.to, 0.5, route.via);
    };
    expect(
      Math.abs(midpoint("context", "tool")[1] - midpoint("tool", "context")[1]),
    ).toBeGreaterThan(0.6);
    expect(
      Math.abs(midpoint("router", "cache")[1] - midpoint("cache", "router")[1]),
    ).toBeGreaterThan(0.5);
    expect(new Set(Object.values(FLOW_STYLES).map((s) => s.color)).size).toBe(7);
  });
  it("keeps rounded service rails inside their corridor without spline overshoot", () => {
    for (const [from, to] of REQUEST_CONNECTIONS) {
      const route = flowRoute(REQUEST_POSITIONS, from, to);
      const controls = [route.from, ...route.via, route.to];
      for (let i = 0; i <= 200; i++) {
        const p = travelPoint(route.from, route.to, i / 200, route.via);
        for (let axis = 0; axis < 3; axis++) {
          const values = controls.map((point) => point[axis]!);
          expect(p[axis]!).toBeGreaterThanOrEqual(Math.min(...values) - 0.001);
          expect(p[axis]!).toBeLessThanOrEqual(Math.max(...values) + 0.001);
        }
      }
    }
  });
  it("keeps the request spine aligned and the service row separate", () => {
    const spine = ["question", "input", "router", "retrieve", "context", "model", "check"] as const;
    expect(spine.map((node) => REQUEST_POSITIONS[node]![1])).toEqual(spine.map(() => 0));
    const xs = spine.map((node) => REQUEST_POSITIONS[node]![0]);
    expect(xs).toEqual([...xs].sort((a, b) => a - b));
    expect(REQUEST_POSITIONS.index![1]).toBe(REQUEST_POSITIONS.tool![1]);
  });
  it("dims standby models and skipped work while retaining the active participants", () => {
    const retrieval = scenePlan(storyTour("request", 3, 3, frames));
    expect(nodeEmphasis(retrieval, "index")).toBeGreaterThan(0.8);
    expect(nodeEmphasis(retrieval, "retrieve")).toBe(1);
    expect(nodeEmphasis(retrieval, "model")).toBeLessThan(0.3);
    expect(nodeEmphasis(retrieval, "model", true)).toBeGreaterThan(0.8);
    const noTool = scenePlan(storyTour("request", 5, 1, frames));
    expect(nodeEmphasis(noTool, "tool")).toBeLessThan(0.3);
  });
  it("fits the complete active route and changes zoom between input and output", () => {
    const input = storyTour("request", 5, 0, frames);
    const a = cameraPose(input),
      b = cameraPose({ ...input, beat: 3 });
    expect(a.span[0]).toBeGreaterThanOrEqual(b.span[0]);
    const all = cameraPose(input, true);
    expect(all.span[0]).toBeGreaterThan(a.span[0]);
    expect(all.span[1]).toBeGreaterThan(a.span[1]);
    expect(sceneRegion(1280, 720).x).toBeLessThan(400);
    expect(sceneRegion(360, 860).y).toBeLessThan(860 * 0.45);
  });
});
