// Deterministic local execution engine for the Apollo 11 lab experiment.
// No model runs: "generation" fills a fixed template from verified facets.
import type { EvidenceRecord } from "@/content/apollo";

export const ENGINE_STAGES = [
  { id: "question", name: "Question" },
  { id: "request", name: "Request checks" },
  { id: "retrieve", name: "Retrieval" },
  { id: "assemble", name: "Context assembly" },
  { id: "sufficiency", name: "Sufficiency" },
  { id: "draft", name: "Draft generation" },
  { id: "verify", name: "Citation & support checks" },
  { id: "eligibility", name: "Current eligibility" },
  { id: "release", name: "Release" },
] as const;

export type StageStatus = "idle" | "done" | "blocked";
export interface StageResult {
  status: Exclude<StageStatus, "idle">;
  input: string[];
  output: string[];
  note?: string;
}
export interface Claim {
  id: string;
  text: string;
  cites: string[];
  supportTerms: string[][]; // each group: at least one term must appear in cited text
}
export interface Ctx {
  question: string;
  scope: string;
  retrieved: { id: string; score: number }[];
  context: string[];
  excluded: { id: string; reason: string }[];
  facets: Record<string, string[]>;
  claims: Claim[];
  verified: string[];
  released?: { answer: string; claims: Claim[] };
}
export interface EngineState {
  cursor: number; // index of last completed stage, -1 = not started
  ctx: Ctx;
  results: StageResult[];
  halted: boolean;
}

const STOP = new Set([
  "who",
  "the",
  "during",
  "and",
  "in",
  "on",
  "did",
  "a",
  "of",
  "to",
  "was",
  "were",
]);
// Explicit, documented query expansion (not learned).
const EXPAND: Record<string, string[]> = {
  walked: ["stepped", "landed", "surface"],
  moon: ["moon’s", "moon's", "lunar"],
  remained: ["orbited", "orbit", "piloted"],
  lunar: ["moon"],
  orbit: ["orbited", "csm", "command"],
};
const tokens = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9’' ]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
const est = (s: string) => Math.ceil(tokens(s).length * 1.3);
const INJECTION = /ignore (all )?previous instructions/i;
const CONTEXT_BUDGET = 260;

export function queryTerms(q: string): string[] {
  const base = tokens(q).filter((t) => !STOP.has(t) && t !== "apollo" && t !== "11");
  return [...new Set(base.flatMap((t) => [t, ...(EXPAND[t] ?? [])]))];
}

export function initEngine(question: string): EngineState {
  return {
    cursor: -1,
    halted: false,
    results: [],
    ctx: {
      question,
      scope: "corpus:apollo-public",
      retrieved: [],
      context: [],
      excluded: [],
      facets: {},
      claims: [],
      verified: [],
    },
  };
}

const FACETS: Record<string, { label: string; all: string[][] }> = {
  moonwalkers: {
    label: "Who walked on the Moon",
    all: [["armstrong"], ["aldrin"], ["stepped", "landed", "surface"]],
  },
  orbiter: { label: "Who remained in lunar orbit", all: [["collins"], ["orbited", "orbit"]] },
  craft: { label: "Orbiting spacecraft name", all: [["columbia"], ["csm", "command"]] },
};

export function advance(s: EngineState, records: EvidenceRecord[]): EngineState {
  if (s.halted || s.cursor >= ENGINE_STAGES.length - 1) return s;
  const i = s.cursor + 1;
  const ctx: Ctx = structuredClone(s.ctx);
  const byId = (id: string) => records.find((r) => r.id === id)!;
  let r: StageResult;
  switch (ENGINE_STAGES[i]!.id) {
    case "question":
      r = {
        status: "done",
        input: ["(visitor selection — preset)"],
        output: [`"${ctx.question}"`],
      };
      break;
    case "request": {
      const ok =
        ctx.question.length > 5 && ctx.question.length < 300 && !INJECTION.test(ctx.question);
      r = ok
        ? {
            status: "done",
            input: [`question (${ctx.question.length} chars)`],
            output: [
              "Length within limit",
              "No instruction-override pattern in question",
              `Scope resolved by application: ${ctx.scope}`,
            ],
          }
        : { status: "blocked", input: [ctx.question], output: ["Request rejected"] };
      break;
    }
    case "retrieve": {
      const terms = queryTerms(ctx.question);
      const scored = records
        .map((rec) => {
          const t = new Set(tokens(rec.text));
          return { id: rec.id, score: terms.filter((x) => t.has(x)).length };
        })
        .filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))
        .slice(0, 10);
      ctx.retrieved = scored;
      r = {
        status: "done",
        input: [`terms: ${terms.join(", ")}`, "k = 10, lexical overlap"],
        output: scored.map((x) => `${x.id} · score ${x.score}`),
      };
      break;
    }
    case "assemble": {
      let used = 0;
      for (const { id } of ctx.retrieved) {
        const rec = byId(id);
        if (rec.eligibility !== "eligible")
          ctx.excluded.push({ id, reason: `not eligible (${rec.eligibility})` });
        else if (INJECTION.test(rec.text))
          ctx.excluded.push({
            id,
            reason: "contains embedded instructions — kept as data, not used as evidence",
          });
        else if (
          ctx.context.some(
            (c) =>
              byId(c).source.url === rec.source.url &&
              tokens(byId(c).text).join(" ").includes(tokens(rec.text).slice(0, 8).join(" ")),
          )
        )
          ctx.excluded.push({ id, reason: "duplicate of a longer passage from the same source" });
        else if (used + est(rec.text) > CONTEXT_BUDGET)
          ctx.excluded.push({ id, reason: "over context budget" });
        else {
          ctx.context.push(id);
          used += est(rec.text);
        }
      }
      // Also admit records not retrieved? No — assembly only uses retrieved candidates.
      r = {
        status: "done",
        input: [`${ctx.retrieved.length} candidates`, `budget ≈ ${CONTEXT_BUDGET} tokens`],
        output: [
          ...ctx.context.map((id) => `kept ${id}`),
          ...ctx.excluded.map((e) => `excluded ${e.id}: ${e.reason}`),
          `≈ ${used} tokens used`,
        ],
      };
      break;
    }
    case "sufficiency": {
      const out: string[] = [];
      for (const [k, f] of Object.entries(FACETS)) {
        // A facet is supported when the union of kept passages covers every term group,
        // using passages that each mention at least the facet's first term.
        const recs = ctx.context.filter(
          (id) =>
            f.all[0]!.some((t) => tokens(byId(id).text).includes(t)) ||
            f.all.slice(1).some((g) => g.some((t) => tokens(byId(id).text).includes(t))),
        );
        const covered = f.all.every((g) =>
          recs.some((id) => g.some((t) => tokens(byId(id).text).includes(t))),
        );
        ctx.facets[k] = covered
          ? recs.filter((id) => f.all.some((g) => g.some((t) => tokens(byId(id).text).includes(t))))
          : [];
        out.push(`${f.label}: ${covered ? "supported" : "MISSING"}`);
      }
      const all = Object.values(ctx.facets).every((v) => v.length);
      r = {
        status: all ? "done" : "blocked",
        input: [`${ctx.context.length} kept passages`, `facets: ${Object.keys(FACETS).join(", ")}`],
        output: [...out, all ? "Decision: sufficient" : "Decision: evidence gap"],
      };
      break;
    }
    case "draft": {
      const has = (id: string, ...all: string[]) =>
        all.every((p) => byId(id).text.toLowerCase().includes(p));
      const uniq = (a: string[]) => [...new Set(a)];
      const walkers = ctx.facets["moonwalkers"]!.filter(
        (id) =>
          has(id, "armstrong", "aldrin") ||
          (has(id, "armstrong") && has(id, "stepped onto the moon")),
      );
      const orbit = ctx.facets["orbiter"]!.filter(
        (id) => has(id, "collins") && (has(id, "orbited") || has(id, "lunar orbit")),
      );
      const craft = uniq([
        ...ctx.facets["craft"]!.filter((id) => has(id, "csm, columbia")),
        ...orbit.filter((id) => has(id, "csm piloted by collins")),
      ]);
      ctx.claims = [
        {
          id: "C1",
          text: "Neil Armstrong and Buzz Aldrin walked on the Moon.",
          cites: uniq(walkers.filter((id) => has(id, "moon"))),
          supportTerms: [["armstrong"], ["aldrin"], ["stepped", "landed"]],
        },
        {
          id: "C2",
          text: "Michael Collins remained in lunar orbit.",
          cites: uniq(orbit),
          supportTerms: [["collins"], ["orbited", "orbit"]],
        },
        {
          id: "C3",
          text: "He was aboard the command and service module Columbia.",
          cites: craft,
          supportTerms: [["columbia"], ["collins"], ["csm", "command"]],
        },
      ];
      r = {
        status: "done",
        input: ["Verified facets + kept passage IDs", "Fixture template (no model)"],
        output: ctx.claims.map((c) => `${c.id}: ${c.text} [${c.cites.join(", ")}]`),
        note: "Generation is fixture-based; no real model is running.",
      };
      break;
    }
    case "verify": {
      const out: string[] = [];
      let ok = true;
      for (const c of ctx.claims) {
        const resolves = c.cites.length > 0 && c.cites.every((id) => ctx.context.includes(id));
        const text = new Set(c.cites.flatMap((id) => tokens(byId(id).text)));
        const supported = c.supportTerms.every((g) => g.some((t) => text.has(t)));
        if (resolves && supported) ctx.verified.push(c.id);
        else ok = false;
        out.push(
          `${c.id}: citations ${resolves ? "resolve" : "DO NOT resolve"} · support ${supported ? "found" : "MISSING"}`,
        );
      }
      r = {
        status: ok ? "done" : "blocked",
        input: [`${ctx.claims.length} claims`, "server-held context IDs"],
        output: out,
      };
      break;
    }
    case "eligibility": {
      const cited = [...new Set(ctx.claims.flatMap((c) => c.cites))];
      const bad = cited.filter((id) => byId(id).eligibility !== "eligible");
      r = {
        status: bad.length ? "blocked" : "done",
        input: [`${cited.length} cited records`, "current registry"],
        output: cited.map((id) => `${id}: ${byId(id).eligibility} · ${byId(id).version}`),
      };
      break;
    }
    default: {
      const answer =
        "Neil Armstrong and Buzz Aldrin walked on the Moon. Michael Collins remained in lunar orbit aboard the command and service module Columbia.";
      ctx.released = { answer, claims: ctx.claims };
      r = {
        status: "done",
        input: [`${ctx.verified.length} verified claims`],
        output: ["Released: supported answer", answer],
      };
    }
  }
  return { cursor: i, ctx, results: [...s.results, r], halted: r.status === "blocked" };
}

export function runAll(question: string, records: EvidenceRecord[]): EngineState {
  let s = initEngine(question);
  for (let n = 0; n < ENGINE_STAGES.length; n++) s = advance(s, records);
  return s;
}
