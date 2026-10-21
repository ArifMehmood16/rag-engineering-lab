// Deterministic logic for the Lesson Two labs. Synthetic; no provider or model is called.

// ---------- Prompt prefix ----------
export interface PromptSegment {
  key: string;
  label: string;
  changesPerRequest: boolean;
}

export const STABLE_SEGMENTS: PromptSegment[] = [
  { key: "policy", label: "Evidence policy", changesPerRequest: false },
  { key: "instructions", label: "Stable instructions", changesPerRequest: false },
  { key: "contract", label: "Output contract", changesPerRequest: false },
  { key: "examples", label: "Stable examples", changesPerRequest: false },
];
export const VARIABLE_SEGMENTS: PromptSegment[] = [
  { key: "question", label: "Current question", changesPerRequest: true },
  { key: "filters", label: "Explicit filters", changesPerRequest: true },
  { key: "evidence", label: "Retrieved evidence", changesPerRequest: true },
  { key: "details", label: "Request-specific details", changesPerRequest: true },
];
const TIMESTAMP: PromptSegment = {
  key: "timestamp",
  label: "Changing timestamp",
  changesPerRequest: true,
};

export interface PrefixOptions {
  timestampFirst: boolean;
  evidenceFirst: boolean;
}

export function buildPrompt(o: PrefixOptions): PromptSegment[] {
  const variable = o.evidenceFirst ? VARIABLE_SEGMENTS.filter((s) => s.key === "evidence") : [];
  const rest = VARIABLE_SEGMENTS.filter((s) => !variable.includes(s));
  const body = [...variable, ...STABLE_SEGMENTS, ...rest];
  return o.timestampFirst ? [TIMESTAMP, ...body] : [...body, TIMESTAMP];
}

/** Segments eligible for reuse: the unbroken run of identical segments from the start. */
export function reusablePrefixLength(segments: PromptSegment[]): number {
  const i = segments.findIndex((s) => s.changesPerRequest);
  return i === -1 ? segments.length : i;
}

// ---------- Approved-answer reuse ----------
export type ChangeKey =
  "population" | "formulation" | "dose" | "index" | "retraction" | "scope" | "schema";

export interface ChangeSpec {
  key: ChangeKey;
  label: string;
  /** Where the change is detected. */
  kind: "key" | "dependency" | "authorization";
  reason: string;
}

export const CHANGES: ChangeSpec[] = [
  {
    key: "population",
    label: "Change population: adults → older adults",
    kind: "key",
    reason: "The query contract changed. A different population is a different question.",
  },
  {
    key: "formulation",
    label: "Change formulation: glycinate → oxide",
    kind: "key",
    reason: "The query contract changed. Evidence about another formulation does not transfer.",
  },
  {
    key: "dose",
    label: "Add a dose qualifier to the question",
    kind: "key",
    reason: "The explicit filters changed, so the cached answer did not consider this qualifier.",
  },
  {
    key: "index",
    label: "Switch to a newer index release",
    kind: "key",
    reason:
      "The physical index release is part of the key; results under a different release are not the same retrieval.",
  },
  {
    key: "retraction",
    label: "Retract a supporting source",
    kind: "dependency",
    reason:
      "The key still matches, but a source dependency is no longer eligible. Dependency invalidation and the current eligibility recheck both block reuse.",
  },
  {
    key: "scope",
    label: "Change authorization scope",
    kind: "authorization",
    reason:
      "The caller’s scope differs. Authorization is part of the key, and current permissions are rechecked regardless.",
  },
  {
    key: "schema",
    label: "Change the output schema version",
    kind: "key",
    reason:
      "The output-schema version changed, so the stored answer does not satisfy the current contract.",
  },
];

export interface ReuseStep {
  name: string;
  outcome: "pass" | "fail" | "skipped";
  note: string;
}

export interface ReuseResult {
  reusable: boolean;
  steps: ReuseStep[];
  reasons: string[];
}

export function evaluateAnswerReuse(active: ChangeKey[]): ReuseResult {
  const specs = CHANGES.filter((c) => active.includes(c.key));
  const keyChanged = specs.some((c) => c.kind === "key" || c.kind === "authorization");
  const scopeChanged = active.includes("scope");
  const retracted = active.includes("retraction");

  const steps: ReuseStep[] = [
    {
      name: "Authenticate and resolve current scope",
      outcome: "pass",
      note: "Always runs before any cache lookup.",
    },
    {
      name: "Versioned cache-key lookup",
      outcome: keyChanged ? "fail" : "pass",
      note: keyChanged
        ? "No entry matches the new contract — cache miss."
        : "An approved entry matches the contract.",
    },
    {
      name: "Source dependencies still valid",
      outcome: keyChanged ? "skipped" : retracted ? "fail" : "pass",
      note: keyChanged
        ? "Not reached."
        : retracted
          ? "A dependency was invalidated by the retraction."
          : "No dependency has changed.",
    },
    {
      name: "Current permission check on cited sources",
      outcome: keyChanged ? "skipped" : scopeChanged ? "fail" : "pass",
      note: keyChanged
        ? "Not reached on a miss; runs on the fresh path instead."
        : "The caller may still see every cited source.",
    },
    {
      name: "Current source-eligibility recheck",
      outcome: keyChanged ? "skipped" : retracted ? "fail" : "pass",
      note: keyChanged
        ? "Not reached on a miss; runs on the fresh path instead."
        : retracted
          ? "A cited source is excluded now."
          : "All cited sources remain eligible.",
    },
  ];
  const reusable = steps.every((s) => s.outcome === "pass");
  return { reusable, steps, reasons: specs.map((s) => s.reason) };
}

// ---------- Routing ----------
export type Sufficiency = "sufficient" | "partial" | "missing";
export type RequestKind = "metadata" | "extract" | "compare" | "unsupported";

export interface RouteStep {
  label: string;
  tone: "app" | "model" | "check" | "stop";
}

export interface RouteResult {
  path: string;
  reason: string;
  steps: RouteStep[];
  outcome: string;
  largerModelUsed: false;
}

export function routeRequest(
  kind: RequestKind,
  sufficiency: Sufficiency,
  smallerModelValidated: boolean,
): RouteResult {
  const auth: RouteStep = { label: "Authenticate, scope, and pin index release", tone: "app" };
  if (kind === "metadata") {
    return {
      path: "Deterministic application logic — no model",
      reason:
        "Metadata for a known source is a database lookup. A model adds cost and a chance of error with no benefit.",
      steps: [
        auth,
        { label: "Look up source metadata by ID", tone: "app" },
        { label: "Check current permission and eligibility", tone: "check" },
      ],
      outcome: "Return stored metadata with version and locator.",
      largerModelUsed: false,
    };
  }
  if (kind === "extract") {
    return {
      path: smallerModelValidated
        ? "Smaller-model candidate (experiment passed)"
        : "Baseline model",
      reason: smallerModelValidated
        ? "A bounded, schema-checked task where a smaller model was separately evaluated and met its quality bar in this simulation."
        : "Routing is not justified until a smaller model is measured on this task. Use the one baseline.",
      steps: [
        auth,
        {
          label: smallerModelValidated
            ? "Smaller model extracts attributes"
            : "Baseline model extracts attributes",
          tone: "model",
        },
        { label: "Validate output against the query-attribute schema", tone: "check" },
        {
          label: "On schema failure: one bounded retry, then fall back to baseline",
          tone: "check",
        },
      ],
      outcome: "Structured query attributes, or a clear failure.",
      largerModelUsed: false,
    };
  }
  const retrieval: RouteStep[] = [
    auth,
    { label: "Hybrid retrieval, rerank, assemble context", tone: "app" },
    { label: "Assess evidence sufficiency", tone: "check" },
  ];
  const effective: Sufficiency = kind === "unsupported" ? "missing" : sufficiency;
  if (effective === "missing") {
    return {
      path: "No generation — evidence gap",
      reason:
        "The corpus does not support the question. A larger model cannot create missing source evidence, so none is called.",
      steps: [
        ...retrieval,
        { label: "Release an evidence-gap response describing what is missing", tone: "stop" },
      ],
      outcome: "Evidence gap (correct abstention).",
      largerModelUsed: false,
    };
  }
  if (effective === "partial") {
    return {
      path: "One targeted follow-up retrieval, then a partial answer if still short",
      reason:
        "A specific attribute is missing. Application code may run one bounded follow-up retrieval; it does not escalate model size.",
      steps: [
        ...retrieval,
        { label: "One targeted follow-up retrieval for the missing attribute", tone: "app" },
        { label: "Baseline model drafts a cited partial answer", tone: "model" },
        { label: "Verify claims and citations; recheck eligibility", tone: "check" },
      ],
      outcome: "Partial answer that names the missing evidence.",
      largerModelUsed: false,
    };
  }
  return {
    path: "Baseline generation model",
    reason:
      "Comparing conflicting findings may warrant a stronger generator, but that must be shown by evaluation — size alone does not establish fitness.",
    steps: [
      ...retrieval,
      { label: "Baseline model drafts a cited comparison", tone: "model" },
      { label: "Verify claims and citations; recheck eligibility", tone: "check" },
    ],
    outcome: "Supported brief that keeps the conflicting findings side by side.",
    largerModelUsed: false,
  };
}
