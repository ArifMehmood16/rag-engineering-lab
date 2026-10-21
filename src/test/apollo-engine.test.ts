import { describe, expect, it } from "vitest";
import { APOLLO_RECORDS, DEFAULT_QUESTION } from "@/content/apollo";
import { advance, ENGINE_STAGES, initEngine, runAll } from "@/lib/apollo-engine";

describe("Apollo 11 engine", () => {
  const s = runAll(DEFAULT_QUESTION, APOLLO_RECORDS);
  it("completes every stage and releases a supported answer", () => {
    expect(s.cursor).toBe(ENGINE_STAGES.length - 1);
    expect(s.results.every((r) => r.status === "done")).toBe(true);
    expect(s.ctx.released?.answer).toContain("Neil Armstrong and Buzz Aldrin");
    expect(s.ctx.released?.answer).toContain("Michael Collins remained in lunar orbit aboard the command and service module Columbia");
  });
  it("every claim cites eligible source-backed records", () => {
    for (const c of s.ctx.released!.claims) {
      expect(c.cites.length).toBeGreaterThan(0);
      for (const id of c.cites) {
        const r = APOLLO_RECORDS.find((x) => x.id === id)!;
        expect(r.kind).toBe("source");
        expect(r.source.url).toMatch(/^https:\/\/(www|science)\.nasa\.gov\//);
      }
    }
  });
  it("excludes the adversarial, distractor, and duplicate fixtures", () => {
    const ex = s.ctx.excluded.map((e) => e.id);
    expect(ex).toEqual(expect.arrayContaining(["SYN-ADV-01", "SYN-DISTRACT-01", "A11-LA-CAP-SHORT"]));
    expect(s.ctx.context).not.toContain("SYN-ADV-01");
  });
  it("is deterministic and advances one stage at a time", () => {
    expect(runAll(DEFAULT_QUESTION, APOLLO_RECORDS)).toEqual(s);
    expect(advance(initEngine(DEFAULT_QUESTION), APOLLO_RECORDS).cursor).toBe(0);
  });
});
