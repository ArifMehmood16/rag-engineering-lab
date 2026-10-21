import type { ExperimentId } from "@/content/rag-lab";
import type { EvidenceRecord } from "@/content/apollo";
import { evaluationRow, ratioLabel, type LearningExamples } from "./rag-learning";

export type TheatreMode =
  "cold" | "warm" | "answer" | "compare" | "batch" | "retrieval" | "generation" | "judge";
export interface TheatreResult {
  label: string;
  value: string;
}
export interface TheatreCase {
  id: string;
  label: string;
  expected: string;
  pass: boolean;
  calls: number;
}
export interface LearningTheatre {
  kind: "prefix" | "evaluation";
  mode: TheatreMode;
  page: number;
  title: string;
  action: string;
  takeaway: string;
  results: TheatreResult[];
  calls: number;
  prefixTokens: number;
  factsFound: number;
  factsRequired: number;
  supported: number;
  claims: number;
  cases: TheatreCase[];
  lanes: {
    name: string;
    mode: "cold" | "warm" | "answer";
    reused: number;
    calls: number;
    work: number;
  }[];
}

/** Geometry and result receipts use the same recorded fixtures, with no new request execution. */
export function learningTheatre(
  concept: ExperimentId,
  page: number,
  data: LearningExamples,
  records: EvidenceRecord[],
): LearningTheatre | null {
  if (concept !== "efficiency" && concept !== "evaluation") return null;
  const prefix = concept === "efficiency";
  const mode = (
    prefix ? ["cold", "warm", "answer", "compare"] : ["batch", "retrieval", "generation", "judge"]
  )[page] as TheatreMode;
  const run = prefix
    ? page === 0
      ? data.cold
      : page === 2
        ? data.approved
        : data.warm
    : page === 1
      ? data.missing
      : page >= 2
        ? data.wrong
        : data.baseline;
  const scores = evaluationRow(run, records);
  const titles = prefix
    ? [
        "Process a cold prefix",
        "Reuse prefix state; generate again",
        "Reuse an answer; bypass the LLM",
        "Compare the three paths",
      ]
    : [
        "Run the reviewed test set",
        "Locate a retrieval failure",
        "Isolate a generation failure",
        "Score a claim against evidence",
      ];
  const actions = prefix
    ? [
        "Three fixed segments pass through prefill and enter model-side prefix state.",
        "The amber segments stay cached. Only new question and evidence data enter processing.",
        "The application cache sends approved claims around the idle LLM and through release checks.",
        "Same question and profile: watch which processing each recorded path skips.",
      ]
    : [
        "Q1 and Q2 generate answers. Q3 bypasses generation and correctly returns an evidence gap.",
        "One required fact is absent. Generation stays idle; the answerable test case fails.",
        "All three facts arrive unchanged. One generated claim is unsupported and fails scoring.",
        "Compare the claim with its source. A resolving citation can still fail support.",
      ];
  const result = (label: string, value: string | number): TheatreResult => ({
    label,
    value: String(value),
  });
  let results: TheatreResult[];
  if (prefix)
    results =
      mode === "compare"
        ? [
            result("Cold model work", data.cold.ctx.usage.workUnits),
            result("Warm model work", data.warm.ctx.usage.workUnits),
            result("Answer-hit model calls", data.approved.ctx.usage.generationCalls),
          ]
        : [
            result("Prefix tokens reused · assumed", run.ctx.usage.cachedPrefixTokens),
            result("New generation calls", run.ctx.usage.generationCalls),
            result("Search calls", run.ctx.usage.retrievalCalls),
          ];
  else if (mode === "batch")
    results = [
      result(
        "Cases with expected outcome",
        `${data.testSet.filter((q) => q.pass).length}/${data.testSet.length}`,
      ),
      result("Reviewed presets", data.testSet.length),
      result("Live provider calls", 0),
    ];
  else if (mode === "judge")
    results = [
      result("Claim support", data.wrong.ctx.checks[0]?.supported ? "PASS" : "FAIL"),
      result("Citation ID resolves", data.wrong.ctx.checks[0]?.resolves ? "PASS" : "FAIL"),
      result(
        "All facts correct",
        data.wrong.ctx.checks.every((c) => c.supported && c.resolves) ? "PASS" : "FAIL",
      ),
    ];
  else
    results = [
      result("Retrieved facts", ratioLabel(scores.retrieval)),
      result("Citation support", ratioLabel(scores.citations)),
      result("Released facts", ratioLabel(scores.coverage)),
    ];
  return {
    kind: prefix ? "prefix" : "evaluation",
    mode,
    page,
    title: titles[page]!,
    action: actions[page]!,
    takeaway: prefix
      ? mode === "answer"
        ? "An answer hit avoids generation; current release checks still run."
        : "Prompt caching reuses prefix processing. It still generates a new answer."
      : mode === "batch"
        ? "A correct evidence gap passes an unanswerable test case."
        : "Retrieval quality, answer quality, and final task success are separate measurements.",
    results,
    calls: run.ctx.usage.generationCalls,
    prefixTokens: run.ctx.usage.cachedPrefixTokens,
    factsFound: scores.retrieval.num,
    factsRequired: scores.retrieval.den,
    supported: run.ctx.checks.filter((c) => c.supported && c.resolves).length,
    claims: run.ctx.claims.length,
    cases: data.testSet.map((q, i) => ({
      id: `Q${i + 1}`,
      label: ["Crew roles", "Paraphrase", "Outside corpus"][i]!,
      expected: q.expected,
      pass: q.pass,
      calls: q.run.ctx.usage.generationCalls,
    })),
    lanes: [
      ["Cold prefix", "cold", data.cold],
      ["Warm prefix", "warm", data.warm],
      ["Approved answer", "answer", data.approved],
    ].map(([name, laneMode, value]) => {
      const run = value as typeof data.cold;
      return {
        name: name as string,
        mode: laneMode as "cold" | "warm" | "answer",
        reused: run.ctx.usage.cachedPrefixTokens,
        calls: run.ctx.usage.generationCalls,
        work: run.ctx.usage.workUnits,
      };
    }),
  };
}
