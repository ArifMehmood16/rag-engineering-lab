// Transparent toy retrieval used by the Lesson One lab.
// Deterministic and synthetic: no embedding model or EvidenceLens service runs.
import type { Passage } from "@/content/lesson-context";

export type RetrievalMode = "keyword" | "semantic" | "hybrid";

export interface LabSettings {
  mode: RetrievalMode;
  dedupe: boolean;
  rerank: boolean;
  budget: number; // token budget for context assembly
}

export const QUERY_TERMS = ["magnesium", "glycinate", "sleep", "adults"] as const;
export const CANDIDATES_PER_RETRIEVER = 6;
export const RRF_CONSTANT = 60;

export type Decision =
  { status: "selected"; reason: string } | { status: "rejected"; reason: string };

export interface RankedPassage {
  passage: Passage;
  rank: number;
  keywordScore: number;
  semanticScore: number;
  fusionScore: number | null;
  rerankScore: number | null;
  decision: Decision;
}

export interface LabResult {
  candidates: RankedPassage[];
  notRetrieved: Passage[];
  selected: RankedPassage[];
  tokensUsed: number;
  stageCounts: { retrieved: number; afterDedupe: number; selected: number };
  sufficiency: Sufficiency;
}

export interface Sufficiency {
  level: "sufficient" | "partial" | "gap";
  matchingStudies: string[];
  includesContradiction: boolean;
  notes: string[];
}

export function keywordScore(p: Passage): number {
  const text = p.text.toLowerCase();
  return QUERY_TERMS.reduce(
    (n, term) => n + (text.match(new RegExp(`\\b${term}\\b`, "g"))?.length ?? 0),
    0,
  );
}

function rankBy(passages: Passage[], score: (p: Passage) => number): string[] {
  return passages
    .map((p) => ({ id: p.id, s: score(p) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s || a.id.localeCompare(b.id))
    .slice(0, CANDIDATES_PER_RETRIEVER)
    .map((x) => x.id);
}

export function reciprocalRankFusion(rankings: string[][], k = RRF_CONSTANT): [string, number][] {
  if (k <= 0) throw new Error("rank_constant must be positive");
  const scores = new Map<string, number>();
  for (const ranking of rankings) {
    [...new Set(ranking)].forEach((id, i) =>
      scores.set(id, (scores.get(id) ?? 0) + 1 / (k + i + 1)),
    );
  }
  return [...scores.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

/** Toy reranker: rewards matching the question's qualifiers and primary reports. */
export function toyRerankScore(p: Passage): number {
  let s = p.toySimilarity * 0.5;
  if (p.matches.formulation) s += 1;
  if (p.matches.population) s += 1;
  if (p.matches.outcome) s += 1;
  if (p.sourceType === "Commentary") s -= 1;
  return Math.round(s * 100) / 100;
}

export function runLab(passages: Passage[], settings: LabSettings): LabResult {
  const byId = new Map(passages.map((p) => [p.id, p]));
  const kw = rankBy(passages, keywordScore);
  const sem = rankBy(passages, (p) => p.toySimilarity);

  let order: string[];
  const fusion = new Map<string, number>();
  if (settings.mode === "keyword") order = kw;
  else if (settings.mode === "semantic") order = sem;
  else {
    const fused = reciprocalRankFusion([kw, sem]);
    fused.forEach(([id, s]) => fusion.set(id, s));
    order = fused.map(([id]) => id);
  }

  const rerank = new Map<string, number>();
  if (settings.rerank) {
    order.forEach((id) => rerank.set(id, toyRerankScore(byId.get(id)!)));
    order = [...order].sort((a, b) => rerank.get(b)! - rerank.get(a)! || a.localeCompare(b));
  }

  const seenStudies = new Map<string, string>();
  let tokensUsed = 0;
  let afterDedupe = 0;
  const candidates: RankedPassage[] = order.map((id, i) => {
    const p = byId.get(id)!;
    let decision: Decision;
    const dupOf = p.studyId ? seenStudies.get(p.studyId) : undefined;
    if (settings.dedupe && dupOf) {
      decision = {
        status: "rejected",
        reason: `Duplicate: reports the same study (${p.studyId}) as ${dupOf}, which ranked higher.`,
      };
    } else {
      afterDedupe++;
      if (p.studyId && !seenStudies.has(p.studyId)) seenStudies.set(p.studyId, p.id);
      if (tokensUsed + p.tokens > settings.budget) {
        decision = {
          status: "rejected",
          reason: `Over budget: needs ${p.tokens} tokens, ${settings.budget - tokensUsed} remain.`,
        };
      } else {
        tokensUsed += p.tokens;
        decision = { status: "selected", reason: selectionReason(p) };
      }
    }
    return {
      passage: p,
      rank: i + 1,
      keywordScore: keywordScore(p),
      semanticScore: p.toySimilarity,
      fusionScore: fusion.get(id) ?? null,
      rerankScore: rerank.get(id) ?? null,
      decision,
    };
  });

  const retrieved = new Set(order);
  const selected = candidates.filter((c) => c.decision.status === "selected");
  return {
    candidates,
    notRetrieved: passages.filter((p) => !retrieved.has(p.id)),
    selected,
    tokensUsed,
    stageCounts: { retrieved: order.length, afterDedupe, selected: selected.length },
    sufficiency: assessSufficiency(selected.map((s) => s.passage)),
  };
}

function selectionReason(p: Passage): string {
  const misses: string[] = [];
  if (!p.matches.formulation) misses.push("formulation");
  if (!p.matches.population) misses.push("population");
  if (!p.matches.outcome) misses.push("outcome");
  if (p.sourceType === "Commentary")
    return "Selected within budget, but it is commentary about a study, not the study itself.";
  if (misses.length === 0)
    return "Selected within budget; formulation, population, and outcome all match the question.";
  return `Selected within budget, but it does not match the question's ${misses.join(", ")}. Relevant-looking is not the same as relevant.`;
}

export function assessSufficiency(selected: Passage[]): Sufficiency {
  const full = selected.filter(
    (p) =>
      p.matches.formulation &&
      p.matches.population &&
      p.matches.outcome &&
      p.sourceType !== "Commentary",
  );
  const matchingStudies = [...new Set(full.map((p) => p.studyId!).filter(Boolean))];
  const includesContradiction = full.some((p) => p.direction === "no-difference");
  const notes: string[] = [];
  const offTarget = selected.length - full.length;
  if (offTarget > 0)
    notes.push(`${offTarget} selected passage(s) miss at least one qualifier or are commentary.`);
  if (matchingStudies.length > 0 && !includesContradiction)
    notes.push(
      "A fixture study reporting no difference was not selected, so the context would hide disagreement.",
    );
  if (matchingStudies.length === 1)
    notes.push(
      "Only one matching study is present; the brief could not describe the range of findings.",
    );
  const level =
    matchingStudies.length === 0
      ? "gap"
      : matchingStudies.length >= 2 && includesContradiction
        ? "sufficient"
        : "partial";
  return { level, matchingStudies, includesContradiction, notes };
}
