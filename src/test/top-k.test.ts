import { describe, expect, it } from "vitest";
import { runTopK } from "@/lib/topk";

describe("top-K lab", () => {
  it("K=3 original order at 220 packs H17-P2 + H17-P5 (200 tokens) and routes to review", () => {
    const r = runTopK({ k: 3, ordering: "original", budget: 220 });
    expect(r.packed).toEqual(["H17-P2", "H17-P5"]);
    expect(r.tokensUsed).toBe(200);
    expect(r.recall).toEqual([2, 2]);
    expect(r.coverage).toEqual([1, 2]);
    expect(r.decision).toEqual({ kind: "review", reasons: ["E3-P1 dropped in packing"] });
  });
  it("K=3 reranked at 220 packs E3-P1 + H17-P2 in 190 tokens and cites £750", () => {
    const r = runTopK({ k: 3, ordering: "reranked", budget: 220 });
    expect(r.packed).toEqual(["E3-P1", "H17-P2"]);
    expect(r.tokensUsed).toBe(190);
    expect(r.decision).toEqual({ kind: "cite", amount: 750, sources: ["H17-P2", "E3-P1"] });
  });
  it("K=2 reranked: E3 absent from candidates → review", () => {
    expect(runTopK({ k: 2, ordering: "reranked", budget: 220 }).decision).toEqual({
      kind: "review",
      reasons: ["E3-P1 absent from candidates"],
    });
  });
  it("K=4 reranked at 150: base dropped in packing → review", () => {
    const r = runTopK({ k: 4, ordering: "reranked", budget: 150 });
    expect(r.packed).toEqual(["E3-P1"]);
    expect(r.decision).toEqual({ kind: "review", reasons: ["H17-P2 dropped in packing"] });
  });
  it("recall and precision by K", () => {
    const got = [1, 2, 3, 4].map((k) => {
      const r = runTopK({ k, ordering: "original", budget: 220 });
      return [r.recall, r.precision];
    });
    expect(got).toEqual([
      [
        [1, 2],
        [1, 1],
      ],
      [
        [1, 2],
        [1, 2],
      ],
      [
        [2, 2],
        [2, 3],
      ],
      [
        [2, 2],
        [2, 4],
      ],
    ]);
  });
  it("budget 0 gives empty context with an explicit reason", () => {
    const r = runTopK({ k: 3, ordering: "reranked", budget: 0 });
    expect(r.packed).toEqual([]);
    expect(r.decision.kind === "review" && r.decision.reasons[0]).toMatch(/Empty context/);
  });
});
