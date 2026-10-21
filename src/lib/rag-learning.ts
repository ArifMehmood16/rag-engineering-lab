import { z } from "zod";
import { APOLLO_QUESTIONS, type EvidenceRecord } from "@/content/apollo";
import {
  initEngine,
  runAll,
  toyEmbedding,
  type ApolloConfig,
  type EngineState,
} from "./apollo-engine";
import { evaluateApolloRun, type Ratio } from "./apollo-evaluation";
import { buildStoryFrames, storyTour } from "./rag-scroll-story";
import { REQUEST_WALKTHROUGH } from "@/content/rag-walkthrough";
import { scenarioSeed } from "./rag-scenarios";
import type { ExperimentId } from "@/content/rag-lab";
import type { StoryCard } from "./rag-gallery";
import { LEARNING_PAGE_TITLES } from "@/content/rag-learning";

export const answerSchema = z
  .object({
    claims: z.array(z.object({ text: z.string(), cites: z.array(z.string()).min(1) })).min(1),
  })
  .strict();

const question = (id: string) => APOLLO_QUESTIONS.find((q) => q.id === id)!;
const result = (id: string, records: EvidenceRecord[], config: Partial<ApolloConfig> = {}) =>
  runAll(question(id).text, records, config);

/** Independent, controlled fixtures; never mutate the visitor's request or warm its caches. */
export function buildLearningExamples(records: EvidenceRecord[]) {
  const cold = result("crew", records, { promptCache: true });
  const warm = runAll(question("crew").text, records, { promptCache: true }, cold.memory);
  const changingCold = result("crew", records, { promptCache: true, timestampFirst: true });
  const changing = runAll(
    question("crew").text,
    records,
    { promptCache: true, timestampFirst: true },
    changingCold.memory,
  );
  const approved = buildStoryFrames(scenarioSeed("cache-hit", records), records).at(-1)!;
  const baseline = result("crew", records);
  const missing = result("crew", records, { fault: "retrievalMiss" });
  const wrong = result("crew", records, { fault: "wrongRole" });
  const testSet = ["crew", "paraphrase", "unknown"].map((id) => {
    const q = question(id),
      run = result(id, records);
    return {
      id: q.id,
      question: q.text,
      expected: q.answerable ? "Supported answer" : "Evidence gap",
      required: q.required,
      run,
      pass: q.answerable ? run.ctx.outcome === "supported" : run.ctx.outcome === "evidence_gap",
    };
  });
  const semantic = result("paraphrase", records, { mode: "semantic", rerank: false });
  const keyword = result("paraphrase", records, { mode: "keyword", rerank: false });
  const left = toyEmbedding("stayed"),
    right = toyEmbedding("remained");
  const synonymPair = {
    keywordOverlap: 0,
    toyCosine: left.reduce((sum, value, i) => sum + value * right[i]!, 0),
  };
  const tool = buildStoryFrames(scenarioSeed("tool-read", records), records).at(-1)!;
  const denied = buildStoryFrames(scenarioSeed("tool-denied", records), records).at(-1)!;
  const attack = buildStoryFrames(scenarioSeed("input-attack", records), records).at(-1)!;
  const budget = result("crew", records, { budget: 35 });
  const badCitation = result("crew", records, { fault: "badCitation" });
  const malformed = { claims: "This should be an array" };
  const schemaValidButWrong = {
    claims: [{ text: "Michael Collins walked on the Moon.", cites: ["A11-LA-CAP"] }],
  };
  return {
    cold,
    warm,
    changing,
    approved,
    baseline,
    missing,
    wrong,
    testSet,
    semantic,
    keyword,
    synonymPair,
    tool,
    denied,
    attack,
    budget,
    badCitation,
    malformed,
    schemaValidButWrong,
  };
}
export type LearningExamples = ReturnType<typeof buildLearningExamples>;
export const ratioLabel = (ratio: Ratio) => (ratio.den ? `${ratio.num}/${ratio.den}` : "N/A");
export function evaluationRow(run: EngineState, records: EvidenceRecord[]) {
  const scores = evaluateApolloRun(run, records);
  return {
    retrieval: scores.recall,
    citations: scores.citationCorrectness,
    coverage: scores.releasedCoverage,
    outcome: run.ctx.outcome,
  };
}

/** Learning views borrow exact snapshots. Offline evaluation never becomes a request operation. */
export function learningDeck(
  id: ExperimentId,
  examples: LearningExamples,
  records: EvidenceRecord[],
) {
  const outputBeat = (stage: number) => REQUEST_WALKTHROUGH[stage]!.work.length + 1;
  const spec: Record<ExperimentId, [EngineState, number, number][]> = {
    retrieval: [
      [examples.semantic, 3, 0],
      [examples.semantic, 3, outputBeat(3)],
      [examples.baseline, 4, outputBeat(4)],
    ],
    efficiency: [
      [examples.cold, 7, 1],
      [examples.warm, 7, 1],
      [examples.approved, 8, 0],
      [examples.warm, 10, outputBeat(10)],
    ],
    evaluation: Array.from(
      { length: 4 },
      () => [examples.baseline, 10, outputBeat(10)] as [EngineState, number, number],
    ),
    guardrails: [
      [examples.attack, 1, outputBeat(1)],
      [examples.baseline, 4, outputBeat(4)],
      [examples.badCitation, 8, outputBeat(8)],
      [examples.denied, 5, outputBeat(5)],
    ],
    tools: [
      [examples.baseline, 5, outputBeat(5)],
      [examples.tool, 5, 1],
      [examples.tool, 5, outputBeat(5)],
      [examples.baseline, 4, outputBeat(4)],
    ],
  };
  return spec[id].map(([run, stage, beat], i) => {
    // Reuse the initial memory of the warm request, never its final memory (which would start a third run).
    const seed = run.ctx.usage.answerHit
      ? scenarioSeed("cache-hit", records)
      : run.ctx.usage.prefixHit
        ? initEngine(run.ctx.question, run.config, examples.cold.memory)
        : initEngine(run.ctx.question, run.config);
    const chosen = buildStoryFrames(seed, records);
    const kind =
      beat === 0 ? "input" : beat > REQUEST_WALKTHROUGH[stage]!.work.length ? "output" : "work";
    const card: StoryCard = {
      id: `request:learn:${id}:${i}`,
      stage,
      beat,
      kind,
      title: LEARNING_PAGE_TITLES[id][i]!,
    };
    return {
      card,
      tour: storyTour("request", stage, beat, chosen),
      run,
      offline: id === "evaluation",
    };
  });
}
