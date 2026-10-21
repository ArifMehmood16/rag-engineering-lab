import { describe, expect, it } from "vitest";
import { PASSAGES } from "@/content/lesson-context";
import { reciprocalRankFusion, runLab } from "@/lib/retrieval";

const base = { mode: "keyword" as const, dedupe: false, rerank: false, budget: 2400 };

describe("retrieval lab", () => {
  it("keyword search misses the paraphrased passage P7", () => {
    expect(runLab(PASSAGES, base).notRetrieved.map((p) => p.id)).toContain("P7");
  });

  it("hybrid retrieval surfaces P7", () => {
    const r = runLab(PASSAGES, { ...base, mode: "hybrid" });
    expect(r.candidates.map((c) => c.passage.id)).toContain("P7");
  });

  it("deduplication rejects the second report of study A", () => {
    const r = runLab(PASSAGES, { ...base, mode: "hybrid", dedupe: true });
    expect(r.candidates.find((c) => c.passage.id === "P2")?.decision.status).toBe("rejected");
  });

  it("never exceeds the token budget", () => {
    const r = runLab(PASSAGES, { ...base, mode: "hybrid", budget: 800 });
    expect(r.tokensUsed).toBeLessThanOrEqual(800);
  });

  it("RRF uses 1/(k+rank)", () => {
    expect(reciprocalRankFusion([["a"], ["a"]])[0][1]).toBeCloseTo(2 / 61);
    expect(() => reciprocalRankFusion([["a"]], 0)).toThrow();
  });
});
