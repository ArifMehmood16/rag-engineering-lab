// Lesson catalogue. Only lessons with status "available" have full content.
export type LessonStatus = "available" | "planned";

export interface LessonMeta {
  number: number;
  slug: string;
  title: string;
  concept: string;
  summary: string;
  status: LessonStatus;
  /** For planned lessons: what the next increment will cover (from the brief). */
  nextUp?: string[];
}

export const LESSONS: LessonMeta[] = [
  {
    number: 1,
    slug: "context",
    title: "Give the AI Context",
    concept: "RAG and embeddings",
    summary: "How retrieval supplies evidence, why similarity is not support, and why selection after retrieval matters.",
    status: "available",
  },
  {
    number: 2,
    slug: "cost-latency",
    title: "Reduce Cost and Latency",
    concept: "Prompt caching and model routing",
    summary: "Embedding, retrieval, answer, prompt, and semantic caches — and conservative routing.",
    status: "planned",
    nextUp: [
      "Interactive comparison of five cache types",
      "Prompt-prefix demonstration (a prompt-cache hit still generates)",
      "Cache-invalidation exercise and proposed cache-key example",
      "Conservative routing simulator: missing evidence leads to a gap, not a larger model",
    ],
  },
  {
    number: 3,
    slug: "evaluation",
    title: "Measure What Matters",
    concept: "Evaluations and LLM-as-judge",
    summary: "Separating retrieval, generation, and end-to-end evaluation; judge weaknesses.",
    status: "planned",
    nextUp: [
      "Synthetic evaluation lab with labelled evidence and visible denominators",
      "Failure injection showing which metric changes",
      "Dataset design, leakage prevention, and holdout discipline",
      "Infrastructure errors kept separate from correct abstention",
    ],
  },
  {
    number: 4,
    slug: "guardrails",
    title: "Draw the Trust Boundaries",
    concept: "Guardrails and application permissions",
    summary: "Untrusted retrieved text, output validation, citation verification, and enforced permissions.",
    status: "planned",
    nextUp: [
      "Trust-boundary lab: direct and indirect injection, fabricated citation",
      "Schema-valid but unsupported text",
      "Unauthorized evidence and a source revoked mid-query",
      "Illustrative typed output contract",
    ],
  },
  {
    number: 5,
    slug: "tools-agents",
    title: "Use Tools Deliberately",
    concept: "Tool calling, agents, and context management",
    summary: "Tools versus workflows versus agents, the tool-call loop, and context budgets.",
    status: "planned",
    nextUp: [
      "Tool-call walkthrough with synthetic read-only tools",
      "Invalid arguments, denials, timeouts, and empty results",
      "Context-budget lab with qualifiers, duplicates, and contradictions",
      "Why EvidenceLens starts with a bounded workflow",
    ],
  },
];

export const getLesson = (slug: string) => LESSONS.find((l) => l.slug === slug);
