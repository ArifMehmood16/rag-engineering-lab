import { describe, expect, it } from "vitest";
import { SCENARIOS } from "@/content/lesson-guardrails";
import { evaluateScenario } from "@/lib/guardrails";

const get = (id: string) =>
  evaluateScenario(
    SCENARIOS.find((s) => s.id === id)!,
    false,
  );
const result = (id: string, c: string) => get(id).rows.find((r) => r.control.id === c)!.result;

describe("trust-boundary lab", () => {
  it("every scenario is stopped or contained by at least one application control", () => {
    for (const s of SCENARIOS)
      expect(evaluateScenario(s, false).stoppedBy.length).toBeGreaterThan(0);
  });
  it("schema-valid unsupported output passes schema and is caught by claim verification", () => {
    expect(result("schemaValid", "schema")).toBe("passed");
    expect(result("schemaValid", "claimVerification")).toBe("caught");
  });
  it("supported text with unauthorized evidence is caught by authorization, not verification", () => {
    expect(result("unauthorized", "claimVerification")).toBe("passed");
    expect(result("unauthorized", "authorization")).toBe("caught");
  });
  it("a missed detection does not change the outcome", () => {
    const s = SCENARIOS.find((x) => x.id === "toolInstruction")!;
    expect(evaluateScenario(s, true).detector.flagged).toBe(false);
    expect(evaluateScenario(s, true).stoppedBy).toEqual(evaluateScenario(s, false).stoppedBy);
  });
  it("stale cache hit is rejected by the eligibility recheck", () => {
    expect(result("staleCache", "eligibility")).toBe("caught");
  });
});
