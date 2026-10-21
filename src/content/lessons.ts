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
    status: "available",
  },
  {
    number: 3,
    slug: "evaluation",
    title: "Measure Performance",
    concept: "Evaluations and LLM-as-judge",
    summary: "Separating retrieval, generation, and end-to-end evaluation; judge weaknesses.",
    status: "available",
  },
  {
    number: 4,
    slug: "guardrails",
    title: "Add Guardrails",
    concept: "Guardrails and application permissions",
    summary: "Untrusted retrieved text, output validation, citation verification, and enforced permissions.",
    status: "available",
  },
  {
    number: 5,
    slug: "tools-agents",
    title: "Use Tools Deliberately",
    concept: "Tool calling, agents, and context management",
    summary: "Tools versus workflows versus agents, the tool-call loop, and context budgets.",
    status: "available",
  },
];

export const getLesson = (slug: string) => LESSONS.find((l) => l.slug === slug);
