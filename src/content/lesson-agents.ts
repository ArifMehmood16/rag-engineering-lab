import type { QuizQuestion } from "./lesson-context";
import type { Takeaway } from "@/components/learn/Takeaways";
import type { Passage, ToolCallCase, ToolSpec } from "@/lib/agents";

export const DISTINCTIONS: [string, string][] = [
  [
    "Tool",
    "An application capability with a defined interface: name, typed arguments, scope, limits.",
  ],
  ["Tool calling", "The model proposes a tool name and arguments. A proposal, not an action."],
  [
    "Application execution",
    "Code validates arguments and permissions, then runs only allowed calls.",
  ],
  ["Workflow", "Application-defined steps in a fixed order. The code decides what happens next."],
  ["Agent", "The model selects subsequent actions dynamically within limits the application sets."],
  [
    "RAG without an agent",
    "Retrieve, select, generate, verify — a workflow. It can work well with no agent at all.",
  ],
];

/** Proposed, hypothetical read-only tools. Not implemented EvidenceLens APIs. */
export const TOOLS: ToolSpec[] = [
  {
    name: "search_evidence",
    description: "Search the authorised, eligible corpus.",
    args: {
      query: { type: "string", required: true },
      top_k: { type: "integer", required: false, max: 10 },
    },
    scope: "evidence:read",
    timeoutMs: 2000,
    maxResults: 5,
  },
  {
    name: "get_evidence_span",
    description: "Fetch one passage by evidence ID and locator.",
    args: { evidence_id: { type: "string", required: true } },
    scope: "evidence:read",
    timeoutMs: 1000,
    maxResults: 1,
  },
  {
    name: "get_source_metadata",
    description: "Return licence, version, and eligibility for a source.",
    args: { source_id: { type: "string", required: true } },
    scope: "metadata:read",
    timeoutMs: 1000,
    maxResults: 1,
  },
];

export const NOT_OFFERED = [
  "Arbitrary SQL",
  "Shell commands",
  "Unrestricted browsing",
  "Deletion or write tools",
];

export const TOOL_CASES: ToolCallCase[] = [
  {
    id: "ok",
    title: "Valid call",
    question: "Does drug A reduce relapse in adults?",
    tool: "search_evidence",
    args: { query: "drug A relapse adults", top_k: 8 },
    callerScopes: ["evidence:read"],
    latencyMs: 400,
    results: ["EV-101", "EV-102", "EV-104", "EV-107", "EV-109", "EV-112", "EV-115"],
  },
  {
    id: "invalid",
    title: "Invalid arguments",
    question: "Show the passage for that trial.",
    tool: "get_evidence_span",
    args: { evidence_id: "", page: 3 },
    callerScopes: ["evidence:read"],
    latencyMs: 100,
    results: ["EV-101"],
  },
  {
    id: "unknown",
    title: "Tool not allowed",
    question: "List every document in the database.",
    tool: "run_sql",
    args: { sql: "SELECT * FROM documents" },
    callerScopes: ["evidence:read"],
    latencyMs: 0,
    results: [],
  },
  {
    id: "denied",
    title: "Permission denied",
    question: "Which licence covers source S-9?",
    tool: "get_source_metadata",
    args: { source_id: "S-9" },
    callerScopes: ["evidence:read"],
    latencyMs: 100,
    results: ["S-9 metadata"],
  },
  {
    id: "timeout",
    title: "Timeout",
    question: "Does drug A reduce relapse in adolescents?",
    tool: "search_evidence",
    args: { query: "drug A relapse adolescents" },
    callerScopes: ["evidence:read"],
    latencyMs: 3500,
    results: ["EV-120"],
  },
  {
    id: "empty",
    title: "Empty result",
    question: "Does drug A reduce relapse in pregnancy?",
    tool: "search_evidence",
    args: { query: "drug A relapse pregnancy" },
    callerScopes: ["evidence:read"],
    latencyMs: 300,
    results: [],
  },
];

export const REQUIRED_QUALIFIERS = ["adults", "oral formulation", "12-month relapse"];
export const BUDGET = 900;

export const PASSAGES: Passage[] = [
  {
    id: "P1",
    study: "Trial Alpha",
    tokens: 220,
    direction: "benefit",
    qualifiers: ["adults", "oral formulation", "12-month relapse"],
    text: "Adults on oral drug A had fewer relapses at 12 months than placebo.",
  },
  {
    id: "P2",
    study: "Trial Alpha",
    tokens: 210,
    direction: "benefit",
    duplicateOf: "P1",
    qualifiers: ["adults", "oral formulation", "12-month relapse"],
    text: "Conference abstract of Trial Alpha repeating the same 12-month result.",
  },
  {
    id: "P3",
    study: "Trial Beta",
    tokens: 260,
    direction: "no_difference",
    qualifiers: ["adults", "12-month relapse"],
    text: "In adults, injected drug A showed no clear difference in 12-month relapse.",
  },
  {
    id: "P4",
    study: "Cohort Gamma",
    tokens: 180,
    direction: "benefit",
    qualifiers: ["oral formulation"],
    text: "Observational cohort; mixed ages; lower relapse on oral drug A, confounding possible.",
  },
  {
    id: "P5",
    study: "Trial Alpha",
    tokens: 140,
    direction: "context",
    qualifiers: [],
    text: "Trial Alpha methods: randomisation, blinding, dropouts reported.",
  },
  {
    id: "P6",
    study: "Review Delta",
    tokens: 420,
    direction: "context",
    qualifiers: ["adults"],
    text: "Narrative background on relapse mechanisms; no new outcome data.",
  },
];

export const RETAIN = [
  "Current question",
  "Explicit user constraints",
  "Population / formulation / outcome qualifiers",
  "Evidence IDs and locators",
  "Contradictions",
  "Relevant tool results",
  "Authorization and release identifiers — held and enforced by application code",
];
export const FILTER = [
  "Duplicate passages",
  "Repeated publications about one study",
  "Irrelevant tool output",
  "Instructions embedded in documents",
  "Superseded or ineligible source versions",
];
export const COMPACT = [
  "Earlier conversational intent",
  "Tool metadata",
  "Nonessential repeated explanation",
];
export const NEVER_COMPACT = ["Evidence provenance", "Limitations", "Conflicts", "Uncertainty"];

export const RECOMMENDATION =
  "Begin with the bounded retrieval-and-verification workflow already described in the design. Evaluate agent behaviour only when a concrete task cannot be served adequately by that workflow.";

export const AGENT_REQUIREMENTS = [
  "Allowed tools",
  "Server-enforced scope",
  "Maximum steps",
  "Token and cost budgets",
  "Timeouts",
  "Retry limits",
  "Structured results",
  "Traceable stopping conditions",
  "Regression evaluations",
];

export const FOLLOWUP_CODE = `# Illustrative only — not EvidenceLens code. The application, not a model,
# decides whether one targeted follow-up retrieval runs.
MAX_FOLLOWUPS = 1

def answer(question, user):
    scope = authorize(user)                      # enforced in code
    evidence = retrieve(question, scope)
    check = assess_sufficiency(question, evidence)

    followups = 0
    while check.missing_qualifier and followups < MAX_FOLLOWUPS:
        extra = retrieve(check.targeted_query, scope, timeout_s=2)
        if extra.failed:                         # infrastructure error,
            return infra_error(extra)            # not an abstention
        evidence = select_within_budget(evidence + extra)
        check = assess_sufficiency(question, evidence)
        followups += 1

    if not check.sufficient:
        return evidence_gap(check)               # no model escalation
    draft = generate(question, evidence)
    return release_checks(draft, evidence, scope)  # citations, eligibility`;

export const BOUNDED_CONTROLS: [string, string][] = [
  ["Step cap", "Fixed number of follow-ups (here, one). Stopping reason is recorded."],
  ["Per-call timeout", "Timeouts are reported as infrastructure failures."],
  ["Retry limit", "Invalid-argument retries capped; repeated identical calls rejected."],
  ["Token budget", "Context selection runs against a stated token estimate."],
  ["Allow-list", "Only read-only, schema-declared tools exist."],
  ["Scope in code", "Every call is authorised by the server, independent of the prompt."],
];

export const VERIFY: string[] = [
  "Each fixture case (valid, invalid, unknown tool, denied, timeout, empty) produces its expected outcome.",
  "Timeouts are counted separately from correct abstentions.",
  "No released answer cites an ID absent from the tool results of that request.",
  "The follow-up loop never exceeds its step cap, and its stop reason is logged.",
  "Context selection keeps required qualifiers and any contradicting evidence.",
  "Compare workflow vs. any candidate agent on the same held-out questions before adopting it.",
];

export const QUIZ_AGENTS: QuizQuestion[] = [
  {
    id: "a1",
    prompt: "A RAG app retrieves, generates, and verifies in a fixed order. Is it an agent?",
    options: [
      "Yes — it uses an LLM",
      "No — it is a workflow; the code decides each step",
      "Yes — it calls a retriever",
    ],
    answer: 1,
    explanation:
      "An agent selects its next actions dynamically. A fixed sequence is a workflow, and that is fine.",
  },
  {
    id: "a2",
    prompt: "The model proposes get_source_metadata but the caller lacks the scope. What happens?",
    options: [
      "The model is asked to decide",
      "The application denies the call before execution",
      "The call runs and results are hidden",
    ],
    answer: 1,
    explanation:
      "Permissions are enforced by code. Putting them in the prompt does not enforce them.",
  },
  {
    id: "a3",
    prompt: "search_evidence times out. How should the run be recorded?",
    options: [
      "As a correct abstention",
      "As an infrastructure failure",
      "As evidence that none exists",
    ],
    answer: 1,
    explanation:
      "A timeout says nothing about the corpus; mixing it with abstention corrupts evaluation.",
  },
  {
    id: "a4",
    prompt: "Which context selection is best?",
    options: [
      "The most passages that fit",
      "Passages keeping required qualifiers and the conflicting trial, without duplicates",
      "Only the passage with the strongest effect",
    ],
    answer: 1,
    explanation: "Coverage of qualifiers and conflict matters; count does not.",
  },
  {
    id: "a5",
    prompt: "When should EvidenceLens add an autonomous agent?",
    options: [
      "Now, for flexibility",
      "When a concrete task cannot be served by the bounded workflow, with limits and evaluations",
      "Whenever a follow-up retrieval is needed",
    ],
    answer: 1,
    explanation:
      "One targeted follow-up is ordinary application code. Agents need a demonstrated task-level need.",
  },
];

export const TAKEAWAY_AGENTS: Takeaway = {
  topic: "Why a RAG workflow may not need an agent",
  points: [
    {
      prompt: "Explain it in your own words.",
      tip: "If code decides each step, it is a workflow. It is only an agent where the model chooses the next action.",
    },
    {
      prompt: "What surprised you?",
      tip: "Timeouts and denials can look exactly like empty results unless they are kept distinct.",
    },
    {
      prompt: "Where does it fit in EvidenceLens?",
      tip: "Sufficiency assessment can trigger one targeted follow-up retrieval — orchestrated by application code.",
    },
    {
      prompt: "What experiment would you run?",
      tip: "Compare the bounded workflow with a candidate agent on the same held-out questions, recording steps, cost, and outcomes.",
    },
    {
      prompt: "What result would change your mind?",
      tip: "A specific task class the workflow repeatedly fails on, where an agent with strict limits succeeds.",
    },
  ],
  outline: [
    {
      label: "The misconception",
      guidance: "Any app containing an LLM is an agent, and agents are the more capable choice.",
    },
    {
      label: "The concept",
      guidance: "Tools, tool calling, workflows, and agents differ in who decides the next step.",
    },
    {
      label: "An EvidenceLens design example",
      guidance: "One targeted follow-up retrieval, capped and orchestrated by code.",
    },
    {
      label: "A trade-off",
      guidance: "A fixed workflow is predictable and testable but may miss unforeseen steps.",
    },
    {
      label: "An experiment to validate it",
      guidance:
        "Run the six tool-call fixtures and the context-budget cases; then compare workflow and agent on held-out questions.",
    },
    {
      label: "What remains unknown",
      guidance: "Whether any EvidenceLens task needs dynamic action selection at all.",
    },
  ],
};
