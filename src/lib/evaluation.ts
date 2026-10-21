// Deterministic evaluation lab for Lesson Three. Every number is computed from the synthetic fixture.

export type FailureKey =
  | "retrievalMiss"
  | "dropQualifier"
  | "inventNumber"
  | "badCitation"
  | "omitCitation"
  | "falseRefusal"
  | "outage";

export interface EvidenceUnit {
  id: string;
  summary: string;
  grade: number; // graded relevance label: 2 = essential, 1 = useful, 0 = not relevant
}

export interface Claim {
  id: string;
  keyPoint: string;
  text: string;
  cites: string[];
  /** Evidence IDs that actually support this claim's content. */
  supportedBy: string[];
  contentSupported: boolean;
  qualifierPreserved: boolean;
  issue?: string;
}

export const LABELLED: EvidenceUnit[] = [
  { id: "E1", summary: "SYN-STUDY-A: adults, glycinate, sleep score favoured treatment", grade: 2 },
  { id: "E2", summary: "SYN-STUDY-G: adults, glycinate, no meaningful difference", grade: 2 },
  { id: "E3", summary: "SYN-STUDY-E: adults, bisglycinate, modest improvement in rated rest", grade: 2 },
  { id: "E4", summary: "SYN-STUDY-A limitations: self-reported outcome, short follow-up", grade: 1 },
];
const DISTRACTORS: EvidenceUnit[] = [
  { id: "X1", summary: "SYN-STUDY-B: magnesium oxide (different formulation)", grade: 0 },
  { id: "X2", summary: "SYN-STUDY-C: adolescents (different population)", grade: 0 },
];
export const K = 5;

const BASE_CLAIMS: Claim[] = [
  { id: "C1", keyPoint: "K1", text: "In adults, magnesium glycinate was associated with better self-reported sleep scores than placebo.", cites: ["E1"], supportedBy: ["E1"], contentSupported: true, qualifierPreserved: true },
  { id: "C2", keyPoint: "K2", text: "A second adult trial found no meaningful difference in sleep quality.", cites: ["E2"], supportedBy: ["E2"], contentSupported: true, qualifierPreserved: true },
  { id: "C3", keyPoint: "K3", text: "A bisglycinate trial in adults reported a modest improvement in rated rest quality.", cites: ["E3"], supportedBy: ["E3"], contentSupported: true, qualifierPreserved: true },
  { id: "C4", keyPoint: "K4", text: "The positive trial relied on a self-reported outcome with short follow-up.", cites: ["E4"], supportedBy: ["E4"], contentSupported: true, qualifierPreserved: true },
];
export const KEY_POINTS = 4;

export type Outcome = "supported" | "defective" | "falseAbstention" | "correctAbstention" | "infraError";

export interface LabRun {
  retrieved: EvidenceUnit[];
  context: { id: string; note: string }[];
  claims: Claim[];
  q1Outcome: Outcome;
  q2Outcome: Outcome;
  metrics: Metric[];
}

export interface Ratio {
  num: number;
  den: number;
}

export interface Metric {
  key: string;
  name: string;
  stage: "Retrieval" | "Generation" | "End-to-end" | "Operations";
  ratio?: Ratio;
  value: number | null;
  denominatorNote: string;
  higherIsBetter: boolean;
}

export function dcg(grades: number[]): number {
  return grades.reduce((s, g, i) => s + (2 ** g - 1) / Math.log2(i + 2), 0);
}

export function ndcgAtK(retrievedGrades: number[], labelledGrades: number[], k = K): number {
  const ideal = dcg([...labelledGrades].sort((a, b) => b - a).slice(0, k));
  return ideal === 0 ? 0 : dcg(retrievedGrades.slice(0, k)) / ideal;
}

const r = (num: number, den: number): number | null => (den === 0 ? null : num / den);

export function runEvaluation(failures: FailureKey[]): LabRun {
  const on = (f: FailureKey) => failures.includes(f);
  const [E1, E2, E3, E4] = LABELLED as [EvidenceUnit, EvidenceUnit, EvidenceUnit, EvidenceUnit];
  const [X1, X2] = DISTRACTORS as [EvidenceUnit, EvidenceUnit];

  const retrieved = on("retrievalMiss") ? [E1, X1, E2, E4, X2] : [E1, X1, E2, E3, E4];
  const relevantRetrieved = retrieved.filter((e) => e.grade > 0);
  const context = relevantRetrieved.map((e) => ({
    id: e.id,
    note: e.id === "E1" && on("dropQualifier") ? "Population qualifier (adults) lost during context assembly" : "Qualifiers intact",
  }));

  let claims: Claim[] = [];
  const refused = on("falseRefusal");
  if (!refused) {
    claims = BASE_CLAIMS.map((c) => ({ ...c, cites: [...c.cites] }));
    if (on("retrievalMiss")) claims = claims.filter((c) => c.id !== "C3");
    const c1 = claims.find((c) => c.id === "C1")!;
    if (on("dropQualifier")) {
      c1.text = "Magnesium glycinate was associated with better self-reported sleep scores than placebo.";
      c1.qualifierPreserved = false;
      c1.contentSupported = false;
      c1.issue = "population_mismatch";
    }
    if (on("inventNumber")) {
      c1.text = c1.text.replace("better self-reported sleep scores", "sleep scores 23% better");
      c1.contentSupported = false;
      c1.issue = c1.issue ?? "unsupported_number";
    }
    const c2 = claims.find((c) => c.id === "C2")!;
    if (on("badCitation")) {
      c2.cites = ["E1"];
      c2.issue = "citation_does_not_support";
    }
    const c4 = claims.find((c) => c.id === "C4")!;
    if (on("omitCitation")) {
      c4.cites = [];
      c4.issue = "missing_citation";
    }
  }

  const q1Outcome: Outcome = refused
    ? "falseAbstention"
    : claims.every((c) => c.contentSupported && c.cites.some((id) => c.supportedBy.includes(id))) && claims.length === KEY_POINTS
      ? "supported"
      : "defective";
  const q2Outcome: Outcome = on("outage") ? "infraError" : "correctAbstention";

  // ---- metrics ----
  const citationPairs = claims.flatMap((c) => c.cites.map((id) => ({ ok: c.contentSupported && c.supportedBy.includes(id) })));
  const supportedCited = claims.filter((c) => c.contentSupported && c.cites.some((id) => c.supportedBy.includes(id))).length;
  const unsupported = claims.filter((c) => !c.contentSupported).length;
  const qualifierOk = claims.filter((c) => c.qualifierPreserved).length;
  const covered = new Set(claims.filter((c) => c.contentSupported).map((c) => c.keyPoint)).size;

  const scored = [q1Outcome, q2Outcome].filter((o) => o !== "infraError");
  const unanswerableScored = q2Outcome === "infraError" ? 0 : 1;
  const answerableScored = 1;
  const infra = [q1Outcome, q2Outcome].filter((o) => o === "infraError").length;
  void scored;

  const recall = { num: retrieved.filter((e) => LABELLED.some((l) => l.id === e.id)).length, den: LABELLED.length };
  const m = (key: string, name: string, stage: Metric["stage"], ratio: Ratio, denominatorNote: string, higherIsBetter = true): Metric => ({
    key,
    name,
    stage,
    ratio,
    value: r(ratio.num, ratio.den),
    denominatorNote,
    higherIsBetter,
  });

  const metrics: Metric[] = [
    m("recall", `Evidence Recall@${K}`, "Retrieval", recall, "labelled evidence units for Q1"),
    {
      key: "ndcg",
      name: `nDCG@${K}`,
      stage: "Retrieval",
      value: ndcgAtK(retrieved.map((e) => e.grade), LABELLED.map((e) => e.grade)),
      denominatorNote: "ideal ranking of labelled grades (2, 2, 2, 1)",
      higherIsBetter: true,
    },
    m("qualifier", "Qualifier preservation", "Generation", { num: qualifierOk, den: claims.length }, "generated claims"),
    m("citeCorrect", "Citation correctness", "Generation", { num: citationPairs.filter((p) => p.ok).length, den: citationPairs.length }, "citation links"),
    m("citeComplete", "Citation completeness", "Generation", { num: supportedCited, den: claims.length }, "generated claims"),
    m("unsupported", "Unsupported claim rate", "Generation", { num: unsupported, den: claims.length }, "generated claims", false),
    m("coverage", "Useful answer coverage", "End-to-end", { num: covered, den: KEY_POINTS }, "expected key points for Q1"),
    m("correctAbst", "Correct abstention", "End-to-end", { num: q2Outcome === "correctAbstention" ? 1 : 0, den: unanswerableScored }, "unanswerable questions without infrastructure error"),
    m("falseAbst", "False abstention", "End-to-end", { num: q1Outcome === "falseAbstention" ? 1 : 0, den: answerableScored }, "answerable questions without infrastructure error", false),
    m("infra", "Infrastructure error rate", "Operations", { num: infra, den: 2 }, "all questions attempted", false),
  ];

  return { retrieved, context, claims, q1Outcome, q2Outcome, metrics };
}

export interface JudgeOutput {
  claim_id: string;
  support: "supported" | "insufficient" | "unsupported";
  issues: string[];
  rationale: string;
}

const RATIONALES: Record<string, string> = {
  population_mismatch: "The claim drops the adult population that the cited passage is limited to.",
  unsupported_number: "The cited passage reports no percentage; the number is not in the evidence.",
  citation_does_not_support: "The cited passage reports a favourable result, but the claim describes no difference.",
  missing_citation: "The claim makes a factual statement with no citation.",
};

/** A synthetic, rule-based stand-in for a judge's structured output. Not a model call. */
export function judgeClaim(c: Claim): JudgeOutput {
  if (!c.issue) return { claim_id: c.id, support: "supported", issues: [], rationale: "The cited passage states this finding for the same population, formulation, and outcome." };
  return {
    claim_id: c.id,
    support: c.issue === "unsupported_number" ? "unsupported" : "insufficient",
    issues: [c.issue],
    rationale: RATIONALES[c.issue] ?? "",
  };
}
