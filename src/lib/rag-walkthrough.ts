import type { EvidenceRecord } from "@/content/apollo";
import {
  KNOWLEDGE_WALKTHROUGH,
  REQUEST_WALKTHROUGH,
  requestWalkthroughStep,
} from "@/content/rag-walkthrough";
import { advance, ENGINE_STAGES, initEngine, type EngineState } from "./apollo-engine";

export interface WalkthroughState {
  phase: "knowledge" | "request";
  stage: number;
  beat: number;
  preparedThrough: number;
  // Each frame is an actual engine snapshot; reviewing old steps must not show future context.
  frames: EngineState[];
}

export function createWalkthrough(engine: EngineState, prepared = false): WalkthroughState {
  return {
    phase: prepared ? "request" : "knowledge",
    stage: 0,
    beat: 0,
    preparedThrough: prepared ? 3 : -1,
    frames: [engine],
  };
}
export const walkthroughStep = (state: WalkthroughState) =>
  state.phase === "knowledge"
    ? KNOWLEDGE_WALKTHROUGH[state.stage]!
    : requestWalkthroughStep(state.stage, stageInput(state), stageOutput(state));
export const outputBeat = (state: WalkthroughState) => walkthroughStep(state).work.length + 1;
export const atOutput = (state: WalkthroughState) => state.beat === outputBeat(state);
export const latestEngine = (state: WalkthroughState) => state.frames[state.frames.length - 1]!;
export const stageInput = (state: WalkthroughState) =>
  state.frames[state.phase === "knowledge" ? 0 : state.stage]!;
export const stageOutput = (state: WalkthroughState) =>
  state.phase === "request" ? state.frames[state.stage + 1] : undefined;
export const requestFinished = (state: WalkthroughState) => {
  const engine = latestEngine(state);
  return engine.halted || engine.cursor === ENGINE_STAGES.length - 1;
};
export const walkthroughFinished = (state: WalkthroughState) =>
  state.phase === "request" &&
  atOutput(state) &&
  state.stage === latestEngine(state).cursor &&
  requestFinished(state);

export function nextWalkthrough(
  state: WalkthroughState,
  records: EvidenceRecord[],
): WalkthroughState {
  if (walkthroughFinished(state)) return state;
  if (!atOutput(state)) {
    const next = { ...state, beat: state.beat + 1 };
    if (atOutput(next)) {
      if (next.phase === "knowledge")
        next.preparedThrough = Math.max(next.preparedThrough, next.stage);
      else if (!next.frames[next.stage + 1])
        next.frames = [...next.frames, advance(stageInput(next), records)];
    }
    return next;
  }
  if (state.phase === "knowledge" && state.stage === 3)
    return { ...state, phase: "request", stage: 0, beat: 0 };
  return { ...state, stage: state.stage + 1, beat: 0 };
}

export function selectWalkthroughStage(
  state: WalkthroughState,
  phase: WalkthroughState["phase"],
  stage: number,
): WalkthroughState {
  const limit =
    phase === "knowledge"
      ? Math.min(state.preparedThrough + 1, 3)
      : Math.min(latestEngine(state).cursor + 1, 10);
  if (stage < 0 || stage > limit || (phase === "request" && state.preparedThrough < 3))
    return state;
  // A halted run has no next executable stage.
  if (phase === "request" && requestFinished(state) && stage > latestEngine(state).cursor)
    return state;
  const next = { ...state, phase, stage, beat: 0 };
  const done =
    phase === "knowledge" ? stage <= state.preparedThrough : Boolean(state.frames[stage + 1]);
  return done ? { ...next, beat: outputBeat(next) } : next;
}

export function usePreparedIndex(state: WalkthroughState): WalkthroughState {
  return { ...state, preparedThrough: 3, phase: "request", stage: 0, beat: 0 };
}

export function finishRequest(
  state: WalkthroughState,
  records: EvidenceRecord[],
): WalkthroughState {
  let next = state;
  if (requestFinished(next)) {
    const last = latestEngine(next);
    next = createWalkthrough(initEngine(last.ctx.question, last.config, last.memory), true);
  }
  const frames = [...next.frames];
  let engine = frames[frames.length - 1]!;
  while (!engine.halted && engine.cursor < ENGINE_STAGES.length - 1) {
    engine = advance(engine, records);
    frames.push(engine);
  }
  const finished = {
    ...next,
    preparedThrough: 3,
    phase: "request" as const,
    stage: engine.cursor,
    frames,
  };
  return { ...finished, beat: outputBeat(finished) };
}

export function repeatRequest(state: WalkthroughState): WalkthroughState {
  const last = latestEngine(state);
  return createWalkthrough(initEngine(last.ctx.question, last.config, last.memory), true);
}
