import type { EvidenceRecord } from "@/content/apollo";
import { KNOWLEDGE_WALKTHROUGH, REQUEST_WALKTHROUGH } from "@/content/rag-walkthrough";
import { advance, ENGINE_STAGES, initEngine, type EngineState } from "./apollo-engine";
import type { WalkthroughState } from "./rag-walkthrough";

export type StoryStream = WalkthroughState["phase"];

/** Precompute a deterministic replay once. Viewing it never executes another request. */
export function buildStoryFrames(seed: EngineState, records: EvidenceRecord[]) {
  const frames = [
    seed.cursor === -1
      ? structuredClone(seed)
      : initEngine(seed.ctx.question, seed.config, seed.memory),
  ];
  let current = frames[0]!;
  while (!current.halted && current.cursor < ENGINE_STAGES.length - 1) {
    current = advance(current, records);
    frames.push(current);
  }
  return frames;
}

export function storyTour(
  phase: StoryStream,
  stage: number,
  beat: number,
  frames: EngineState[],
): WalkthroughState {
  const work = (phase === "knowledge" ? KNOWLEDGE_WALKTHROUGH : REQUEST_WALKTHROUGH)[stage]!.work;
  // Reveal the current decision at its final operation. Earlier inputs still use the exact preceding snapshot.
  const end = phase === "knowledge" ? 1 : stage + (beat >= work.length ? 2 : 1);
  return {
    phase,
    stage,
    beat,
    preparedThrough: phase === "request" ? 3 : stage - 1,
    frames: frames.slice(0, end),
  };
}
