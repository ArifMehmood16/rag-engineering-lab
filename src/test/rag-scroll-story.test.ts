import { describe, expect, it } from "vitest";
import { APOLLO_RECORDS, DEFAULT_QUESTION } from "@/content/apollo";
import { initEngine } from "@/lib/apollo-engine";
import { buildStoryFrames, storyTour } from "@/lib/rag-scroll-story";
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
  it("restores the exact snapshot when reversing without rerunning the engine", () => {
    const output = storyTour("request", 7, 3, frames);
    storyTour("request", 3, 0, frames);
    expect(storyTour("request", 7, 3, frames).frames.at(-1)).toBe(output.frames.at(-1));
    expect(frames.at(-1)!.ctx.usage.generationCalls).toBe(1);
  });
  it("stops a failed request at its real stopping point", () => {
    const stopped = buildStoryFrames(initEngine(DEFAULT_QUESTION, { budget: 35 }), APOLLO_RECORDS);
    expect(stopped.at(-1)!.halted).toBe(true);
    expect(stopped.length).toBeLessThan(frames.length);
  });
});
