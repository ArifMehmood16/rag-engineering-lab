import { AMENDMENT_EFFECTIVE, type SourceId } from "@/content/insurance";

export type ExcessDecision =
  | { kind: "cite"; amount: 500 | 750; sources: SourceId[]; text: string }
  | { kind: "ask"; text: string }
  | { kind: "review"; text: string };

/** Which excess H17 specifies. The report date is accepted but ignored: only the loss date selects wording. */
export function operativeExcess(input: {
  lossDate: string | null;
  reportDate?: string;
  amendmentAvailable?: boolean;
}): ExcessDecision {
  const { lossDate, amendmentAvailable = true } = input;
  if (!lossDate)
    return {
      kind: "ask",
      text: "Ask for the loss date. The report date alone cannot select the operative wording.",
    };
  if (lossDate < AMENDMENT_EFFECTIVE)
    return {
      kind: "cite",
      amount: 500,
      sources: ["H17-P2"],
      text: "The applicable base excess is £500.",
    };
  if (!amendmentAvailable)
    return {
      kind: "review",
      text: "The case manifest says endorsement E3 is required, but its text is unavailable. Refer for evidence review. No amount is stated.",
    };
  return {
    kind: "cite",
    amount: 750,
    sources: ["H17-P2", "E3-P1"],
    text: "The stated escape-of-water excess is £750. The base specifies £500, and E3 replaces it for losses from 1 April.",
  };
}
