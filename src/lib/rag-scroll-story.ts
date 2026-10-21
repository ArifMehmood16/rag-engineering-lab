import type { EvidenceRecord } from "@/content/apollo";
import { KNOWLEDGE_WALKTHROUGH, REQUEST_WALKTHROUGH } from "@/content/rag-walkthrough";
import { advance, ENGINE_STAGES, initEngine, type EngineState } from "./apollo-engine";
import type { WalkthroughState } from "./rag-walkthrough";

export type StoryStream = WalkthroughState["phase"];
export const CHAPTER_VIEWPORTS = 2.4;

/** Precompute a deterministic replay once. Viewing it never executes another request. */
export function buildStoryFrames(seed: EngineState, records: EvidenceRecord[]) {
  const frames = [initEngine(seed.ctx.question, seed.config, seed.memory)];
  let current = frames[0]!;
  while (!current.halted && current.cursor < ENGINE_STAGES.length - 1) {
    current = advance(current, records);
    frames.push(current);
  }
  return frames;
}

export function storyPosition(offset: number, viewport: number, count: number) {
  const chapterHeight = Math.max(1, viewport) * CHAPTER_VIEWPORTS;
  const position = Math.max(0, Math.min(count - 0.00001, offset / chapterHeight));
  return { stage: Math.floor(position), progress: position % 1 };
}

/** Input and output have reading plateaus; only the middle scroll interval moves data. */
export function storyMoment(phase: StoryStream, stage: number, progress: number) {
  const step = (phase === "knowledge" ? KNOWLEDGE_WALKTHROUGH : REQUEST_WALKTHROUGH)[stage]!;
  const p = Math.max(0, Math.min(1, progress));
  const transfer = Math.max(0, Math.min(1, (p - 0.16) / 0.48));
  const beat =
    p < 0.16
      ? 0
      : p >= 0.64
        ? step.work.length + 1
        : Math.min(step.work.length, Math.floor(transfer * step.work.length) + 1);
  return { beat, transfer };
}

export function storyTour(
  phase: StoryStream,
  stage: number,
  beat: number,
  frames: EngineState[],
): WalkthroughState {
  const work = (phase === "knowledge" ? KNOWLEDGE_WALKTHROUGH : REQUEST_WALKTHROUGH)[stage]!.work;
  // Never expose a later engine result as the input of an earlier stage.
  const end = phase === "knowledge" ? 1 : stage + (beat > work.length ? 2 : 1);
  return {
    phase,
    stage,
    beat,
    preparedThrough: phase === "request" ? 3 : stage - 1,
    frames: frames.slice(0, end),
  };
}
