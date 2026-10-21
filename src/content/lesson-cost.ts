// Lesson Two content. Edit here; components only render it.
import type { QuizQuestion } from "./lesson-context";
import type { RequestKind } from "@/lib/caching";

export interface CacheType {
  key: string;
  name: string;
  reuses: string;
  stillRequired: string;
  validWhen: string;
  status: "planned" | "experiment" | "deferred";
}

export const CACHE_TYPES: CacheType[] = [
  {
    key: "embedding",
    name: "Embedding cache",
    reuses: "Vectors for unchanged text.",
    stillRequired: "Retrieval, generation, and verification for every query.",
    validWhen: "Same text, same preprocessing, same embedding model revision.",
    status: "planned",
  },
  {
    key: "retrieval",
    name: "Retrieval cache",
    reuses: "Retrieved candidate results.",
    stillRequired: "Context assembly, generation, verification, and release checks.",
    validWhen: "Same query contract, filters, authorization scope, index release, retrieval configuration, and exclusion-policy version.",
    status: "planned",
  },
  {
    key: "answer",
    name: "Approved-answer cache",
    reuses: "A previously verified and approved answer.",
    stillRequired: "Current permission and source-eligibility checks before release.",
    validWhen: "All key fields match and no source dependency has been invalidated.",
    status: "planned",
  },
  {
    key: "prompt",
    name: "Prompt cache (provider)",
    reuses: "Eligible model-side processing of a shared prompt prefix.",
    stillRequired: "Model generation — a new response is still produced — plus verification.",
    validWhen: "Provider-specific: identical prefix, minimum length, retention window. Check after provider selection.",
    status: "experiment",
  },
  {
    key: "semantic",
    name: "Semantic answer cache",
    reuses: "Answers across questions that seem similar.",
    stillRequired: "—",
    validWhen: "Deferred: nearby questions can differ materially in population, formulation, dose, or outcome.",
    status: "deferred",
  },
];

export const CACHE_KEY_CODE = `import hashlib
import json
from typing import Any


def versioned_cache_key(contract: dict[str, Any]) -> str:
    canonical = json.dumps(
        contract,
        sort_keys=True,
        separators=(",", ":"),
        ensure_ascii=False,
        allow_nan=False,
    )
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()`;

export const RETRIEVAL_CONTRACT_FIELDS = [
  "Question / query representation",
  "Explicit filters",
  "Authorization scope",
  "Physical index release",
  "Retrieval configuration",
  "Current exclusion-policy version",
];

export const ANSWER_EXTRA_FIELDS = [
  "Prompt version",
  "Generator version",
  "Verifier version",
  "Output-schema version",
  "Source dependencies (for invalidation)",
];

export const APPROVED_ANSWER = {
  question: "What evidence addresses magnesium glycinate and sleep outcomes in adults?",
  population: "Adults",
  formulation: "Magnesium glycinate",
  index: "SYN-INDEX-R3",
  scope: "SYN-SCOPE-practitioner",
  schema: "brief-schema v1",
  dependencies: ["SYN-DOC-101 v2", "SYN-DOC-109 v2", "SYN-DOC-107 v1"],
};

export const ROUTING_REQUESTS: { kind: RequestKind; label: string }[] = [
  { kind: "metadata", label: "Show metadata for this known source." },
  { kind: "extract", label: "Extract explicitly stated query attributes." },
  { kind: "compare", label: "Compare conflicting findings." },
  { kind: "unsupported", label: "Answer a question the corpus cannot support." },
];

export const ROUTING_PROGRESSION = [
  "Use deterministic application logic for tasks that do not need a model.",
  "Establish one generation baseline.",
  "Evaluate a smaller model on a clearly bounded task.",
  "Introduce routing only if measurements justify it.",
];

export const QUIZ_COST: QuizQuestion[] = [
  {
    id: "c1",
    prompt: "A request gets a provider prompt-cache hit. What happens next?",
    options: [
      "The cached answer is returned with no model call.",
      "The model still generates a new response; only eligible prefix processing is reused.",
      "Verification is skipped because the prefix was trusted.",
      "The request is routed to a smaller model.",
    ],
    answer: 1,
    explanation: "Prompt caching reuses processing of a shared prefix. Generation, and everything after it, still happens.",
  },
  {
    id: "c2",
    prompt: "Where should a changing timestamp go in the prompt?",
    options: ["At the very start, so the model sees it first.", "After the stable prefix, with the variable content.", "Inside the output contract.", "It doesn't matter."],
    answer: 1,
    explanation: "Reuse depends on an identical leading run. Anything that changes per request ends the reusable prefix wherever it appears.",
  },
  {
    id: "c3",
    prompt: "An approved answer’s cache key matches exactly. Can it be released immediately?",
    options: [
      "Yes — a matching SHA-256 key proves it is safe.",
      "Only after current permission and source-eligibility checks pass.",
      "Only if it is less than a day old.",
      "Yes, if the generator is the same.",
    ],
    answer: 1,
    explanation: "A valid key is necessary, not sufficient. A source may have been retracted, or the caller’s permissions changed, since approval.",
  },
  {
    id: "c4",
    prompt: "The corpus lacks evidence for a question. What should routing do?",
    options: ["Escalate to the largest available model.", "Retry with a higher temperature.", "Run bounded targeted retrieval, then return a partial answer or evidence gap.", "Use the semantic answer cache."],
    answer: 2,
    explanation: "A larger model cannot create missing source evidence. It can only make an unsupported answer sound more convincing.",
  },
  {
    id: "c5",
    prompt: "Why is semantic answer caching deferred in EvidenceLens?",
    options: [
      "It is too expensive to build.",
      "Nearby questions can differ materially in population, formulation, dose, or outcome.",
      "Providers don’t support it.",
      "It makes retrieval slower.",
    ],
    answer: 1,
    explanation: "“Glycinate and sleep in adults” and “oxide and sleep in adolescents” embed closely but need different evidence.",
  },
];

export const WRITING_TOPIC_COST = "Why prompt caching differs from answer caching";

export const TAKEAWAY_COST = {
  topic: "Why prompt caching differs from answer caching",
  points: [
    { prompt: "Explain it in your own words.", tip: "A prompt cache saves reading the same instructions twice; an answer cache saves writing the same answer twice — and is far riskier." },
    { prompt: "What surprised you?", tip: "Retracting a source leaves the cache key unchanged. Only dependency invalidation and the eligibility recheck catch it." },
    { prompt: "Where does it fit in EvidenceLens?", tip: "Every cache lookup sits after authentication and scope resolution; every hit still passes release checks." },
    { prompt: "What experiment would you run?", tip: "Cold versus warm requests on identical questions once a provider is chosen, holding task quality fixed." },
    { prompt: "What result would change your mind?", tip: "If retries and escalations from a smaller model cost more than the baseline, routing isn’t worth it for that task." },
  ],
  outline: [
    { label: "The misconception", guidance: "A cache hit means no model call and no checks." },
    { label: "The concept", guidance: "Five caches reuse five different things, each valid under its own conditions." },
    { label: "An EvidenceLens design example", guidance: "An approved answer blocked by a retracted source despite a matching key." },
    { label: "A trade-off", guidance: "Broader reuse saves more but raises the risk of stale or unauthorized answers." },
    { label: "An experiment to validate it", guidance: "Measure prefix reuse and end-to-end cost, counting verification and retries." },
    { label: "What remains unknown", guidance: "Provider, prices, prefix behaviour, and whether any routing is justified." },
  ],
};
