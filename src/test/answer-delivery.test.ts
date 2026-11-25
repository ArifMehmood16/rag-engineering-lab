import { describe, expect, it } from "vitest";
import { answerTrace } from "@/lib/answer-delivery";
import { LAB_DEFAULT, runTopK } from "@/lib/topk";
import { passageById } from "@/content/insurance";

const packed = runTopK({ ...LAB_DEFAULT, ordering: "reranked" }).packed;

describe("from the augmented prompt to the handler’s reply", () => {
  it("puts only packed, permitted excerpts in the request, with the dated footnote, and delivers the checked draft", () => {
    const run = answerTrace("APR", "supported", [...packed, "H18-P1"]);
    expect(run.prompt?.evidence.map((p) => p.id)).toEqual(packed);
    expect(run.prompt?.evidence[0]?.footnote).toBe(passageById("E3-P1").footnote);
    expect(run.prompt?.question).toContain("3 April");
    expect(run.reply.status).toBe("answered");
    expect(run.reply.message).toBe(JSON.parse(run.draft!).message);
    expect(run.reply.message).toContain("£750");
    expect(run.reply.sources).toEqual(["H17-P2", "E3-P1"]);
    expect(run.checks.every((c) => c.pass)).toBe(true);
  });
  it("follows the applied lab result even when both passages were retrieved", () => {
    const run = answerTrace("APR", "supported", runTopK(LAB_DEFAULT).packed);
    expect(run.reply.status).toBe("needs_review");
    expect(run.draft).toBeNull();
    expect(run.prompt).toBeNull();
    expect(run.reply.message).not.toMatch(/£/);
  });
  it.each([
    ["UNKNOWN", "needs_input"],
    ["ABSENT", "needs_review"],
    ["DENIED", "unavailable"],
  ] as const)("stops before the model for %s", (caseId, status) => {
    const run = answerTrace(caseId, "supported", packed);
    expect(run.prompt).toBeNull();
    expect(run.draft).toBeNull();
    expect(run.reply).toMatchObject({ status, sources: [] });
    expect(run.reply.message).not.toMatch(/H17|E3|£/);
  });
  it.each([
    ["MAR", "£500", ["H17-P2"]],
    ["EDGE", "£750", ["H17-P2", "E3-P1"]],
  ] as const)(
    "uses the loss date and only operative evidence for %s",
    (caseId, amount, sources) => {
      const run = answerTrace(caseId, "supported", packed);
      expect(run.reply.message).toContain(amount);
      expect(run.reply.sources).toEqual(sources);
      expect(run.prompt?.evidence.map((p) => p.id).sort()).toEqual([...sources].sort());
    },
  );
  it.each(["wrongAmount", "wrongCitation", "extraPromise", "malformed", "timeout"] as const)(
    "holds the public response for %s without leaking draft text or source links",
    (variant) => {
      const run = answerTrace("APR", variant, packed);
      expect(run.prompt).not.toBeNull();
      expect(run.checks.some((c) => !c.pass)).toBe(true);
      expect(run.reply.status).toBe("needs_review");
      expect(run.reply.message).not.toMatch(/£|approved|H17|E3/i);
      expect(run.reply.sources).toEqual([]);
    },
  );
  it("rejects an irrelevant citation even if its passage fits the prompt", () => {
    const all = runTopK({ k: 4, budget: 500, ordering: "original" }).packed;
    const run = answerTrace("APR", "wrongCitation", all);
    expect(run.checks.find((c) => !c.pass)?.label).toMatch(/support/i);
    expect(run.reply.status).toBe("needs_review");
  });
});

it("shows a disclosure check for an example contact detail and keeps it out of the delivered reply", () => {
  const run = answerTrace("APR", "contactDetail", packed);
  expect(run.draft).toContain("example.org");
  expect(run.checks.find((check) => check.label === "Contact detail in output")?.pass).toBe(false);
  expect(run.reply.status).toBe("needs_review");
  expect(JSON.stringify(run.reply)).not.toMatch(/example\.org|£/);
});
