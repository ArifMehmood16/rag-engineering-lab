import type { EvidenceRecord } from "@/content/apollo";
import { toyEmbedding } from "./apollo-engine";
import { buildKnowledgeIndex } from "./knowledge-index";
import {
  atOutput,
  stageInput,
  stageOutput,
  walkthroughStep,
  type WalkthroughState,
} from "./rag-walkthrough";

/** The annotation travels on the same curve as the visible data packet. */
export function flowLabel(
  tour: WalkthroughState,
  record: EvidenceRecord,
  records: EvidenceRecord[],
) {
  const step = walkthroughStep(tour);
  const mode = tour.beat === 0 ? "input" : atOutput(tour) ? "output" : "work";
  const before = stageInput(tour);
  const after = stageOutput(tour);
  const vector = toyEmbedding(record.text)
    .map((v) => v.toFixed(2))
    .join(" · ");
  const index = buildKnowledgeIndex(records);
  let text: string;
  if (tour.phase === "knowledge") {
    const inputs = [
      "2 source pages · prepared text",
      "Source text + original locator",
      `${record.id} · passage text`,
      `${record.id} · vector + metadata`,
    ];
    const outputs = [
      "Readable text + source identity",
      `${index.chunks.length} bounded chunks · stable IDs`,
      `[ ${vector} ]`,
      `${index.chunks.length} searchable passage records`,
    ];
    text =
      mode === "input"
        ? inputs[tour.stage]!
        : mode === "output"
          ? outputs[tour.stage]!
          : step.work[tour.beat - 1]!.title;
  } else {
    const inputs = [
      before.ctx.question,
      `Question + ${before.config.scope} scope`,
      "Validated question + cache contract",
      "This question + prepared knowledge index",
      `${before.ctx.retrieved.length} ranked candidates`,
      `${before.ctx.context.length} context passages`,
      `${before.ctx.context.length} passages + required facts`,
      `${before.ctx.context.length} passages + instructions + question`,
      `${before.ctx.claims.length} untrusted claims + citation IDs`,
      "Verified claims + current source status",
      "Approved claims + resolved citations",
    ];
    const result = after?.results[tour.stage];
    const outputs = [
      "Required facts identified",
      `Access scope: ${before.config.scope}`,
      after?.ctx.usage.answerHit
        ? "Cache hit → output checks; no model call"
        : `Plan: ${after?.ctx.route ?? "pending"} · retrieve before generation`,
      `${after?.ctx.retrieved.length ?? 0} ranked passage IDs + scores`,
      `${after?.ctx.context.length ?? 0} passages · ≈${after?.ctx.tokensUsed ?? 0} tokens`,
      before.config.tool === "off"
        ? "No tool call · fixed workflow continues"
        : "Bounded tool result checked",
      after?.halted ? "Evidence gap · generation stopped" : "Evidence covers the required facts",
      `${after?.ctx.claims.length ?? 0} draft claims · still untrusted`,
      `${after?.ctx.checks.filter((c) => c.resolves && c.supported).length ?? 0} supported claims`,
      "Current eligibility checked",
      after?.ctx.released ? "Checked answer + resolvable citations" : "No answer released",
    ];
    text =
      mode === "input"
        ? inputs[tour.stage]!
        : mode === "output"
          ? result?.status === "blocked"
            ? `Returned to you: ${after?.ctx.outcome === "evidence_gap" ? "evidence gap" : "answer withheld"}`
            : result?.status === "skipped"
              ? tour.stage === 5 && before.config.tool === "off"
                ? outputs[5]!
                : before.ctx.usage.answerHit
                  ? "Bypassed · reuse the checked result"
                  : "Stage bypassed on this route"
              : outputs[tour.stage]!
          : tour.stage === 5 && before.config.tool === "off"
            ? "Tool disabled · no external action"
            : step.work[tour.beat - 1]!.title;
  }
  const selectedEvidence = (after?.ctx.context ?? before.ctx.context).slice(0, 2).join(" · ");
  const payload =
    tour.phase === "knowledge"
      ? tour.stage > 0
        ? `${record.id} · text + source identity`
        : "Source pages → readable text"
      : tour.stage === 3
        ? `${
            (after?.ctx.retrieved ?? before.ctx.retrieved)
              .slice(0, 2)
              .map((r) => r.id)
              .join(" · ") || "Query vector"
          } · candidates`
        : tour.stage >= 4 && tour.stage <= 7
          ? selectedEvidence
            ? `Evidence: ${selectedEvidence}`
            : "No usable evidence yet"
          : tour.stage === 2
            ? "Question + scope + index + settings"
            : tour.stage >= 8
              ? "Claims + citation IDs · checked before release"
              : "Same question · application access scope";
  return { mode, text, payload };
}
