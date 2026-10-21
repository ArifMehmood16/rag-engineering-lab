import { describe, expect, it } from "vitest";
import { DEFAULT_QUESTION } from "@/content/apollo";
import { initEngine } from "@/lib/apollo-engine";
import { createWalkthrough, outputBeat } from "@/lib/rag-walkthrough";
import { scenePlan, travelPoint } from "@/lib/rag-scene";

describe("the visual data path", () => {
  it("shows preparation transformations before any model work", () => {
    const tour = createWalkthrough(initEngine(DEFAULT_QUESTION));
    const kinds = ["document", "split", "encode", "vector"];
    for (let stage = 0; stage < 4; stage++) {
      const state = { ...tour, stage, beat: 1 };
      const plan = scenePlan(state);
      expect(plan.transfer.kind).toBe(kinds[stage]);
      expect(plan.transfer.to).not.toBe("model");
      expect(plan.moving).toBe(true);
      expect(scenePlan({ ...state, beat: 0 }).moving).toBe(false);
      expect(scenePlan({ ...state, beat: outputBeat(state) }).moving).toBe(false);
    }
  });
  it("keeps moving objects on their connection and at the target after completion", () => {
    const from: [number, number, number] = [-4, 0, 0];
    const to: [number, number, number] = [2, 1, 0];
    expect(travelPoint(from, to, -1)).toEqual(from);
    expect(travelPoint(from, to, 2)[0]).toBe(to[0]);
    expect(travelPoint(from, to, 0.5)[0]).toBe(-1);
    expect(travelPoint(from, to, 0.5)[2]).toBeGreaterThan(0);
    for (const t of [0, 0.25, 0.5, 0.75, 1]) {
      const [x, y, z] = travelPoint(from, to, t);
      expect([x, y, z].every(Number.isFinite)).toBe(true);
      expect(x).toBeGreaterThanOrEqual(from[0]);
      expect(x).toBeLessThanOrEqual(to[0]);
    }
  });
});
