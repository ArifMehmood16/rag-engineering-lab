import { describe, it, expect } from "vitest";
import { APOLLO_RECORDS } from "@/content/apollo";
import { REQUEST_SCENARIOS } from "@/content/rag-scenarios";
import { scenarioSeed } from "@/lib/rag-scenarios";
import { buildStoryFrames, storyTour } from "@/lib/rag-scroll-story";
import { storyCards } from "@/lib/rag-gallery";
import { scenePlan } from "@/lib/rag-scene";

const run = (id: string) => buildStoryFrames(scenarioSeed(id, APOLLO_RECORDS), APOLLO_RECORDS);
describe("complete, isolated example journeys", () => {
  it("uses the large model for a multi-part question and the small one for a narrow question", () => {
    const large = run("large-answer").at(-1)!;
    expect(large.ctx.route).toBe("large");
    expect(large.ctx.released).toBeDefined();
    expect(large.ctx.usage.answerHit).toBe(false);
    expect(large.ctx.usage.generationCalls).toBe(1);
    const small = run("small-answer").at(-1)!;
    expect(small.ctx.route).toBe("small");
    expect(small.ctx.released).toBeDefined();
  });
  it("seeds only the explicit repeat example and bypasses unused work on a cache hit", () => {
    const frames = run("cache-hit"),
      last = frames.at(-1)!;
    expect(last.ctx.usage.answerHit).toBe(true);
    expect(last.ctx.usage.generationCalls).toBe(0);
    expect(last.ctx.usage.retrievalCalls).toBe(0);
    expect(last.ctx.released).toBeDefined();
    const stages = [
      ...new Set(
        storyCards("request", frames.length - 1, frames)
          .slice(1)
          .map((c) => c.stage),
      ),
    ];
    expect(stages).toEqual([0, 1, 2, 8, 9, 10]);
    expect(run("large-answer").at(-1)!.ctx.usage.answerHit).toBe(false);
  });
  it("uses a bounded tool to recover the missing passage and keeps the normal answer tool-free", () => {
    const tool = run("tool-read").at(-1)!;
    expect(tool.ctx.context).toContain("A11-LA-CAP");
    expect(tool.ctx.toolEvents.some((e) => e.stage === "Use" && e.detail.includes("Added"))).toBe(
      true,
    );
    expect(tool.ctx.released).toBeDefined();
    expect(run("large-answer").at(-1)!.ctx.toolEvents).toEqual([]);
  });
  it("returns safe terminal notices for rejected inputs, unsupported citations, and missing evidence", () => {
    for (const id of ["input-attack", "access-denied", "bad-citation", "evidence-gap"]) {
      const frames = run(id),
        last = frames.at(-1)!;
      expect(last.halted, id).toBe(true);
      expect(last.ctx.released, id).toBeUndefined();
      const cards = storyCards("request", frames.length - 1, frames);
      const end = cards.at(-1)!;
      expect(scenePlan(storyTour("request", end.stage, end.beat, frames)).transfer.to, id).toBe(
        "question",
      );
      if (id.startsWith("input") || id === "access-denied")
        expect(last.ctx.usage.generationCalls).toBe(0);
    }
  });
  it("never jumps to an unrelated object between consecutive operations or stages", () => {
    for (const example of REQUEST_SCENARIOS) {
      const frames = run(example.id),
        cards = storyCards("request", frames.length - 1, frames).slice(1);
      let at = "question";
      for (const card of cards) {
        const plan = scenePlan(storyTour("request", card.stage, card.beat, frames));
        const message = `${example.id}: ${card.stage}/${card.beat}`;
        if (card.kind === "output") expect(plan.transfer.to, message).toBe(at);
        else {
          expect(plan.transfer.from, message).toBe(at);
          if (card.kind === "work") at = plan.transfer.to;
        }
      }
      expect(at, example.id).toBe("question");
    }
  });
});
