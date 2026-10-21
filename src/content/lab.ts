// Content for THE INTELLIGENCE LAB home experience. Synthetic, design-phase.
export interface LabQuestion {
  id: string;
  text: string;
  note: string;
}

export const LAB_QUESTIONS: LabQuestion[] = [
  {
    id: "q1",
    text: "Does oral drug A reduce 12-month relapse in adults?",
    note: "Synthetic question with supporting and conflicting fixture evidence.",
  },
  {
    id: "q2",
    text: "Does drug A reduce relapse in pregnancy?",
    note: "Synthetic question with no eligible fixture evidence — should end in an evidence gap.",
  },
  {
    id: "q3",
    text: "Which licence covers source S-9?",
    note: "Metadata question — answerable without generation in the design.",
  },
];

export interface LabExperiment {
  id: string;
  title: string;
  desc: string;
  lesson: string; // slug where the working version lives today
}

export const LAB_EXPERIMENTS: LabExperiment[] = [
  {
    id: "retrieval",
    title: "Retrieval & evidence selection",
    desc: "Rank, deduplicate, rerank, and budget passages.",
    lesson: "context",
  },
  {
    id: "cache",
    title: "Cache & routing",
    desc: "Prompt-prefix reuse, invalidation, conservative routing.",
    lesson: "cost-latency",
  },
  {
    id: "eval",
    title: "Failure injection",
    desc: "Introduce a failure and see which metric moves.",
    lesson: "evaluation",
  },
  {
    id: "trust",
    title: "Trust boundaries",
    desc: "Injection, fabricated citations, revoked sources.",
    lesson: "guardrails",
  },
  {
    id: "tools",
    title: "Tool-call loop & context budget",
    desc: "Invalid args, denials, timeouts, empty results.",
    lesson: "tools-agents",
  },
];

export const ORBIT_DISCLAIMER =
  "ORBIT visualises application stages and their activity. It does not depict consciousness, intent, or hidden model reasoning.";
