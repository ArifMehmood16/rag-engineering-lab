import { describe, expect, it } from "vitest";
import { runEvaluation } from "@/lib/evaluation";

const metric = (f: Parameters<typeof runEvaluation>[0], key: string) =>
  runEvaluation(f).metrics.find((m) => m.key === key)!;

describe("evaluation lab", () => {
  it("baseline is perfect on the fixture", () => {
    expect(metric([], "recall").ratio).toEqual({ num: 4, den: 4 });
    expect(runEvaluation([]).q1Outcome).toBe("supported");
  });
  it("missing one passage gives recall 3/4 = 0.75", () => {
    expect(metric(["retrievalMiss"], "recall").value).toBe(0.75);
  });
  it("bad citation lowers citation correctness but not unsupported claims", () => {
    expect(metric(["badCitation"], "citeCorrect").ratio).toEqual({ num: 3, den: 4 });
    expect(metric(["badCitation"], "unsupported").ratio?.num).toBe(0);
  });
  it("omitted citation lowers completeness", () => {
    expect(metric(["omitCitation"], "citeComplete").ratio).toEqual({ num: 3, den: 4 });
  });
  it("an outage is an infrastructure error, never a correct abstention", () => {
    const run = runEvaluation(["outage"]);
    expect(run.q2Outcome).toBe("infraError");
    expect(metric(["outage"], "correctAbst").ratio).toEqual({ num: 0, den: 0 });
    expect(metric(["outage"], "infra").ratio).toEqual({ num: 1, den: 2 });
  });
  it("refusing an answerable question is a false abstention", () => {
    expect(metric(["falseRefusal"], "falseAbst").ratio).toEqual({ num: 1, den: 1 });
  });
});
