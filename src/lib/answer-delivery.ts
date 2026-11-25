import { z } from "zod";
import {
  GENERATION_INSTRUCTION,
  sampleDraft,
  type AnswerCase,
  type DraftVariant,
} from "@/content/answer-delivery";
import { HANDLER_CASES, PASSAGES, type Passage, type SourceId } from "@/content/insurance";
import { operativeExcess } from "./excess";

type ReplyStatus = "answered" | "needs_input" | "needs_review" | "unavailable";
interface HandlerReply {
  status: ReplyStatus;
  message: string;
  sources: SourceId[];
}
interface ModelRequest {
  instruction: string;
  question: string;
  evidence: Pick<Passage, "id" | "location" | "excerpt" | "footnote">[];
}
interface AnswerTrace {
  question: string;
  prompt: ModelRequest | null;
  draft: string | null;
  checks: { label: string; pass: boolean; detail: string }[];
  reply: HandlerReply;
}
const answerSchema = z.strictObject({
  message: z.string().min(1),
  amountGBP: z.number().int().nonnegative(),
  sourceIds: z.array(z.string()).min(1),
});
const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export function answerTrace(
  caseId: AnswerCase,
  variant: DraftVariant,
  packed: readonly string[],
): AnswerTrace {
  const checks: AnswerTrace["checks"] = [];
  let question = "What excess applies to this escape-of-water loss?";
  let prompt: ModelRequest | null = null;
  let draft: string | null = null;
  function finish(status: ReplyStatus, message: string, sources: SourceId[] = []): AnswerTrace {
    return { question, prompt, draft, checks, reply: { status, message, sources } };
  }

  const authorised = caseId !== "DENIED";
  checks.push({
    label: "Case access",
    pass: authorised,
    detail: authorised
      ? "The simulated handler is authorised for H17. Every packed ID is resolved within that policy’s source list."
      : "The caller is outside the case scope. Stop before looking up text.",
  });
  if (!authorised)
    return finish(
      "unavailable",
      "This case is unavailable to you. Check the case selected in your workspace.",
    );

  const selected = HANDLER_CASES.find((entry) => entry.code === caseId)!;
  const decision = operativeExcess(selected);
  checks.push({
    label: "Loss date",
    pass: !!selected.lossDate,
    detail: selected.lossDate
      ? "Use the loss date to select the wording in force."
      : "The report date is known, but the date of the loss is missing.",
  });
  if (!selected.lossDate || decision.kind === "ask")
    return finish(
      "needs_input",
      "On what date did the escape of water happen? I need that date to check the applicable wording.",
    );
  question = `What is the escape-of-water excess for policy H17 for a loss on ${dateFormat.format(new Date(selected.lossDate + "T12:00:00Z"))}?`;

  const evidence: ModelRequest["evidence"] = [];
  for (const id of new Set(packed)) {
    const passage = PASSAGES.find((p) => p.id === id);
    if (!passage) continue;
    if (id === "E3-P1" && (decision.kind !== "cite" || !decision.sources.includes(id))) continue;
    const { location, excerpt, footnote } = passage;
    evidence.push({ id: passage.id, location, excerpt, ...(footnote && { footnote }) });
  }
  const complete =
    decision.kind === "cite" && decision.sources.every((id) => evidence.some((p) => p.id === id));
  checks.push({
    label: "Required evidence in context",
    pass: complete,
    detail: complete
      ? "The packed passages include the operative wording for this date."
      : "The case requires wording that is unavailable or missing from the packed context. Stop before generation.",
  });
  if (decision.kind !== "cite" || !complete)
    return finish(
      "needs_review",
      "I cannot verify the excess from the available wording. Please have a handler check the policy documents.",
    );

  prompt = { instruction: GENERATION_INSTRUCTION, question, evidence };
  draft = sampleDraft(caseId, variant);
  const held = () =>
    finish(
      "needs_review",
      "I couldn’t verify an answer to your question. Please have a handler check the wording before relying on an amount.",
    );
  checks.push({
    label: "Model response received",
    pass: draft !== null,
    detail:
      draft === null
        ? "The generation deadline expired. No complete draft arrived."
        : "The generator returned a payload. It still needs to pass parsing and validation.",
  });
  if (draft === null) return held();

  let payload: unknown;
  try {
    payload = JSON.parse(draft);
  } catch {
    payload = null;
  }
  const parsed = answerSchema.safeParse(payload);
  checks.push({
    label: "Response format",
    pass: parsed.success,
    detail: parsed.success
      ? "The response has a message, an integer amount in GBP and a list of source IDs."
      : "The draft does not parse as the required response object.",
  });
  if (!parsed.success) return held();
  const { message, amountGBP, sourceIds } = parsed.data;
  const citedPacked = sourceIds.every((id) => evidence.some((p) => p.id === id));
  const operativeCitations =
    citedPacked &&
    sourceIds.length === decision.sources.length &&
    decision.sources.every((id) => sourceIds.includes(id));
  checks.push({
    label: "Citation support",
    pass: operativeCitations,
    detail: !citedPacked
      ? "A citation points outside the supplied evidence."
      : operativeCitations
        ? "The citations point to the exact operative sources for this loss."
        : "The cited passage is in the prompt but does not establish the applicable excess.",
  });
  checks.push({
    label: "Amount against dated rule",
    pass: amountGBP === decision.amount,
    detail:
      amountGBP === decision.amount
        ? "The proposed amount matches the independently calculated excess."
        : "The proposed amount disagrees with the policy rule for the loss date.",
  });
  const hasEmail = /[^\s@]+@[^\s@]+\.[^\s@]+/.test(message);
  checks.push({
    label: "Contact detail in output",
    pass: !hasEmail,
    detail: hasEmail
      ? "This policy answer does not require an email address. Hold the draft."
      : "The message passes this exercise’s narrow check for email-shaped text.",
  });
  // This bounded lesson only releases reviewed wording for these two policy answers.
  const allowed =
    decision.amount === 750
      ? "The escape-of-water excess is £750. The endorsement applies to losses from 1 April 2026."
      : "The escape-of-water excess is £500 under the base schedule.";
  checks.push({
    label: "Claims in the message",
    pass: message === allowed,
    detail:
      message === allowed
        ? "Every sentence matches the reviewed wording for this outcome."
        : "The text introduces a claim or wording outside this case’s approved answer.",
  });
  return checks.every((check) => check.pass)
    ? finish("answered", message, decision.sources)
    : held();
}
