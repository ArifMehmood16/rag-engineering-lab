import { describe, expect, it } from "vitest";
import { buildPrompt, evaluateAnswerReuse, reusablePrefixLength, routeRequest } from "@/lib/caching";

describe("prompt prefix", () => {
  it("timestamp after the prefix keeps four stable segments reusable", () => {
    expect(reusablePrefixLength(buildPrompt({ timestampFirst: false, evidenceFirst: false }))).toBe(4);
  });
  it("timestamp first leaves nothing reusable", () => {
    expect(reusablePrefixLength(buildPrompt({ timestampFirst: true, evidenceFirst: false }))).toBe(0);
  });
});

describe("approved-answer reuse", () => {
  it("unchanged contract is reusable only after all checks pass", () => {
    const r = evaluateAnswerReuse([]);
    expect(r.reusable).toBe(true);
    expect(r.steps.map((s) => s.name)).toContain("Current source-eligibility recheck");
  });
  it("retraction blocks reuse even though the key matches", () => {
    const r = evaluateAnswerReuse(["retraction"]);
    expect(r.reusable).toBe(false);
    expect(r.steps.find((s) => s.name === "Versioned cache-key lookup")?.outcome).toBe("pass");
  });
  it("changing population is a miss", () => {
    expect(evaluateAnswerReuse(["population"]).reusable).toBe(false);
  });
});

describe("routing", () => {
  it("missing evidence produces a gap, never a larger model", () => {
    const r = routeRequest("compare", "missing", false);
    expect(r.path).toMatch(/evidence gap/i);
    expect(r.largerModelUsed).toBe(false);
  });
  it("unsupported question is always a gap", () => {
    expect(routeRequest("unsupported", "sufficient", true).outcome).toMatch(/gap/i);
  });
  it("metadata lookup uses no model", () => {
    expect(routeRequest("metadata", "sufficient", false).steps.some((s) => s.tone === "model")).toBe(false);
  });
});
