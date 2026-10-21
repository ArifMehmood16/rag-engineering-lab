// Planned EvidenceLens query workflow and optional teaching overlays.
// Everything here is design-phase: "planned" = in the current design, "proposed" = a teaching suggestion.
export type OverlayId =
  "retrievalCache" | "answerCache" | "promptCache" | "routing" | "toolCall" | "evaluation";
export type StageStatus = "planned" | "proposed";

export interface Stage {
  id: string;
  name: string;
  responsibility: string;
  inputs: string;
  outputs: string;
  trust: string;
  lesson: string; // lesson slug
  status: StageStatus;
  /** Present only when this overlay is on. */
  overlay?: OverlayId;
  /** Insert before this base stage id. */
  before?: string;
}

export const OVERLAYS: { id: OverlayId; label: string; desc: string }[] = [
  {
    id: "retrievalCache",
    label: "Retrieval caching",
    desc: "Reuse retrieval results for an identical, scoped request",
  },
  {
    id: "answerCache",
    label: "Approved-answer caching",
    desc: "Reuse an approved brief — still release-checked",
  },
  {
    id: "promptCache",
    label: "Prompt caching",
    desc: "Provider reuse of a stable prefix — generation still runs",
  },
  {
    id: "routing",
    label: "Model routing",
    desc: "Pick a route for bounded tasks — never skips verification",
  },
  {
    id: "toolCall",
    label: "Hypothetical tool call",
    desc: "Model proposes; application validates before results return",
  },
  {
    id: "evaluation",
    label: "Evaluation coverage",
    desc: "Offline measurement across stages, not a per-request step",
  },
];

export const BASE_STAGES: Stage[] = [
  {
    id: "intake",
    name: "Request intake",
    responsibility: "Accept the question and explicit constraints; apply request limits.",
    inputs: "User question, constraints",
    outputs: "Normalised request",
    trust: "User input is untrusted.",
    lesson: "guardrails",
    status: "planned",
  },
  {
    id: "auth",
    name: "Authentication & scope",
    responsibility:
      "Resolve who is asking and which sources they may use — before any cache or index access.",
    inputs: "Session, request",
    outputs: "Server-held scope",
    trust: "Enforced in application code; not given to the model as a control.",
    lesson: "guardrails",
    status: "planned",
  },
  {
    id: "retrieve",
    name: "Hybrid retrieval",
    responsibility: "Lexical and dense search over the pinned, eligible index release.",
    inputs: "Request, scope, index release",
    outputs: "Candidate passages with IDs",
    trust: "Retrieved text is untrusted data.",
    lesson: "context",
    status: "planned",
  },
  {
    id: "select",
    name: "Evidence selection",
    responsibility: "Fuse, deduplicate by study, rerank, assemble within a context budget.",
    inputs: "Candidates",
    outputs: "Bounded evidence set with locators",
    trust: "Embedded instructions are kept as data.",
    lesson: "context",
    status: "planned",
  },
  {
    id: "sufficiency",
    name: "Sufficiency assessment",
    responsibility:
      "Decide supported, partial, or evidence gap; allow one targeted follow-up retrieval in code.",
    inputs: "Evidence set, required qualifiers",
    outputs: "Sufficiency decision",
    trust: "Missing evidence → gap, not a larger model.",
    lesson: "tools-agents",
    status: "planned",
  },
  {
    id: "generate",
    name: "Structured draft generation",
    responsibility: "Produce a typed draft citing evidence IDs only.",
    inputs: "Question, bounded evidence",
    outputs: "Schema-valid draft",
    trust: "Model output is untrusted until verified.",
    lesson: "cost-latency",
    status: "planned",
  },
  {
    id: "verify",
    name: "Claim & citation verification",
    responsibility: "Resolve citation IDs server-side and check each claim against its cited span.",
    inputs: "Draft, evidence records",
    outputs: "Verified or rejected claims",
    trust: "Citation existence ≠ citation support.",
    lesson: "guardrails",
    status: "planned",
  },
  {
    id: "release",
    name: "Eligibility recheck & release",
    responsibility:
      "Recheck current permissions and source eligibility, then release the brief or a gap.",
    inputs: "Verified draft, current scope",
    outputs: "Evidence brief, partial answer, or gap",
    trust: "Revocations during the query are honoured here.",
    lesson: "guardrails",
    status: "planned",
  },
  {
    id: "trace",
    name: "Trace record",
    responsibility: "Record versions, IDs, and outcomes without secrets or unnecessary content.",
    inputs: "Run metadata",
    outputs: "Reproducible run record",
    trust: "Logs exclude secrets.",
    lesson: "evaluation",
    status: "planned",
  },
];

export const OVERLAY_STAGES: Stage[] = [
  {
    id: "answer-cache",
    overlay: "answerCache",
    before: "retrieve",
    name: "Approved-answer cache lookup",
    responsibility:
      "Look up an approved brief by a full key (question, scope, index and policy versions).",
    inputs: "Scoped request, cache key",
    outputs: "Hit → jump to eligibility recheck & release; miss → retrieval",
    trust: "A hit never skips current permission and eligibility checks.",
    lesson: "cost-latency",
    status: "proposed",
  },
  {
    id: "retrieval-cache",
    overlay: "retrievalCache",
    before: "retrieve",
    name: "Retrieval cache lookup",
    responsibility:
      "Reuse retrieval results for an identical scoped query on the same index release.",
    inputs: "Scoped query, index release",
    outputs: "Cached candidate IDs or miss",
    trust: "Keyed by scope; invalidated by index or source changes.",
    lesson: "cost-latency",
    status: "proposed",
  },
  {
    id: "tool",
    overlay: "toolCall",
    before: "generate",
    name: "Validated tool call (hypothetical)",
    responsibility:
      "Model proposes a read-only tool; application validates arguments and scope, executes, returns a bounded result with a call ID.",
    inputs: "Proposed call",
    outputs: "Bounded result or structured error",
    trust: "Results reach the model only after application validation; still untrusted.",
    lesson: "tools-agents",
    status: "proposed",
  },
  {
    id: "route",
    overlay: "routing",
    before: "generate",
    name: "Model route selection",
    responsibility:
      "Choose no-model, smaller validated model, or default route for a bounded task.",
    inputs: "Task type, sufficiency",
    outputs: "Route",
    trust: "Every route still passes verification and release.",
    lesson: "cost-latency",
    status: "proposed",
  },
];

export const PROMPT_CACHE_NOTE =
  "Prompt-cache overlay: a stable prefix may be reused by a provider, but generation still runs and produces new output.";
export const EVAL_NOTE =
  "Evaluation overlay: retrieval, generation-with-fixed-evidence, and end-to-end evaluations measure these stages offline. Evaluation is not a mandatory synchronous step in each request.";
export const EVAL_COVERS = ["retrieve", "select", "sufficiency", "generate", "verify", "release"];
