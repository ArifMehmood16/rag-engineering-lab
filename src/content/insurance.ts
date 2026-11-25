export type SourceId = "H17-P2" | "H17-P5" | "E3-P1" | "H17-P8";

export interface Passage {
  id: SourceId;
  tokens: number;
  label: string;
  location: string;
  excerpt: string;
  footnote?: string;
  required: boolean;
}

/** Eligible passages for the April escape-of-water question, in first-stage rank order. */
export const PASSAGES: Passage[] = [
  {
    id: "H17-P2",
    tokens: 110,
    label: "Base excess",
    location: "Base schedule H17, revision 2, page 2, “Excesses”",
    excerpt:
      "For escape of water, the excess is £500 per claim, subject to applicable endorsements.",
    required: true,
  },
  {
    id: "H17-P5",
    tokens: 90,
    label: "Roof repairs (unrelated)",
    location: "Base schedule H17, revision 2, page 5, “Roof repairs”",
    excerpt: "Keep the repair estimate and photographs with the case.",
    required: false,
  },
  {
    id: "E3-P1",
    tokens: 80,
    label: "Endorsement amendment",
    location: "Endorsement E3 to H17, revision 1, page 1, row “Escape of water”",
    excerpt: "Revised excess £750*.",
    footnote: "*Replaces the base escape-of-water excess for losses from 1 April 2026 inclusive.",
    required: true,
  },
  {
    id: "H17-P8",
    tokens: 120,
    label: "Contents (unrelated)",
    location: "Base schedule H17, revision 2, page 8, “Contents”",
    excerpt: "List the affected contents against the inventory supplied.",
    required: false,
  },
];

/** Stored demonstration rerank order (simulation, not a live model). */
export const RERANK_ORDER: SourceId[] = ["E3-P1", "H17-P2", "H17-P5", "H17-P8"];
export const REQUIRED_IDS: SourceId[] = ["H17-P2", "E3-P1"];
export const passageById = (id: SourceId) => PASSAGES.find((p) => p.id === id)!;
export const AMENDMENT_EFFECTIVE = "2026-04-01";

export interface HandlerCase {
  code: "APR" | "MAR" | "EDGE" | "UNKNOWN" | "ABSENT";
  lossDate: string | null;
  reportDate: string;
  amendmentAvailable: boolean;
  note: string;
}

export const HANDLER_CASES: HandlerCase[] = [
  {
    code: "APR",
    lossDate: "2026-04-03",
    reportDate: "2026-04-07",
    amendmentAvailable: true,
    note: "April loss",
  },
  {
    code: "MAR",
    lossDate: "2026-03-28",
    reportDate: "2026-04-07",
    amendmentAvailable: true,
    note: "March loss reported in April",
  },
  {
    code: "EDGE",
    lossDate: "2026-04-01",
    reportDate: "2026-04-07",
    amendmentAvailable: true,
    note: "Effective date is inclusive",
  },
  {
    code: "UNKNOWN",
    lossDate: null,
    reportDate: "2026-04-07",
    amendmentAvailable: true,
    note: "Loss date not given",
  },
  {
    code: "ABSENT",
    lossDate: "2026-04-03",
    reportDate: "2026-04-07",
    amendmentAvailable: false,
    note: "Amendment required but its text is unavailable",
  },
];

export const TOP_K_DEMO = {
  title: "Which policy passages fit?",
  intro:
    "A handler needs the excess for a water loss on 3 April. The base policy and its dated amendment both have to reach the model. Change the retrieval order or the space available, then follow the evidence into the checked reply.",
  description:
    "Try the four-passage H17 insurance example. Compare ranking, context coverage, citations and the reply a handler receives.",
};
