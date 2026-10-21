import { describe, expect, it } from "vitest";
import { galleryScrollTarget, gallerySelection, storyCards } from "@/lib/rag-gallery";

describe("the vertical learning gallery", () => {
  const cards = storyCards("knowledge", 4);
  const centers = cards.map((_, i) => 250 + i * 300);
  it("lays out the full explanation in reading order, beginning with an interaction guide", () => {
    expect(cards).toHaveLength(21);
    expect(cards[0]!.kind).toBe("intro");
    expect(cards.slice(1, 6).map((c) => c.kind)).toEqual([
      "input",
      "work",
      "work",
      "work",
      "output",
    ]);
    expect(new Set(cards.map((c) => c.id)).size).toBe(cards.length);
    expect(storyCards("request", 7)).toHaveLength(33);
    expect(storyCards("request", 7).at(-1)).toMatchObject({ stage: 6, kind: "output" });
  });
  it("holds input and output cards and continuously scrubs the intervening operations", () => {
    expect(gallerySelection(cards, centers, 300, 500).transfer).toBe(0);
    expect(gallerySelection(cards, centers, 1500, 500).transfer).toBe(1);
    const before = gallerySelection(cards, centers, 749.99, 500);
    const after = gallerySelection(cards, centers, 750.01, 500);
    expect(cards[before.index]!.beat).toBe(1);
    expect(cards[after.index]!.beat).toBe(2);
    expect(after.transfer - before.transfer).toBeLessThan(0.001);
    expect(gallerySelection(cards, centers, 600, 500).index).toBe(2);
  });
  it("restores the same centred card after its column and card sizes change", () => {
    const place = gallerySelection(cards, centers, 975, 500);
    const resized = centers.map((c) => c * 1.3);
    const restored = gallerySelection(
      cards,
      resized,
      galleryScrollTarget(place, resized, 700),
      700,
    );
    expect(restored.index).toBe(place.index);
    expect(restored.offset).toBeCloseTo(place.offset);
    expect(restored.transfer).toBeCloseTo(place.transfer);
    expect(galleryScrollTarget({ index: 0, offset: -1 }, centers, 500)).toBe(0);
  });
});
