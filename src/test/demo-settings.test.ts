import { describe, expect, it } from "vitest";
import { topKSearch } from "@/lib/top-k-search";
import { AUTHORITY_RUNS, DESIGN_NOTES } from "@/content/agent-authority";

describe("shareable policy examples", () => {
  it("accepts the budget boundary and validated trace selectors", () => {
    const settings = { k: 4, budget: 0, ordering: "reranked", case: "EDGE", draft: "wrongAmount" };
    expect(topKSearch(settings)).toEqual(settings);
  });
  it("falls back for malformed controls including inherited property names", () => {
    const fallback = topKSearch({});
    expect(
      topKSearch({ k: 0, budget: -1, ordering: "unknown", case: [], draft: "constructor" }),
    ).toEqual(fallback);
    expect(topKSearch({ k: 5, budget: 401 })).toEqual(fallback);
  });
});

it("keeps the order fixed across the permission comparison and covers the five design principles", () => {
  expect(AUTHORITY_RUNS.broad.rows[0][1]).toContain("#1042");
  expect(AUTHORITY_RUNS.enforced.rows[0][1]).toContain("#1042");
  expect(AUTHORITY_RUNS.broad.outcome).toContain("address from the note");
  expect(AUTHORITY_RUNS.enforced.outcome).toContain("Internal pricing stays private");
  expect(DESIGN_NOTES.map((note) => note.id)).toEqual(["S", "O", "L", "I", "D"]);
});
