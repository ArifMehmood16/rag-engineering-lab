import { APOLLO_CLAIMS, getApolloQuestion, type EvidenceRecord } from "@/content/apollo";
import type { EngineState } from "./apollo-engine";

export interface Ratio {
  num: number;
  den: number;
}
export interface ApolloEvaluation {
  recall: Ratio;
  citationCorrectness: Ratio;
  citationCompleteness: Ratio;
  unsupportedDraft: Ratio;
  releasedCoverage: Ratio;
  correctAbstention: Ratio;
  falseAbstention: Ratio;
  infrastructureErrors: Ratio;
  releasedUnsupported: Ratio;
}
export function evaluateApolloRun(s: EngineState, records: EvidenceRecord[]): ApolloEvaluation {
  const q = getApolloQuestion(s.ctx.question);
  const found = q.required.filter((f) =>
    s.ctx.retrieved.some((x) =>
      records.some(
        (r) =>
          r.id === x.id &&
          r.kind === "source" &&
          r.eligibility === "eligible" &&
          r.facts?.includes(f),
      ),
    ),
  ).length;
  const contentSupported = (c: EngineState["ctx"]["claims"][number]) =>
    APOLLO_CLAIMS.some((t) => t.id === c.id && t.fact === c.fact && t.text === c.text);
  const pairs = s.ctx.claims.flatMap((c) =>
    c.cites.map((id) => ({
      ok:
        contentSupported(c) &&
        s.ctx.context.includes(id) &&
        records.some((r) => r.id === id && r.kind === "source" && r.facts?.includes(c.fact)),
    })),
  );
  const released = s.ctx.released?.claims ?? [];
  const terminal = s.ctx.outcome !== "pending";
  const infra = s.ctx.outcome === "infrastructure_error";
  return {
    recall: { num: found, den: q.answerable ? q.required.length : 0 },
    citationCorrectness: { num: pairs.filter((p) => p.ok).length, den: pairs.length },
    citationCompleteness: {
      num: s.ctx.checks.filter((x) => x.resolves && x.supported).length,
      den: s.ctx.checks.length,
    },
    unsupportedDraft: {
      num: s.ctx.claims.filter((c) => !contentSupported(c)).length,
      den: s.ctx.claims.length,
    },
    releasedCoverage: {
      num: q.required.filter((f) => released.some((c) => c.fact === f && contentSupported(c)))
        .length,
      den: q.answerable && terminal ? q.required.length : 0,
    },
    correctAbstention: {
      num: !q.answerable && s.ctx.outcome === "evidence_gap" ? 1 : 0,
      den: !q.answerable && terminal && !infra ? 1 : 0,
    },
    falseAbstention: {
      num:
        q.answerable && (s.ctx.outcome === "evidence_gap" || s.ctx.outcome === "false_abstention")
          ? 1
          : 0,
      den: terminal && q.answerable && !infra ? 1 : 0,
    },
    infrastructureErrors: { num: infra ? 1 : 0, den: terminal ? 1 : 0 },
    releasedUnsupported: {
      num: released.filter((c) => !contentSupported(c)).length,
      den: released.length,
    },
  };
}
