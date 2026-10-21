import type { ApolloConfig, Fault, ToolMode } from "@/lib/apollo-engine";

export type ExperimentId = "retrieval" | "efficiency" | "evaluation" | "guardrails" | "tools";
export const EXPERIMENTS: {
  id: ExperimentId;
  number: string;
  title: string;
  subtitle: string;
  lesson: string;
  transfer: string;
  thinking: string;
}[] = [
  {
    id: "retrieval",
    number: "01",
    title: "Give it context",
    subtitle: "RAG & embeddings",
    lesson: "context",
    transfer:
      "EvidenceLens plans BM25 + vector retrieval, fusion, reranking, and provenance-preserving passages (F07, F09, F10, F13). Keep population, formulation, dose, and outcome together, rather than treating topical similarity as support.",
    thinking: "Which required fact disappeared from the context when you reduced the budget?",
  },
  {
    id: "efficiency",
    number: "02",
    title: "Spend less work",
    subtitle: "Caching & routing",
    lesson: "cost-latency",
    transfer:
      "Embedding and exact retrieval/approved-answer caches are planned in F09/F19. Provider prompt caching and model routing remain experiments. Current permissions and exclusions must apply even to an old approved answer.",
    thinking: "Which work did a warm request actually avoid? Did generation still happen?",
  },
  {
    id: "evaluation",
    number: "03",
    title: "Measure the result",
    subtitle: "Evaluations & judges",
    lesson: "evaluation",
    transfer:
      "F03/F16 propose labelled questions and separate retrieval, answer, coverage, and operational metrics. The planned 30 seed, 200 development, and 400 release questions are not collected datasets or measured results.",
    thinking: "Did the system fail to retrieve evidence, use it, verify it, or stay available?",
  },
  {
    id: "guardrails",
    number: "04",
    title: "Control the boundary",
    subtitle: "Guardrails & permissions",
    lesson: "guardrails",
    transfer:
      "F11/F14/F17/F19 plan untrusted evidence handling, claim/citation checks, enforced access, and current exclusions. Schema validity, support, and permission are separate checks. No one prompt can enforce them all.",
    thinking:
      "If the injection detector misses an instruction, which independent control still prevents release?",
  },
  {
    id: "tools",
    number: "05",
    title: "Use tools deliberately",
    subtitle: "Tools & context",
    lesson: "tools-agents",
    transfer:
      "EvidenceLens starts with an explicit bounded workflow (P03, F13/F14), including at most one targeted follow-up retrieval and one revision. A tool call does not require a general autonomous agent.",
    thinking:
      "Did a tool contribute new evidence, duplicate existing context, or fail before returning data?",
  },
];
export const FAULTS: { id: Fault; label: string; explanation: string }[] = [
  {
    id: "none",
    label: "No fault",
    explanation: "Run the configured pipeline without an injected failure.",
  },
  {
    id: "retrievalMiss",
    label: "Miss a required passage",
    explanation:
      "Remove the moonwalking passage from retrieval candidates. The larger profile cannot repair missing evidence.",
  },
  {
    id: "wrongRole",
    label: "Invent a crew role",
    explanation:
      "The draft changes a factual role. It remains a rejected draft, never an approved answer.",
  },
  {
    id: "badCitation",
    label: "Invent a citation ID",
    explanation: "The draft references an ID the application never supplied.",
  },
  {
    id: "omitCitation",
    label: "Omit a citation",
    explanation: "A factual claim reaches verification without supporting evidence IDs.",
  },
  {
    id: "injection",
    label: "Follow a document instruction",
    explanation:
      "Turn off the heuristic to simulate a missed injection. Independent support checks must still block the corrupted claim.",
  },
  {
    id: "revoke",
    label: "Revoke evidence mid-run",
    explanation:
      "A supporting source becomes ineligible after verification. The release gate applies to fresh and cached answers.",
  },
  {
    id: "outage",
    label: "Provider unavailable",
    explanation: "An operational failure. Do not count it as a correct evidence gap.",
  },
  {
    id: "falseRefusal",
    label: "Refuse despite evidence",
    explanation:
      "Withhold a response after sufficient context was found. Useful coverage and false abstention expose this failure.",
  },
];
export const TOOL_MODES: { id: ToolMode; label: string }[] = [
  { id: "off", label: "No tool" },
  { id: "valid", label: "Read a passage" },
  { id: "invalid", label: "Invalid arguments" },
  { id: "denied", label: "Permission denied" },
  { id: "timeout", label: "Timeout" },
  { id: "empty", label: "Empty result" },
];
export const KNOWLEDGE_STAGES = [
  {
    title: "Read the sources",
    detail: "Preserve source identity and version alongside document text.",
  },
  {
    title: "Keep useful passages",
    detail:
      "Split or curate bounded passages without losing their original source locators. This lab starts from curated chunks.",
  },
  {
    title: "Encode each passage",
    detail:
      "Convert text into numeric vectors using the same model space that will encode questions. Here, seven explicit word groups form a toy model.",
  },
  {
    title: "Make the knowledge searchable",
    detail:
      "Store each vector with its passage ID and metadata. Retrieval will compare a query against these stored representations.",
  },
];

export const STAGE_EXPLANATIONS: Record<string, { why: string; boundary: string }> = {
  question: {
    why: "A question specifies what the system must support. A multi-part request needs evidence for every required part.",
    boundary: "This learning lab uses presets; no visitor question is stored.",
  },
  request: {
    why: "Check size and application permissions before accessing any index or cache.",
    boundary:
      "A local permission fixture demonstrates application enforcement, not production authentication.",
  },
  cache: {
    why: "Choose the task path and look for an approved answer with the same full request contract.",
    boundary:
      "A cache key is not permission. Current source eligibility is checked again before release.",
  },
  retrieve: {
    why: "Encode the query in the index's representation, compare it to stored passages, and return ranked evidence IDs.",
    boundary:
      "The toy vectors use seven explicit word groups. Similarity is neither truth nor confidence.",
  },
  assemble: {
    why: "Select passages within a budget. Remove repeats and preserve provenance instead of putting every result into the prompt.",
    boundary:
      "Retrieved text is untrusted data, including material that looks like an instruction.",
  },
  tool: {
    why: "An optional read-only capability can supply a bounded extra passage. Application code owns validation and execution.",
    boundary:
      "One call, a scope check, a timeout, and no automatic retries. Tool output is still evidence to check.",
  },
  sufficiency: {
    why: "Ask whether the selected passages cover the question's requirements before spending work on generation.",
    boundary:
      "Reviewed fixture labels provide this demonstration's ground truth; this is not an LLM sufficiency judge.",
  },
  draft: {
    why: "The generator receives the question, stable instructions, and selected evidence together. Retrieval augments its context; it does not retrain its weights.",
    boundary:
      "This lab fills reviewed answer templates. No live language model or provider cache runs.",
  },
  verify: {
    why: "Resolve every citation against the supplied context, then check whether it supports the claim.",
    boundary:
      "Existence is not support. The deterministic verifier checks fixture labels and exact reviewed templates.",
  },
  eligibility: {
    why: "Recheck permissions and current source status immediately before releasing factual content.",
    boundary:
      "A source revoked during generation must not survive via an old approval, cache hit, or index rollback.",
  },
  release: {
    why: "Only release the answer after its checks pass. Preserve the path from each claim back to the source passage.",
    boundary: "An evidence gap, rejected draft, and infrastructure failure are different outcomes.",
  },
};

export const DEFAULT_LEARNING_PATH: {
  title: string;
  description: string;
  config: Partial<ApolloConfig>;
  experiment: ExperimentId;
  questionId?: string;
}[] = [
  {
    title: "Follow a grounded answer",
    description: "Watch a question retrieve evidence and become a checked answer.",
    config: {},
    experiment: "retrieval",
  },
  {
    title: "Make context too small",
    description: "Keep the model profile unchanged; remove room for evidence.",
    config: { budget: 35 },
    experiment: "retrieval",
  },
  {
    title: "Repeat a warm request",
    description: "Enable prefix reuse, then run the same configuration twice.",
    config: { promptCache: true, embeddingCache: true },
    experiment: "efficiency",
  },
  {
    title: "Challenge a citation",
    description: "Inject a plausible-looking draft with an invented reference.",
    config: { fault: "badCitation" },
    experiment: "guardrails",
  },
  {
    title: "Find the corpus boundary",
    description: "Ask a question the supplied records do not answer.",
    config: {},
    experiment: "evaluation",
    questionId: "unknown",
  },
];
