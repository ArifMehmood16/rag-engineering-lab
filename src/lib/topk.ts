import {
  PASSAGES,
  RERANK_ORDER,
  REQUIRED_IDS,
  passageById,
  type SourceId,
} from "@/content/insurance";

export type Ordering = "original" | "reranked";
export interface LabInput {
  k: number;
  ordering: Ordering;
  budget: number;
}
export interface Excluded {
  id: SourceId;
  reason: string;
}
export type LabDecision =
  { kind: "cite"; amount: 750; sources: SourceId[] } | { kind: "review"; reasons: string[] };
export interface LabResult {
  input: LabInput;
  candidates: SourceId[];
  ordered: SourceId[];
  packed: SourceId[];
  excluded: Excluded[];
  tokensUsed: number;
  recall: [number, number];
  precision: [number, number];
  coverage: [number, number];
  decision: LabDecision;
}

export function runTopK(input: LabInput): LabResult {
  const k = Math.max(1, Math.min(PASSAGES.length, Math.round(input.k)));
  const budget = Math.max(0, input.budget);
  const candidates = PASSAGES.slice(0, k).map((p) => p.id);
  const ordered =
    input.ordering === "reranked"
      ? RERANK_ORDER.filter((id) => candidates.includes(id))
      : [...candidates];
  const packed: SourceId[] = [];
  const excluded: Excluded[] = [];
  let used = 0;
  for (const id of ordered) {
    const t = passageById(id).tokens;
    if (used + t <= budget) {
      packed.push(id);
      used += t;
    } else
      excluded.push({ id, reason: `Skipped in packing: needs ${t} tokens, ${budget - used} left` });
  }
  for (const p of PASSAGES)
    if (!candidates.includes(p.id))
      excluded.push({ id: p.id, reason: `Not retrieved: rank beyond K=${k}` });

  const rel = candidates.filter((id) => REQUIRED_IDS.includes(id)).length;
  const covered = packed.filter((id) => REQUIRED_IDS.includes(id)).length;
  let decision: LabDecision;
  if (covered === REQUIRED_IDS.length)
    decision = { kind: "cite", amount: 750, sources: [...REQUIRED_IDS] };
  else {
    const reasons: string[] = [];
    if (budget === 0) reasons.push("Empty context: the token budget is 0");
    for (const id of REQUIRED_IDS) {
      if (packed.includes(id)) continue;
      reasons.push(
        candidates.includes(id) ? `${id} dropped in packing` : `${id} absent from candidates`,
      );
    }
    decision = { kind: "review", reasons };
  }
  return {
    input: { k, ordering: input.ordering, budget },
    candidates,
    ordered,
    packed,
    excluded,
    tokensUsed: used,
    recall: [rel, REQUIRED_IDS.length],
    precision: [rel, k],
    coverage: [covered, REQUIRED_IDS.length],
    decision,
  };
}

export const LAB_DEFAULT: LabInput = { k: 3, ordering: "original", budget: 220 };
