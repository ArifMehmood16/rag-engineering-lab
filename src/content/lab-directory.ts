export const WORKED_EXAMPLES = [
  {
    to: "/demos/top-k",
    title: "Top-K and context budgets",
    summary: "See which policy passages fit and which citations reach the answer.",
  },
  {
    to: "/demos/release-evaluation",
    title: "Release evaluation",
    summary: "Compare two releases on 50 questions and find the group the faster release misses.",
  },
  {
    to: "/showcases/agent-authority",
    title: "Agent Authority Explorer",
    summary: "Replay a supplier email with broad permissions and with application-enforced limits.",
  },
] as const;

export const CROSS_LESSON_PAGES = [
  {
    to: "/architecture",
    title: "Architecture map",
    summary: "Trace the proposed query workflow and its checks.",
  },
  {
    to: "/roadmap",
    title: "Implementation priorities",
    summary: "See which changes need evidence before implementation.",
  },
  {
    to: "/writing",
    title: "Writing exercises",
    summary: "Turn a lab observation into a six-part outline.",
  },
] as const;
