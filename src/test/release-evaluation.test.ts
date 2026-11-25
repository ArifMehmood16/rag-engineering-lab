import { describe, expect, it } from "vitest";
import { latencyGainMs, passCount, pct, releaseGate } from "@/lib/release-evaluation";
describe("evaluation bench", () => {
  it("overall 47/50 vs 44/50", () => {
    expect(passCount("overall", "baseline")).toEqual([47, 50]);
    expect(passCount("overall", "candidate")).toEqual([44, 50]);
  });
  it("endorsement 9/10 vs 5/10 — a 40-point fall", () => {
    expect(passCount("endorsement", "baseline")).toEqual([9, 10]);
    expect(passCount("endorsement", "candidate")).toEqual([5, 10]);
    expect(pct([9, 10]) - pct([5, 10])).toBe(40);
  });
  it("candidate is 200 ms faster yet fails the 8/10 gate; baseline passes", () => {
    expect(latencyGainMs).toBe(200);
    expect(releaseGate("candidate").pass).toBe(false);
    expect(releaseGate("baseline").pass).toBe(true);
  });
});
