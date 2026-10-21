import { describe, expect, it } from "vitest";
import { APOLLO_RECORDS, DEFAULT_QUESTION } from "@/content/apollo";
import { initEngine } from "@/lib/apollo-engine";
import { createWalkthrough, finishRequest, outputBeat } from "@/lib/rag-walkthrough";
import {
  scenePlan,
  sceneProgressRange,
  travelPoint,
  flowWaypoints,
  REQUEST_POSITIONS,
  transferProgress,
} from "@/lib/rag-scene";
import { buildStoryFrames, storyTour } from "@/lib/rag-scroll-story";

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
  it("continues a transformation across substeps instead of restarting its journey", () => {
    const tour = { ...createWalkthrough(initEngine(DEFAULT_QUESTION)), stage: 1 };
    expect(sceneProgressRange(tour)).toEqual([0, 0]);
    let previous = 0;
    for (let beat = 1; beat < outputBeat(tour); beat++) {
      const [from, to] = sceneProgressRange({ ...tour, beat });
      expect(from).toBe(previous);
      expect(to).toBeGreaterThan(from);
      previous = to;
    }
    expect(previous).toBe(1);
    expect(sceneProgressRange({ ...tour, beat: outputBeat(tour) })).toEqual([1, 1]);
  });
  it("never animates a tool execution when the configured workflow has no tool", () => {
    const tour = finishRequest(
      createWalkthrough(initEngine(DEFAULT_QUESTION), true),
      APOLLO_RECORDS,
    );
    const tool = { ...tour, stage: 5, beat: 1 };
    expect(scenePlan(tool).skipped).toBe(true);
    expect(scenePlan(tool).moving).toBe(false);
    const lookupFrame = {
      ...tour.frames[7]!,
      ctx: { ...tour.frames[7]!.ctx, route: "application" as const },
    };
    const lookup = {
      ...tour,
      stage: 7,
      beat: 1,
      frames: tour.frames.map((f, i) => (i === 7 ? lookupFrame : f)),
    };
    expect(scenePlan(lookup).transfer.to).toBe("check");
    expect(scenePlan(lookup).applicationLookup).toBe(true);
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
  it("places checks before routing and routes generation to the selected model", () => {
    const frames = buildStoryFrames(initEngine(DEFAULT_QUESTION), APOLLO_RECORDS);
    expect(scenePlan(storyTour("request", 0, 1, frames)).transfer.to).toBe("input");
    expect(scenePlan(storyTour("request", 1, 1, frames)).transfer).toMatchObject({
      from: "input",
      to: "router",
    });
    expect(scenePlan(storyTour("request", 2, 1, frames)).transfer.to).toBe("small");
    expect(scenePlan(storyTour("request", 7, 1, frames)).transfer.to).toBe("small");
    expect(scenePlan(storyTour("request", 8, 1, frames)).transfer.from).toBe("small");
    const large = buildStoryFrames(
      initEngine(DEFAULT_QUESTION, { profile: "large" }),
      APOLLO_RECORDS,
    );
    expect(scenePlan(storyTour("request", 7, 1, large)).transfer.to).toBe("model");
  });
  it("returns the checked response to the same user along a curved lower route", () => {
    const frames = buildStoryFrames(initEngine(DEFAULT_QUESTION), APOLLO_RECORDS);
    const plan = scenePlan(storyTour("request", 10, 1, frames));
    expect(plan.transfer).toMatchObject({ from: "check", to: "question", kind: "answer" });
    const start = REQUEST_POSITIONS.check!;
    const end = REQUEST_POSITIONS.question!;
    const via = flowWaypoints("check", "question");
    expect(travelPoint(start, end, 0, via)).toEqual(start);
    expect(travelPoint(start, end, 1, via)).toEqual(end);
    expect(travelPoint(start, end, 0.5, via)[1]).toBeLessThan(-3);
    const distance = (a: number[], b: number[]) => Math.hypot(...a.map((v, i) => v - b[i]!));
    expect(distance(REQUEST_POSITIONS.cache!, end)).toBeLessThan(3);
    expect(distance(REQUEST_POSITIONS.small!, REQUEST_POSITIONS.router!)).toBeLessThan(3);
    expect(distance(REQUEST_POSITIONS.tool!, REQUEST_POSITIONS.model!)).toBeLessThan(4);
  });
  it("returns bounded tool data to context without making the tool an autonomous model action", () => {
    const frames = buildStoryFrames(
      initEngine(DEFAULT_QUESTION, { tool: "valid" }),
      APOLLO_RECORDS,
    );
    const outward = storyTour("request", 5, 1, frames);
    const inward = storyTour("request", 5, 2, frames);
    expect(scenePlan(outward).transfer).toMatchObject({ from: "context", to: "tool" });
    expect(scenePlan(inward).transfer).toMatchObject({ from: "tool", to: "context" });
    expect(transferProgress(outward, 0.5)).toBe(1);
    expect(transferProgress(inward, 0.5)).toBe(0);
    expect(transferProgress(inward, 1)).toBe(1);
  });
  it("takes reused answers through output checks while generation stays bypassed", () => {
    const cold = buildStoryFrames(
      initEngine(DEFAULT_QUESTION, { answerCache: true }),
      APOLLO_RECORDS,
    );
    const last = cold.at(-1)!;
    const warm = buildStoryFrames(
      initEngine(DEFAULT_QUESTION, last.config, last.memory),
      APOLLO_RECORDS,
    );
    expect(scenePlan(storyTour("request", 2, 1, warm)).transfer.to).toBe("cache");
    expect(scenePlan(storyTour("request", 7, 1, warm)).moving).toBe(false);
    expect(scenePlan(storyTour("request", 8, 1, warm)).transfer.from).toBe("cache");
    expect(scenePlan(storyTour("request", 10, 1, warm)).transfer.to).toBe("question");
  });
});
