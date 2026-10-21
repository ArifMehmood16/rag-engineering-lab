import type { EvidenceRecord } from "@/content/apollo";
import { tokenEstimate, toyEmbedding } from "./apollo-engine";

/** The fixtures are curated chunks, not the output of a PDF/HTML parser. */
export function buildKnowledgeIndex(records: EvidenceRecord[]) {
  const sources = [
    ...new Map(
      records.filter((r) => r.kind === "source").map((r) => [r.source.url, r.source]),
    ).values(),
  ];
  const chunks = records
    .filter((r) => r.eligibility === "eligible")
    .map((r) => ({
      id: r.id,
      text: r.text,
      source: r.source,
      locator: r.locator,
      tokens: tokenEstimate(r.text),
      vector: toyEmbedding(r.text),
      kind: r.kind,
    }));
  return { sources, chunks, dimensions: 7, model: "toy-seven-concepts-v1" };
}
