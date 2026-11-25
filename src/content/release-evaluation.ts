export const EVALUATION = {
  single: { total: 40, baselinePass: 38, candidatePass: 39 },
  endorsement: { total: 10, baselinePass: 9, candidatePass: 5 },
  p95Ms: { baseline: 1100, candidate: 900 },
  unauthorisedExposures: { baseline: 0, candidate: 0 },
  minEndorsementPass: 8,
} as const;

export const RELEASE_DEMO = {
  title: "Can a faster release miss more amendments?",
  intro:
    "Two releases answer the same 50 labelled policy questions. An answer passes when every required fact is correct and supported. Compare the two groups to see where the faster release loses evidence.",
  description:
    "Inspect supported answers, p95 latency and the endorsement gate in a simulated release evaluation.",
};

export const RELEASE_SLICES = {
  overall: "All questions",
  single: "Single-clause",
  endorsement: "Endorsement",
} as const;
