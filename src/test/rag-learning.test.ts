import { describe, expect, it } from "vitest";
import { APOLLO_RECORDS } from "@/content/apollo";
import { answerSchema, buildLearningExamples, learningDeck } from "@/lib/rag-learning";
import { evaluateApolloRun } from "@/lib/apollo-evaluation";
import { LEARNING_LENSES } from "@/content/rag-learning";
import { stageInput, stageOutput } from "@/lib/rag-walkthrough";
import { buildStoryFrames } from "@/lib/rag-scroll-story";
import { scenarioSeed } from "@/lib/rag-scenarios";

describe("five controlled learning examples", () => {
  const data = buildLearningExamples(APOLLO_RECORDS);
  it("makes the synonym example explicit without claiming a learned embedding", () => {
    expect(data.synonymPair).toEqual({ keywordOverlap: 0, toyCosine: 1 });
  });
  it("distinguishes prefix reuse, prefix invalidation, and complete answer reuse", () => {
    expect(data.cold.ctx.usage.cachedPrefixTokens).toBe(0);
    expect(data.warm.ctx.usage.cachedPrefixTokens).toBe(160);
    expect(data.warm.ctx.usage.generationCalls).toBe(1);
    expect(data.warm.ctx.usage.retrievalCalls).toBe(1);
    expect(data.warm.ctx.usage.answerHit).toBe(false);
    expect(data.warm.ctx.released).toBeDefined();
    expect(data.changing.ctx.usage.cachedPrefixTokens).toBe(0);
    expect(data.approved.ctx.usage.generationCalls).toBe(0);
    expect(data.approved.ctx.usage.retrievalCalls).toBe(0);
    expect(data.warm.ctx.context).toEqual(data.cold.ctx.context);
    expect(data.warm.ctx.usage.workUnits).toBeLessThan(data.cold.ctx.usage.workUnits);
  });
  it("separates retrieval failure from generation failure with fixed evidence", () => {
    const baseline = evaluateApolloRun(data.baseline, APOLLO_RECORDS);
    const missing = evaluateApolloRun(data.missing, APOLLO_RECORDS);
    const wrong = evaluateApolloRun(data.wrong, APOLLO_RECORDS);
    expect(data.testSet).toHaveLength(3);
    expect(data.testSet.every((q) => q.pass)).toBe(true);
    expect(missing.recall.num).toBeLessThan(baseline.recall.num);
    expect(data.missing.ctx.usage.generationCalls).toBe(0);
    expect(data.wrong.ctx.context).toEqual(data.baseline.ctx.context);
    expect(wrong.recall).toEqual(baseline.recall);
    expect(wrong.citationCorrectness.num).toBeLessThan(baseline.citationCorrectness.num);
    expect(data.wrong.ctx.checks[0]?.resolves).toBe(true);
    expect(data.wrong.ctx.checks[0]?.supported).toBe(false);
    expect(data.wrong.ctx.released).toBeUndefined();
  });
  it("does not mistake a valid schema for a supported answer", () => {
    expect(answerSchema.safeParse(data.malformed).success).toBe(false);
    expect(answerSchema.safeParse(data.schemaValidButWrong).success).toBe(true);
    expect(data.wrong.ctx.checks[0]?.supported).toBe(false);
  });
  it("keeps learning replays isolated, cold and warm snapshots accurate, and evaluation offline", () => {
    const before = structuredClone(data);
    for (const lens of LEARNING_LENSES) {
      const deck = learningDeck(lens.id, data, APOLLO_RECORDS);
      expect(deck.length).toBeGreaterThanOrEqual(3);
      expect(deck.every((p) => p.offline === (lens.id === "evaluation"))).toBe(true);
      expect(deck.every((p) => stageInput(p.tour))).toBe(true);
      if (lens.id === "efficiency") {
        expect(stageInput(deck[0]!.tour).memory.prefixes).toHaveLength(0);
        expect(stageInput(deck[1]!.tour).memory.prefixes.length).toBeGreaterThan(0);
        expect(stageInput(deck[1]!.tour).memory.runs).toBe(data.warm.memory.runs);
        expect(stageInput(deck[2]!.tour).ctx.usage.answerHit).toBe(true);
      }
      if (lens.id === "guardrails") expect(stageOutput(deck[0]!.tour)?.halted).toBe(true);
    }
    expect(data).toEqual(before);
    const prefix = buildStoryFrames(scenarioSeed("prefix-hit", APOLLO_RECORDS), APOLLO_RECORDS).at(
      -1,
    )!;
    expect(prefix.ctx.usage.prefixHit).toBe(true);
    expect(prefix.ctx.usage.answerHit).toBe(false);
    expect(prefix.ctx.usage.generationCalls).toBe(1);
  });
});
