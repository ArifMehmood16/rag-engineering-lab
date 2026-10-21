import { describe, expect, it } from "vitest";
import { APOLLO_RECORDS, DEFAULT_QUESTION } from "@/content/apollo";
import { initEngine } from "@/lib/apollo-engine";
import {
  atOutput,
  createWalkthrough,
  finishRequest,
  latestEngine,
  nextWalkthrough,
  outputBeat,
  selectWalkthroughStage,
  stageInput,
  stageOutput,
  usePreparedIndex,
  walkthroughFinished,
} from "@/lib/rag-walkthrough";

describe("guided RAG walkthrough", () => {
  it("prepares knowledge before a request and advances input, work, and output separately", () => {
    let state = createWalkthrough(initEngine(DEFAULT_QUESTION));
    expect(selectWalkthroughStage(state, "request", 0)).toBe(state);
    for (let stage = 0; stage < 4; stage++) {
      expect(state.phase).toBe("knowledge");
      expect(state.stage).toBe(stage);
      expect(state.beat).toBe(0);
      while (!atOutput(state)) state = nextWalkthrough(state, APOLLO_RECORDS);
      expect(state.preparedThrough).toBe(stage);
      expect(latestEngine(state).cursor).toBe(-1);
      state = nextWalkthrough(state, APOLLO_RECORDS);
    }
    expect(state.phase).toBe("request");
    expect(state.preparedThrough).toBe(3);
  });

  it("executes once at output and retains the exact earlier input during review", () => {
    let state = usePreparedIndex(createWalkthrough(initEngine(DEFAULT_QUESTION)));
    while (!walkthroughFinished(state)) state = nextWalkthrough(state, APOLLO_RECORDS);
    expect(latestEngine(state).ctx.released).toBeDefined();
    const reviewed = selectWalkthroughStage(state, "request", 3);
    expect(stageInput(reviewed).ctx.retrieved).toHaveLength(0);
    expect(stageOutput(reviewed)?.ctx.retrieved.length).toBeGreaterThan(0);
    const replay = { ...reviewed, beat: outputBeat(reviewed) - 1 };
    expect(nextWalkthrough(replay, APOLLO_RECORDS).frames).toBe(reviewed.frames);
    expect(latestEngine(reviewed).ctx.usage.generationCalls).toBe(1);
  });

  it("stops at a blocked output instead of advancing to a non-existent stage", () => {
    let state = createWalkthrough(initEngine(DEFAULT_QUESTION, { scope: "none" }), true);
    while (!walkthroughFinished(state)) state = nextWalkthrough(state, APOLLO_RECORDS);
    expect(latestEngine(state).halted).toBe(true);
    expect(nextWalkthrough(state, APOLLO_RECORDS)).toBe(state);
    expect(selectWalkthroughStage(state, "request", state.stage + 1)).toBe(state);
  });

  it("keeps intermediate snapshots on instant runs and reuses caches only on a new request", () => {
    const seed = createWalkthrough(initEngine(DEFAULT_QUESTION, { promptCache: true }), true);
    const cold = finishRequest(seed, APOLLO_RECORDS);
    expect(cold.frames).toHaveLength(12);
    expect(latestEngine(cold).ctx.usage.prefixHit).toBe(false);
    const warm = finishRequest(cold, APOLLO_RECORDS);
    expect(latestEngine(warm).ctx.usage.prefixHit).toBe(true);
    expect(latestEngine(warm).ctx.usage.generationCalls).toBe(1);
    expect(seed.frames).toHaveLength(1);
  });
});
