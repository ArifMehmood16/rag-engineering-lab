import type { Takeaway } from "@/components/learn/Takeaways";
import { TAKEAWAY_AGENTS } from "./lesson-agents";
import { TAKEAWAY_CONTEXT } from "./lesson-context";
import { TAKEAWAY_COST } from "./lesson-cost";
import { TAKEAWAY_EVAL } from "./lesson-eval";
import { TAKEAWAY_GUARD } from "./lesson-guardrails";

export const ALL_TAKEAWAYS: { slug: string; data: Takeaway }[] = [
  { slug: "context", data: TAKEAWAY_CONTEXT },
  { slug: "cost-latency", data: TAKEAWAY_COST },
  { slug: "evaluation", data: TAKEAWAY_EVAL },
  { slug: "guardrails", data: TAKEAWAY_GUARD },
  { slug: "tools-agents", data: TAKEAWAY_AGENTS },
];
