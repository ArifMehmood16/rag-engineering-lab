import { AnswerWalkthrough } from "@/components/learn/AnswerWalkthrough";
import { demoHead } from "@/lib/demo-head";
import { DemoPage } from "@/components/learn/DemoPage";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { TOP_K_DEMO, passageById, REQUIRED_IDS, type SourceId } from "@/content/insurance";
import { LAB_DEFAULT, runTopK, type LabInput, type LabResult, type Ordering } from "@/lib/topk";
import { topKSearch, type TopKSearch } from "@/lib/top-k-search";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/demos/top-k")({
  validateSearch: topKSearch,
  head: () => demoHead(TOP_K_DEMO.title, TOP_K_DEMO.description),
  component: Lab,
});

const same = (a: LabInput, b: LabInput) =>
  a.k === b.k && a.ordering === b.ordering && a.budget === b.budget;

function IdList({ title, ids, testid }: { title: string; ids: SourceId[]; testid: string }) {
  return (
    <div className="rounded-sm border bg-card p-3">
      <p className="eyebrow mb-2">{title}</p>
      {ids.length === 0 ? (
        <p className="text-sm text-muted-foreground">None</p>
      ) : (
        <ol className="space-y-1" data-testid={testid}>
          {ids.map((id) => (
            <li key={id} className="flex items-baseline justify-between gap-2 tabular-nums text-sm">
              <span className={cn(REQUIRED_IDS.includes(id) && "text-primary")}>
                {id}
                {REQUIRED_IDS.includes(id) && <span className="sr-only"> (required)</span>}
              </span>
              <span className="text-muted-foreground">{passageById(id).tokens}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function Lab() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const applied: LabInput = {
    k: search.k ?? LAB_DEFAULT.k,
    budget: search.budget ?? LAB_DEFAULT.budget,
    ordering: search.ordering ?? LAB_DEFAULT.ordering,
  };
  const result = runTopK(applied);
  const [initial] = useState(applied);
  const update = (patch: TopKSearch) => {
    void navigate({
      search: (prev) => ({ ...prev, ...patch }),
      hash: true,
      resetScroll: false,
      hashScrollIntoView: false,
    });
  };
  return (
    <DemoPage lesson="context" title={TOP_K_DEMO.title} intro={TOP_K_DEMO.intro}>
      <Workbench key={JSON.stringify(applied)} result={result} initial={initial} onApply={update} />
      <AnswerWalkthrough
        packed={result.packed}
        caseId={search.case ?? "APR"}
        variant={search.draft ?? "supported"}
        onChange={update}
      />
    </DemoPage>
  );
}

function Workbench({
  result: r,
  initial,
  onApply,
}: {
  result: LabResult;
  initial: LabInput;
  onApply: (input: LabInput) => void;
}) {
  const applied = r.input;
  const [draft, setDraft] = useState(applied);
  const stale = !same(draft, applied);
  return (
    <div className="grid gap-8 xl:grid-cols-[15rem_minmax(0,1fr)]">
      <form
        className="space-y-6 rounded-sm border p-5"
        onSubmit={(e) => {
          e.preventDefault();
          onApply(draft);
        }}
        aria-label="Lab controls"
      >
        <div>
          <label htmlFor="k" className="flex justify-between text-sm">
            <span>Candidate K</span>
            <span className="tabular-nums">{draft.k}</span>
          </label>
          <input
            id="k"
            type="range"
            min={1}
            max={4}
            step={1}
            value={draft.k}
            onChange={(e) => setDraft({ ...draft, k: Number(e.target.value) })}
            className="mt-2 w-full accent-primary"
          />
        </div>
        <fieldset>
          <legend className="text-sm">Ordering before packing</legend>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {(["original", "reranked"] as Ordering[]).map((o) => (
              <label
                key={o}
                className={cn(
                  "flex min-h-11 cursor-pointer items-center justify-center rounded-sm border text-sm capitalize has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring",
                  draft.ordering === o && "border-primary bg-primary text-primary-foreground",
                )}
              >
                <input
                  type="radio"
                  name="ordering"
                  value={o}
                  checked={draft.ordering === o}
                  onChange={() => setDraft({ ...draft, ordering: o })}
                  className="sr-only"
                />
                {o}
              </label>
            ))}
          </div>
        </fieldset>
        <div>
          <label htmlFor="budget" className="text-sm">
            Token budget
          </label>
          <input
            id="budget"
            type="number"
            min={0}
            max={400}
            step={10}
            value={draft.budget}
            onChange={(e) =>
              setDraft({
                ...draft,
                budget: Math.max(0, Math.min(400, Number(e.target.value) || 0)),
              })
            }
            className="mt-1 block min-h-11 w-full rounded-sm border bg-card px-3 tabular-nums"
          />
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            className="min-h-11 flex-1 rounded-sm bg-primary px-4 text-primary-foreground"
          >
            Apply
          </button>
          <button
            type="button"
            onClick={() => {
              setDraft(initial);
              onApply(initial);
            }}
            className="min-h-11 rounded-sm border px-3 text-sm"
          >
            Reset this lab
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          Simulated ranking of four eligible passages. Whole-passage greedy packing skips any
          passage that does not fit.
        </p>
      </form>

      <section
        aria-live="polite"
        aria-label="Lab result"
        data-testid="lab-result"
        className={cn(stale && "opacity-60")}
      >
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <p className="eyebrow">
            {stale ? "Previous result — press Apply to run your new settings" : "Current result"}
          </p>
          <p className="tabular-nums text-xs text-muted-foreground">
            K={r.input.k} · {r.input.ordering} · budget {r.input.budget}
          </p>
        </div>

        <div
          className={cn(
            "mb-5 rounded-sm border-l-4 p-4",
            r.decision.kind === "cite"
              ? "border-primary bg-primary-soft"
              : "border-accent bg-accent-soft",
          )}
          data-testid="lab-decision"
        >
          {r.decision.kind === "cite" ? (
            <>
              <p className="eyebrow">April case · cite</p>
              <p className="mt-1 text-xl">Excess £750 — cites H17-P2 and E3-P1</p>
            </>
          ) : (
            <>
              <p className="eyebrow">April case · route to review</p>
              <ul className="mt-1 list-disc pl-5">
                {r.decision.reasons.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
              <p className="mt-1 text-sm text-muted-foreground">
                No amount is quoted without both required sources in context.
              </p>
            </>
          )}
        </div>

        <a
          href="#answer-delivery"
          className="text-primary underline underline-offset-4 mb-4 inline-flex min-h-11 items-center"
        >
          See the prompt, guardrails and handler’s reply for this run
        </a>
        <dl className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ["Candidate recall", `${r.recall[0]}/${r.recall[1]}`],
            ["Precision", `${r.precision[0]}/${r.precision[1]}`],
            ["Packed coverage", `${r.coverage[0]}/${r.coverage[1]}`],
            ["Tokens used", `${r.tokensUsed} / ${r.input.budget}`],
          ].map(([k, v]) => (
            <div key={k} className="rounded-sm border p-3">
              <dt className="eyebrow">{k}</dt>
              <dd className="tabular-nums mt-1 text-2xl" data-testid={`m-${k}`}>
                {v}
              </dd>
            </div>
          ))}
        </dl>

        <div className="grid gap-3 md:grid-cols-3">
          <IdList title="Retrieved (first K)" ids={r.candidates} testid="retrieved" />
          <IdList
            title={r.input.ordering === "reranked" ? "Reranked order" : "Packing order (original)"}
            ids={r.ordered}
            testid="ordered"
          />
          <IdList title="Packed context" ids={r.packed} testid="packed" />
        </div>
        <div className="mt-3 rounded-sm border p-3">
          <p className="eyebrow mb-2">Excluded, with reasons</p>
          {r.excluded.length === 0 ? (
            <p className="text-sm text-muted-foreground">None</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {r.excluded.map((e) => (
                <li key={e.id}>
                  <span className="tabular-nums">{e.id}</span> — {e.reason}
                </li>
              ))}
            </ul>
          )}
        </div>

        <details className="mt-5 rounded-sm border p-4">
          <summary className="cursor-pointer">
            Why reranking helps here — and when it cannot
          </summary>
          <p className="mt-2 text-sm leading-relaxed">
            At K=3 both required passages are candidates, but original order spends 200 of 220
            tokens on the base and an unrelated roof clause. Reordering the same candidates puts
            E3-P1 and H17-P2 first (190 tokens). A reranker only reorders what retrieval returned:
            at K=2, E3-P1 is never a candidate, so no ordering recovers it. If a required source is
            missing, the question goes to review.
          </p>
        </details>
      </section>
    </div>
  );
}
