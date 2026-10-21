import type { ApolloConfig } from "@/lib/apollo-engine";

export interface RequestScenario {
  id: string;
  title: string;
  questionId: string;
  config: Partial<ApolloConfig>;
  warm?: boolean;
  purpose: string;
  expected: string;
}
export const REQUEST_SCENARIOS: RequestScenario[] = [
  {
    id: "large-answer",
    title: "Full answer · large LLM",
    questionId: "crew",
    config: { answerCache: true },
    purpose:
      "One multi-part question. A cold cache misses, evidence is retrieved, and the large LLM drafts the answer before checks.",
    expected:
      "A cited answer returns to the same user. No tool is needed because the selected evidence already covers every fact.",
  },
  {
    id: "small-answer",
    title: "Short answer · small LLM",
    questionId: "paraphrase",
    config: {},
    purpose:
      "A narrower question needs two facts. The router selects the small LLM but does not call it until retrieval is complete.",
    expected:
      "The small model receives source passages, then its draft passes the same checks as the large model.",
  },
  {
    id: "cache-hit",
    title: "Repeat question · cache hit",
    questionId: "crew",
    config: { answerCache: true },
    warm: true,
    purpose:
      "Repeat exactly the first question with an approved answer already in the scoped cache, seeded by one successful local fixture run.",
    expected:
      "Reuse the answer, bypass retrieval and both models, recheck citations and current eligibility, then return it.",
  },
  {
    id: "tool-read",
    title: "Missing passage · use a tool",
    questionId: "source-read",
    config: { topK: 1, tool: "valid" },
    purpose:
      "The request names A11-LA-CAP as a fallback. The only search result contains an injected instruction and is filtered out, so one allowed source read is useful.",
    expected:
      "Validate get_source_passage arguments and permission, read once, add the result to context, and generate a checked answer.",
  },
  {
    id: "direct-lookup",
    title: "Known record · no LLM",
    questionId: "metadata",
    config: {},
    purpose:
      "The user asks for a known crew manifest and its source. The router chooses application code instead of either model.",
    expected:
      "A direct record lookup returns a source-backed result. Claim and permission checks still apply.",
  },
  {
    id: "input-attack",
    title: "Input check · reject injection",
    questionId: "input-attack",
    config: {},
    purpose:
      "The message asks the system to override its instructions and delete data. It is untrusted user input, not permission.",
    expected:
      "Return a refusal before accessing cache, index, tools, or a model. The heuristic is illustrative; no delete tool exists.",
  },
  {
    id: "access-denied",
    title: "Input check · deny access",
    questionId: "crew",
    config: { scope: "none" },
    purpose:
      "The same factual question arrives without permission to read the corpus. Application code enforces the access boundary.",
    expected:
      "Return an access-denied notice. A good prompt or a larger model cannot grant permission.",
  },
  {
    id: "bad-citation",
    title: "Output check · stop a bad citation",
    questionId: "crew",
    config: { fault: "badCitation" },
    purpose:
      "The large-model fixture drafts a plausible answer with the invented citation UNKNOWN-SPAN.",
    expected:
      "The citation fails to resolve. Withhold the factual draft and return a clear blocked notice to the user.",
  },
  {
    id: "evidence-gap",
    title: "Missing facts · stop safely",
    questionId: "unknown",
    config: {},
    purpose:
      "The question asks what the astronauts ate for breakfast. None of the indexed sources covers that fact.",
    expected:
      "Return an evidence-gap notice before generation. Neither model nor the available source-read tool can invent the missing source.",
  },
];
export const DEFAULT_SCENARIO = REQUEST_SCENARIOS[0]!;
