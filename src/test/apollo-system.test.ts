import { describe, expect, it } from "vitest";
import { APOLLO_RECORDS, APOLLO_QUESTIONS, DEFAULT_QUESTION } from "@/content/apollo";
import { advance, DEFAULT_CONFIG, ENGINE_STAGES, initEngine, runAll } from "@/lib/apollo-engine";
import { evaluateApolloRun } from "@/lib/apollo-evaluation";

describe("connected Apollo experiments", () => {
  it("does not invent an Apollo answer for an unsupported question", () => {
    const s = runAll(APOLLO_QUESTIONS.find((q) => q.id === "unknown")!.text, APOLLO_RECORDS);
    expect(s.ctx.outcome).toBe("evidence_gap");
    expect(s.ctx.released).toBeUndefined();
    expect(evaluateApolloRun(s, APOLLO_RECORDS).correctAbstention).toEqual({ num: 1, den: 1 });
  });

  it("reuses a prompt prefix while still generating and checking the second answer", () => {
    const config = { ...DEFAULT_CONFIG, promptCache: true, embeddingCache: true };
    const cold = runAll(DEFAULT_QUESTION, APOLLO_RECORDS, config);
    const warm = runAll(DEFAULT_QUESTION, APOLLO_RECORDS, config, cold.memory);
    expect(cold.ctx.usage.prefixHit).toBe(false);
    expect(warm.ctx.usage.prefixHit).toBe(true);
    expect(warm.ctx.usage.generationCalls).toBe(1);
    expect(warm.ctx.usage.embeddingHits).toBeGreaterThan(0);
    expect(warm.ctx.verified).toHaveLength(3);
    expect(warm.ctx.prompt?.evidence.map((r) => r.id)).toEqual(warm.ctx.context);
    expect(warm.ctx.prompt?.question).toBe(DEFAULT_QUESTION);
    expect(warm.ctx.outcome).toBe("supported");
  });

  it("a changing prefix prevents reuse without changing answer support", () => {
    const config = { ...DEFAULT_CONFIG, promptCache: true, timestampFirst: true };
    const cold = runAll(DEFAULT_QUESTION, APOLLO_RECORDS, config);
    const warm = runAll(DEFAULT_QUESTION, APOLLO_RECORDS, config, cold.memory);
    expect(warm.ctx.usage.prefixHit).toBe(false);
    expect(warm.ctx.outcome).toBe("supported");
  });

  it("reuses an approved answer but still performs release checks", () => {
    const config = { ...DEFAULT_CONFIG, answerCache: true };
    const first = runAll(DEFAULT_QUESTION, APOLLO_RECORDS, config);
    const hit = runAll(DEFAULT_QUESTION, APOLLO_RECORDS, config, first.memory);
    expect(hit.ctx.usage.answerHit).toBe(true);
    expect(hit.ctx.usage.generationCalls).toBe(0);
    expect(hit.results[ENGINE_STAGES.findIndex((x) => x.id === "eligibility")]?.status).toBe(
      "done",
    );
    expect(hit.ctx.outcome).toBe("supported");
    const revoked = runAll(
      DEFAULT_QUESTION,
      APOLLO_RECORDS,
      { ...config, fault: "revoke" },
      first.memory,
    );
    expect(revoked.ctx.released).toBeUndefined();
    expect(revoked.ctx.outcome).toBe("blocked");
  });

  it("changes scope and record version without reusing an incompatible approved answer", () => {
    const config = { ...DEFAULT_CONFIG, answerCache: true };
    const cold = runAll(DEFAULT_QUESTION, APOLLO_RECORDS, config);
    expect(
      runAll(DEFAULT_QUESTION, APOLLO_RECORDS, { ...config, scope: "none" }, cold.memory).ctx
        .released,
    ).toBeUndefined();
    const changed = APOLLO_RECORDS.map((r) => ({ ...r, version: `${r.version}-changed` }));
    expect(runAll(DEFAULT_QUESTION, changed, config, cold.memory).ctx.usage.answerHit).toBe(false);
  });

  it("context budgets change actual selected evidence and never overflow", () => {
    const low = runAll(DEFAULT_QUESTION, APOLLO_RECORDS, { ...DEFAULT_CONFIG, budget: 35 });
    const high = runAll(DEFAULT_QUESTION, APOLLO_RECORDS);
    expect(low.ctx.tokensUsed).toBeLessThanOrEqual(35);
    expect(low.ctx.context).not.toEqual(high.ctx.context);
    expect(low.ctx.missing.length).toBeGreaterThan(0);
  });

  it("unsupported and fabricated claims are withheld independently of the injection detector", () => {
    for (const fault of ["wrongRole", "badCitation", "omitCitation", "injection"] as const) {
      const s = runAll(DEFAULT_QUESTION, APOLLO_RECORDS, {
        ...DEFAULT_CONFIG,
        fault,
        injectionCheck: false,
      });
      expect(s.ctx.released).toBeUndefined();
      expect(s.ctx.outcome).toBe("blocked");
      expect(s.ctx.checks.some((c) => !c.supported || !c.resolves)).toBe(true);
    }
  });

  it("an outage is an infrastructure error, not correct abstention", () => {
    const s = runAll(DEFAULT_QUESTION, APOLLO_RECORDS, { ...DEFAULT_CONFIG, fault: "outage" });
    const metrics = evaluateApolloRun(s, APOLLO_RECORDS);
    expect(metrics.infrastructureErrors).toEqual({ num: 1, den: 1 });
    expect(metrics.correctAbstention.den).toBe(0);
    expect(s.ctx.released).toBeUndefined();
  });

  it("validates and bounds the local tool path and does not leak denied results", () => {
    for (const tool of ["valid", "invalid", "denied", "timeout", "empty"] as const) {
      const s = runAll(DEFAULT_QUESTION, APOLLO_RECORDS, { ...DEFAULT_CONFIG, tool });
      expect(s.ctx.toolEvents.length).toBeGreaterThan(0);
      if (tool === "valid") expect(s.ctx.outcome).toBe("supported");
      else expect(s.ctx.released).toBeUndefined();
      if (tool === "denied") expect(s.ctx.context).toHaveLength(0);
    }
  });

  it("supports metadata without pretending a generation call ran", () => {
    const q = APOLLO_QUESTIONS.find((x) => x.id === "metadata")!;
    const s = runAll(q.text, APOLLO_RECORDS);
    expect(s.ctx.route).toBe("application");
    expect(s.ctx.usage.generationCalls).toBe(0);
    expect(s.ctx.outcome).toBe("supported");
  });

  it("does not mutate inputs and catches revocation between verification and release", () => {
    const records = structuredClone(APOLLO_RECORDS);
    const before = structuredClone(records);
    let state = initEngine(DEFAULT_QUESTION);
    while (ENGINE_STAGES[state.cursor]?.id !== "verify") state = advance(state, records);
    expect(records).toEqual(before);
    const revoked = records.map((r) =>
      state.ctx.claims.some((c) => c.cites.includes(r.id))
        ? { ...r, eligibility: "superseded" as const }
        : r,
    );
    state = advance(state, revoked);
    expect(state.ctx.outcome).toBe("blocked");
    expect(state.ctx.released).toBeUndefined();
  });
});
