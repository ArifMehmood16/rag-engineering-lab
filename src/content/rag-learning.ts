import type { ExperimentId } from "./rag-lab";

export const LEARNING_LENSES: {
  id: ExperimentId;
  label: string;
  title: string;
  takeaway: string;
  thinking: string;
}[] = [
  {
    id: "retrieval",
    label: "Context",
    title: "RAG & embeddings",
    takeaway:
      "Similarity finds candidates. Selected source text grounds the answer; it does not retrain the LLM.",
    thinking: "Could a similar passage still fail to answer the question?",
  },
  {
    id: "efficiency",
    label: "Caching",
    title: "Caching & routing",
    takeaway:
      "Prompt caching reuses prefix processing and still generates. An approved-answer hit can avoid generation; both paths still need release checks.",
    thinking: "Which repeated request still makes a model call?",
  },
  {
    id: "evaluation",
    label: "Evals",
    title: "Evaluations & judges",
    takeaway:
      "Evaluate retrieval, generation with fixed evidence, and the final user outcome separately. A judge needs a rubric and calibration against reviewed labels.",
    thinking: "Did the wrong answer start with missing evidence or misuse of good evidence?",
  },
  {
    id: "guardrails",
    label: "Guardrails",
    title: "Guardrails & permissions",
    takeaway:
      "Input screening, schema validation, citation support, and application permissions are independent controls. None replaces the others.",
    thinking:
      "If a document instruction escapes detection, what independent boundary still protects release?",
  },
  {
    id: "tools",
    label: "Tools",
    title: "Tools & context",
    takeaway:
      "Use a tool only for a concrete missing capability. Application code validates and executes it; keep useful, source-linked results within the context budget.",
    thinking: "Who chooses the next action here: application code or the model?",
  },
];

export const LEARNING_PAGE_TITLES: Record<ExperimentId, string[]> = {
  retrieval: [
    "The same meaning, different words",
    "Compare the two search signals",
    "Evidence becomes model context",
  ],
  efficiency: [
    "Request 1 · process the prefix",
    "Request 2 · reuse the prefix",
    "Request 3 · reuse an approved answer",
    "What routing and caching actually avoid",
  ],
  evaluation: [
    "Start with reviewed test cases",
    "Isolate a retrieval failure",
    "Hold evidence fixed; test generation",
    "Inspect a simulated judge verdict",
  ],
  guardrails: [
    "Check a message before access",
    "Retrieved instructions stay untrusted",
    "Valid JSON can still be wrong",
    "Permissions belong to application code",
  ],
  tools: [
    "Enough evidence · no tool needed",
    "Missing evidence · propose one read",
    "Validate, execute, return the result",
    "Keep useful context; drop the rest",
  ],
};
