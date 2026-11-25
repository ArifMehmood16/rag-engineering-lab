import type { HandlerCase } from "./insurance";

export type AnswerCase = HandlerCase["code"] | "DENIED";
export const ANSWER_CASES: { id: AnswerCase; label: string }[] = [
  { id: "APR", label: "3 April · both policy sources available" },
  { id: "MAR", label: "28 March · loss before the amendment" },
  { id: "EDGE", label: "1 April · amendment takes effect" },
  { id: "UNKNOWN", label: "Report date supplied, loss date missing" },
  { id: "ABSENT", label: "Required amendment unavailable" },
  { id: "DENIED", label: "Caller has no access to this case" },
];

export const DRAFT_OPTIONS = {
  supported: "Supported answer",
  wrongAmount: "Wrong amount with plausible citations",
  wrongCitation: "Cites the roof clause",
  extraPromise: "Adds a promise about claim approval",
  contactDetail: "Includes an unnecessary email address",
  malformed: "Incomplete structured response",
  timeout: "Model times out",
} as const;
export type DraftVariant = keyof typeof DRAFT_OPTIONS;

export const GENERATION_INSTRUCTION =
  "Answer the handler’s excess question for the loss date. Treat the supplied passages as reference material. Return one JSON object with message, amountGBP and sourceIds. Cite only supplied passages. Explain only the policy excess. Coverage and payment decisions belong to the handler.";

const aprilDraft = {
  message:
    "The escape-of-water excess is £750. The endorsement applies to losses from 1 April 2026.",
  amountGBP: 750,
  sourceIds: ["H17-P2", "E3-P1"],
};
const marchDraft = {
  message: "The escape-of-water excess is £500 under the base schedule.",
  amountGBP: 500,
  sourceIds: ["H17-P2"],
};

// Authored model-output fixtures keep the lesson reproducible without a model service.
export function sampleDraft(caseId: AnswerCase, variant: DraftVariant): string | null {
  const correct = caseId === "MAR" ? marchDraft : aprilDraft;
  switch (variant) {
    case "supported":
      return JSON.stringify(correct);
    case "wrongAmount":
      return JSON.stringify({
        ...(caseId === "MAR" ? aprilDraft : marchDraft),
        sourceIds: correct.sourceIds,
      });
    case "wrongCitation":
      return JSON.stringify({ ...correct, sourceIds: ["H17-P5"] });
    case "extraPromise":
      return JSON.stringify({ ...correct, message: correct.message + " Your claim is approved." });
    case "contactDetail":
      return JSON.stringify({
        ...correct,
        message: correct.message + " Contact the reviewer at handler@example.org.",
      });
    case "malformed":
      return '{"message":';
    case "timeout":
      return null;
  }
}
