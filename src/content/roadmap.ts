// Implementation priorities. Qualitative only: no savings, dates, or delivery promises.
export interface Phase {
  id: string;
  title: string;
  items: string[];
  benefit: string;
  effort: string;
  refs: string;
  note?: string;
}

export const PHASES: Phase[] = [
  {
    id: "A",
    title: "Phase A · Define measurable behaviour",
    items: [
      "Evidence brief schema",
      "Source and provenance contracts",
      "Seed questions",
      "Annotation rules",
      "Supported, partial, evidence-gap, and outage examples",
    ],
    benefit: "Creates a testable definition of useful and acceptable behaviour.",
    effort: "Small to medium; depends on source access and reviewer availability.",
    refs: "F01–F03",
  },
  {
    id: "B",
    title: "Phase B · Build one complete baseline",
    items: [
      "One eligible document path",
      "Parsing and provenance",
      "Compatible embedding / index versions",
      "Separate lexical and dense baselines",
      "Structured draft generation",
      "Citation-ID validation",
      "Traceable outputs",
      "Initial evaluation once its inputs exist",
    ],
    benefit: "Creates the first reproducible evidence path.",
    effort: "Medium to high.",
    refs: "F04–F11, then relevant F12, F16, F17, F18 work",
    note: "Security controls are developed alongside the interfaces. Follow the master plan’s dependency graph — feature numbering is not an execution order.",
  },
  {
    id: "C",
    title: "Phase C · Improve demonstrated failure classes",
    items: [
      "Hybrid retrieval",
      "Reranking",
      "Study deduplication",
      "Context assembly",
      "Sufficiency assessment",
      "Claim verification",
    ],
    benefit: "Improves measured retrieval and release behaviour.",
    effort: "Medium to high; needs a usable baseline and development labels.",
    refs: "F13–F16",
  },
  {
    id: "D",
    title: "Phase D · Optimise measured repetition",
    items: [
      "Embedding caching at its planned ingestion stage",
      "Exact retrieval and approved-answer caching with invalidation",
      "Provider prompt-cache experiments",
      "A narrowly evaluated model-routing experiment",
    ],
    benefit: "Potential cost and latency reduction — to be measured, not assumed.",
    effort:
      "Low to medium for prompt-prefix changes; potentially higher for safe answer caching and routing.",
    refs: "F09, F19",
    note: "Depends on provider selection, request contracts, source policy, verification, traces, and versioning. New scope or changed dependencies go through the project’s child-edition process.",
  },
];

export const DEFERRED: [string, string][] = [
  [
    "Semantic answer caching",
    "Revisit if exact-key reuse is measured as too low and a verified similarity threshold can preserve scope and qualifiers.",
  ],
  [
    "Autonomous agents",
    "Revisit when a concrete task fails under the bounded workflow on held-out questions.",
  ],
  [
    "A learned router",
    "Revisit when rule-based routing is measured as a bottleneck and labelled routing data exists.",
  ],
  [
    "A second vector database",
    "Revisit when the first store demonstrably fails a measured scale or filtering requirement.",
  ],
  [
    "New orchestration frameworks",
    "Revisit when plain application code becomes the observed source of defects or delay.",
  ],
  [
    "Additional services",
    "Revisit when a measured bottleneck cannot be addressed inside existing components.",
  ],
];
