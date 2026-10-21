import { describe, expect, it } from "vitest";
import { APOLLO_RECORDS } from "@/content/apollo";
import { buildLearningExamples } from "@/lib/rag-learning";
import { learningTheatre } from "@/lib/rag-theatre";

describe("3D teaching scenes use recorded results", () => {
  const data = buildLearningExamples(APOLLO_RECORDS);
  it("keeps a new generation on the prefix-hit path and bypasses it only for approved answers", () => {
    const cold = learningTheatre("efficiency", 0, data, APOLLO_RECORDS)!;
    const warm = learningTheatre("efficiency", 1, data, APOLLO_RECORDS)!;
    const answer = learningTheatre("efficiency", 2, data, APOLLO_RECORDS)!;
    expect(cold.prefixTokens).toBe(0);
    expect(warm.prefixTokens).toBe(160);
    expect(warm.calls).toBe(1);
    expect(answer.calls).toBe(0);
    expect(answer.mode).toBe("answer");
  });
  it("shows actual case outcomes, including the no-generation unanswerable case", () => {
    const batch = learningTheatre("evaluation", 0, data, APOLLO_RECORDS)!;
    expect(batch.cases.map((q) => q.pass)).toEqual([true, true, true]);
    expect(batch.cases[2]).toMatchObject({ expected: "Evidence gap", calls: 0 });
    expect(batch.results[0]?.value).toBe("3/3");
  });
  it("keeps missing-evidence and unsupported-generation failures visually distinct", () => {
    const retrieval = learningTheatre("evaluation", 1, data, APOLLO_RECORDS)!;
    const generation = learningTheatre("evaluation", 2, data, APOLLO_RECORDS)!;
    expect(retrieval.calls).toBe(0);
    expect(retrieval.factsFound).toBeLessThan(retrieval.factsRequired);
    expect(generation.factsFound).toBe(generation.factsRequired);
    expect(generation.supported).toBeLessThan(generation.claims);
    const judge = learningTheatre("evaluation", 3, data, APOLLO_RECORDS)!;
    expect(judge.results.map((r) => r.value)).toEqual(["FAIL", "PASS", "FAIL"]);
  });
});
