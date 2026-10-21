import { describe, expect, it } from "vitest";
import { BASE_STAGES, OVERLAYS } from "@/content/architecture";
import { LESSONS } from "@/content/lessons";
import { ALL_TAKEAWAYS } from "@/content/writing";
import { buildFlow, OUTLINE_LABELS, outlineToMarkdown } from "@/lib/architecture";

const all = OVERLAYS.map((o) => o.id);
const ids = (on = all) => buildFlow(on).map((s) => s.id);

describe("architecture map", () => {
  it("default view is the planned workflow only", () => {
    expect(ids([])).toEqual(BASE_STAGES.map((s) => s.id));
    expect(buildFlow([]).every((s) => s.status === "planned")).toBe(true);
  });
  it("auth precedes every cache and retrieval", () => {
    const f = ids();
    for (const id of ["answer-cache", "retrieval-cache", "retrieve"])
      expect(f.indexOf("auth")).toBeLessThan(f.indexOf(id));
  });
  it("routing and tool calls are followed by verification and release", () => {
    const f = ids();
    expect(f.indexOf("route")).toBeLessThan(f.indexOf("verify"));
    expect(f.indexOf("tool")).toBeLessThan(f.indexOf("verify"));
    expect(f.indexOf("verify")).toBeLessThan(f.indexOf("release"));
  });
  it("evaluation is not inserted as a request stage", () =>
    expect(ids(["evaluation"])).toEqual(ids([])));
});

describe("writing outlines", () => {
  it("every lesson has a six-part outline in the brief's structure", () => {
    expect(ALL_TAKEAWAYS.map((t) => t.slug)).toEqual(LESSONS.map((l) => l.slug));
    for (const t of ALL_TAKEAWAYS)
      expect(t.data.outline.map((o) => o.label)).toEqual(OUTLINE_LABELS);
  });
  it("Markdown export includes the topic and numbered outline", () => {
    const md = outlineToMarkdown(ALL_TAKEAWAYS[0]!.data);
    expect(md).toContain("# Why retrieval similarity is not answer confidence");
    expect(md).toContain("1. **The misconception**");
  });
});
