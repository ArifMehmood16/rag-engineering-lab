import { describe, expect, it } from "vitest";
import { APOLLO_RECORDS, DEFAULT_QUESTION } from "@/content/apollo";
import { initEngine } from "@/lib/apollo-engine";
import { buildStoryFrames, storyMoment, storyPosition, storyTour } from "@/lib/rag-scroll-story";
import { stageInput, stageOutput } from "@/lib/rag-walkthrough";

describe("scroll story replay", () => {
  const frames = buildStoryFrames(initEngine(DEFAULT_QUESTION), APOLLO_RECORDS);
  it("opens either stream independently and keeps future results out of earlier inputs", () => {
    const request = storyTour("request", 0, 0, frames);
    expect(request.preparedThrough).toBe(3);
    expect(stageInput(request).ctx.context).toEqual([]);
    expect(stageOutput(request)).toBeUndefined();
    const retrieval = storyTour("request", 3, 3, frames);
    expect(stageInput(retrieval).ctx.retrieved).toEqual([]);
    expect(stageOutput(retrieval)!.ctx.retrieved.length).toBeGreaterThan(0);
    expect(stageOutput(retrieval)!.ctx.claims).toEqual([]);
  });
  it("holds inputs and outputs for reading and reverses without rerunning the engine", () => {
    expect(storyMoment("knowledge", 1, 0.1)).toEqual({ beat: 0, transfer: 0 });
    expect(storyMoment("knowledge", 1, 0.35).beat).toBe(2);
    expect(storyMoment("knowledge", 1, 0.8)).toEqual({ beat: 4, transfer: 1 });
    const output = storyTour("request", 7, 3, frames);
    storyTour("request", 3, 0, frames);
    expect(storyTour("request", 7, 3, frames).frames.at(-1)).toBe(output.frames.at(-1));
    expect(frames.at(-1)!.ctx.usage.generationCalls).toBe(1);
  });
  it("clamps scroll positions and stops a failed request at its real stopping point", () => {
    expect(storyPosition(-30, 1000, 4)).toEqual({ stage: 0, progress: 0 });
    expect(storyPosition(3600, 1000, 4)).toEqual({ stage: 1, progress: 0.5 });
    expect(storyPosition(100000, 1000, 4).stage).toBe(3);
    const stopped = buildStoryFrames(initEngine(DEFAULT_QUESTION, { budget: 35 }), APOLLO_RECORDS);
    expect(stopped.at(-1)!.halted).toBe(true);
    expect(stopped.length).toBeLessThan(frames.length);
  });
});
