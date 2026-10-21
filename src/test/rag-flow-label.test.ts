import { describe, expect, it } from "vitest";
import { APOLLO_RECORDS, DEFAULT_QUESTION } from "@/content/apollo";
import { initEngine, toyEmbedding } from "@/lib/apollo-engine";
import { flowLabel } from "@/lib/rag-flow-label";
import { buildStoryFrames, storyTour } from "@/lib/rag-scroll-story";

describe("on-path data labels", () => {
  const frames = buildStoryFrames(initEngine(DEFAULT_QUESTION), APOLLO_RECORDS);
  const record = APOLLO_RECORDS.find((r) => r.id === "A11-LA-CAP")!;
  const label = (phase: "knowledge" | "request", stage: number, beat: number) =>
    flowLabel(storyTour(phase, stage, beat, frames), record, APOLLO_RECORDS);

  it("shows the selected passage's actual vector only at the output", () => {
    expect(label("knowledge", 2, 0).text).toContain(record.id);
    expect(label("knowledge", 2, 2).text).toBe("Count seven concept groups");
    expect(label("knowledge", 2, 4).text).toContain(
      toyEmbedding(record.text)
        .map((v) => v.toFixed(2))
        .join(" · "),
    );
  });
  it("uses real retrieval counts and does not imply a tool ran when disabled", () => {
    expect(label("request", 3, 0).text).toBe("This question + prepared knowledge index");
    expect(label("request", 3, 4).text).toBe(
      `${frames[4]!.ctx.retrieved.length} ranked passage IDs + scores`,
    );
    expect(label("request", 5, 1).text).toBe("Tool disabled · no external action");
    expect(label("request", 5, 4).text).toBe("No tool call · fixed workflow continues");
  });
  it("shows the real stopping result instead of a successful future output", () => {
    const failed = buildStoryFrames(initEngine(DEFAULT_QUESTION, { budget: 35 }), APOLLO_RECORDS);
    const stopped = flowLabel(storyTour("request", 6, 3, failed), record, APOLLO_RECORDS);
    expect(stopped.mode).toBe("output");
    expect(stopped.text).toBe("Returned to you: evidence gap");
    expect(stopped.text).not.toContain("Evidence covers");
  });
});
