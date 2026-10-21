import { describe, expect, it } from "vitest";
import { BUDGET, PASSAGES, REQUIRED_QUALIFIERS, TOOLS, TOOL_CASES } from "@/content/lesson-agents";
import { evaluateContext, walkToolCall } from "@/lib/agents";

const run = (id: string) => walkToolCall(TOOL_CASES.find((c) => c.id === id)!, TOOLS);

describe("tool-call walkthrough", () => {
  it("valid call is answered and results are capped", () => {
    const w = run("ok");
    expect(w.outcome).toBe("answered");
    expect(w.steps.find((s) => s.key === "result")!.detail).toContain("2 trimmed to cap 5");
  });
  it("invalid arguments are rejected before execution", () => {
    const w = run("invalid");
    expect(w.outcome).toBe("rejected");
    expect(w.steps.find((s) => s.key === "execute")!.status).toBe("skipped");
  });
  it("unknown tool is rejected", () => expect(run("unknown").outcome).toBe("rejected"));
  it("missing scope is denied by code", () => expect(run("denied").outcome).toBe("denied"));
  it("timeout is an infrastructure failure, not a gap", () => expect(run("timeout").outcome).toBe("timed_out"));
  it("empty result becomes an evidence gap, not escalation", () => expect(run("empty").outcome).toBe("evidence_gap"));
});

describe("context budget", () => {
  const ev = (ids: string[]) => evaluateContext(PASSAGES, ids, BUDGET, REQUIRED_QUALIFIERS);
  it("flags duplicates and omitted contradiction", () => {
    const r = ev(["P1", "P2"]);
    expect(r.duplicates).toEqual(["P2"]);
    expect(r.contradictionIncluded).toBe(false);
    expect(r.verdict).toBe("weak");
  });
  it("selecting everything is over budget, not rewarded", () => {
    expect(ev(PASSAGES.map((p) => p.id)).verdict).toBe("invalid");
  });
  it("qualifiers plus conflict without duplicates is sound", () => {
    const r = ev(["P1", "P3", "P4"]);
    expect(r.used).toBe(660);
    expect(r.verdict).toBe("good");
  });
});
