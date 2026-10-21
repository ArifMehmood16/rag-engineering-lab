import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, MinusCircle, XCircle } from "lucide-react";
import { LAB_QUESTION, PASSAGES, type Passage } from "@/content/lesson-context";
import {
  runLab,
  type LabSettings,
  type RankedPassage,
  type RetrievalMode,
  CANDIDATES_PER_RETRIEVER,
} from "@/lib/retrieval";
import { cn } from "@/lib/utils";
import { Badge, SyntheticNotice, ToggleChip } from "./ui";

const MODES: { value: RetrievalMode; label: string; hint: string }[] = [
  { value: "keyword", label: "Keyword", hint: "Counts exact query words" },
  { value: "semantic", label: "Semantic", hint: "Curated toy similarity" },
  { value: "hybrid", label: "Hybrid (RRF)", hint: "Fuses both rankings" },
];

function QualifierRow({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="flex items-center gap-1 text-right">
        {value}
        {ok ? (
          <CheckCircle2 className="size-3.5 text-primary" aria-label="matches question" />
        ) : (
          <XCircle className="size-3.5 text-destructive" aria-label="does not match question" />
        )}
      </dd>
    </div>
  );
}

function Inspector({ item, passage }: { item: RankedPassage | undefined; passage: Passage }) {
  return (
    <aside
      aria-label="Evidence inspector"
      className="rounded-lg border border-border bg-card p-4 lg:sticky lg:top-6"
    >
      <p className="eyebrow">Evidence inspector</p>
      <h4 className="mt-1 font-serif text-lg">
        {passage.id} · {passage.title}
      </h4>
      <blockquote className="mt-2 border-l-2 border-border pl-3 font-serif text-sm italic">
        {passage.text}
      </blockquote>
      <dl className="mt-4 space-y-1.5 text-sm">
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">Synthetic document ID</dt>
          <dd className="font-mono text-xs">{passage.docId}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">Synthetic study ID</dt>
          <dd className="font-mono text-xs">{passage.studyId ?? "None (not a study)"}</dd>
        </div>
        <QualifierRow
          label="Population"
          value={passage.population}
          ok={passage.matches.population}
        />
        <QualifierRow
          label="Formulation"
          value={passage.formulation}
          ok={passage.matches.formulation}
        />
        <QualifierRow label="Outcome" value={passage.outcome} ok={passage.matches.outcome} />
        <QualifierRow
          label="Source type"
          value={passage.sourceType}
          ok={passage.sourceType !== "Commentary"}
        />
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">Version</dt>
          <dd className="font-mono text-xs">{passage.version}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">Locator</dt>
          <dd>{passage.locator}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">Estimated tokens</dt>
          <dd className="font-mono text-xs">{passage.tokens}</dd>
        </div>
      </dl>
      <div
        className={cn(
          "mt-4 rounded-md p-3 text-sm",
          !item
            ? "bg-muted"
            : item.decision.status === "selected"
              ? "bg-primary-soft"
              : "bg-destructive-soft",
        )}
      >
        <p className="font-semibold">
          {!item ? "Not retrieved" : item.decision.status === "selected" ? "Selected" : "Rejected"}
        </p>
        <p className="mt-0.5">
          {item
            ? item.decision.reason
            : `Did not reach the top ${CANDIDATES_PER_RETRIEVER} candidates of the active retriever(s).`}
        </p>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">{passage.lesson}</p>
    </aside>
  );
}

export function RetrievalLab() {
  const [settings, setSettings] = useState<LabSettings>({
    mode: "keyword",
    dedupe: false,
    rerank: false,
    budget: 1200,
  });
  const [inspect, setInspect] = useState("P1");
  const result = useMemo(() => runLab(PASSAGES, settings), [settings]);
  const set = <K extends keyof LabSettings>(k: K, v: LabSettings[K]) =>
    setSettings((s) => ({ ...s, [k]: v }));
  const inspected = PASSAGES.find((p) => p.id === inspect)!;
  const inspectedItem = result.candidates.find((c) => c.passage.id === inspect);
  const suff = result.sufficiency;

  return (
    <div className="space-y-5">
      <SyntheticNotice />
      <div className="rounded-lg border border-border bg-muted/60 p-4">
        <p className="eyebrow">Example question (not a medical claim)</p>
        <p className="mt-1 font-serif text-xl">“{LAB_QUESTION}”</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <fieldset>
          <legend className="text-sm font-semibold">Retrieval</legend>
          <div
            role="radiogroup"
            className="mt-2 grid grid-cols-3 gap-1 rounded-md border border-border bg-card p-1"
          >
            {MODES.map((m) => (
              <button
                key={m.value}
                type="button"
                role="radio"
                aria-checked={settings.mode === m.value}
                onClick={() => set("mode", m.value)}
                className={cn(
                  "rounded px-2 py-2 text-sm",
                  settings.mode === m.value
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted",
                )}
              >
                <span className="block font-medium">{m.label}</span>
                <span className="block text-[0.68rem] opacity-80">{m.hint}</span>
              </button>
            ))}
          </div>
          <label htmlFor="budget" className="mt-4 flex justify-between text-sm font-semibold">
            Context budget <span className="font-mono font-normal">{settings.budget} tokens</span>
          </label>
          <input
            id="budget"
            type="range"
            min={400}
            max={2400}
            step={100}
            value={settings.budget}
            onChange={(e) => set("budget", Number(e.target.value))}
            className="mt-2 w-full accent-[var(--color-primary)]"
          />
        </fieldset>
        <div className="grid gap-2">
          <ToggleChip
            label="Study deduplication"
            desc="Keep one passage per underlying study"
            pressed={settings.dedupe}
            onChange={(v) => set("dedupe", v)}
          />
          <ToggleChip
            label="Reranking"
            desc="Toy reranker rewarding qualifier matches; penalises commentary"
            pressed={settings.rerank}
            onChange={(v) => set("rerank", v)}
          />
        </div>
      </div>

      <ol
        aria-label="Pipeline counts"
        className="grid grid-cols-2 gap-2 text-center text-sm sm:grid-cols-4"
      >
        {[
          ["Candidates", result.stageCounts.retrieved],
          ["After dedup", settings.dedupe ? result.stageCounts.afterDedupe : "—"],
          ["Selected", result.stageCounts.selected],
          ["Tokens used", `${result.tokensUsed} / ${settings.budget}`],
        ].map(([k, v]) => (
          <li key={k} className="rounded-md border border-border bg-card p-2">
            <span className="block text-xs text-muted-foreground">{k}</span>
            <span className="font-mono">{v}</span>
          </li>
        ))}
      </ol>

      <div className="grid gap-5 lg:grid-cols-[1fr_20rem]">
        <div>
          <h4 className="text-sm font-semibold">Ranked candidates</h4>
          <ul className="mt-2 space-y-2">
            {result.candidates.map((c) => {
              const sel = c.decision.status === "selected";
              return (
                <li key={c.passage.id}>
                  <button
                    type="button"
                    onClick={() => setInspect(c.passage.id)}
                    aria-pressed={inspect === c.passage.id}
                    className={cn(
                      "w-full rounded-md border p-3 text-left text-sm transition-colors",
                      sel ? "border-primary/40 bg-card" : "border-dashed border-border bg-muted/40",
                      inspect === c.passage.id && "ring-2 ring-ring",
                    )}
                  >
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground">#{c.rank}</span>
                      <span className="font-semibold">{c.passage.id}</span>
                      <span>{c.passage.title}</span>
                      <Badge tone={sel ? "done" : "warn"} className="ml-auto">
                        {sel ? (
                          <CheckCircle2 className="size-3" aria-hidden />
                        ) : (
                          <MinusCircle className="size-3" aria-hidden />
                        )}
                        {sel ? "Selected" : "Rejected"}
                      </Badge>
                    </span>
                    <span className="mt-1 block font-mono text-[0.7rem] text-muted-foreground">
                      keyword hits {c.keywordScore} · toy similarity {c.semanticScore.toFixed(2)}
                      {c.fusionScore !== null && ` · RRF ${c.fusionScore.toFixed(4)}`}
                      {c.rerankScore !== null && ` · rerank ${c.rerankScore.toFixed(2)}`}
                    </span>
                    <span className="mt-1 block text-xs">{c.decision.reason}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          {result.notRetrieved.length > 0 && (
            <>
              <h4 className="mt-4 text-sm font-semibold">Not retrieved</h4>
              <div className="mt-2 flex flex-wrap gap-2">
                {result.notRetrieved.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setInspect(p.id)}
                    aria-pressed={inspect === p.id}
                    className={cn(
                      "rounded-md border border-dashed px-2 py-1 text-xs hover:bg-muted",
                      inspect === p.id && "ring-2 ring-ring",
                    )}
                  >
                    {p.id} · {p.title}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
        <Inspector item={inspectedItem} passage={inspected} />
      </div>

      <div
        role="status"
        className={cn(
          "rounded-lg border p-4",
          suff.level === "sufficient"
            ? "border-primary/40 bg-primary-soft"
            : suff.level === "partial"
              ? "border-accent/50 bg-accent-soft"
              : "border-destructive/40 bg-destructive-soft",
        )}
      >
        <p className="flex items-center gap-2 font-semibold">
          {suff.level === "sufficient" ? (
            <CheckCircle2 className="size-4" aria-hidden />
          ) : (
            <AlertTriangle className="size-4" aria-hidden />
          )}
          Toy sufficiency check:{" "}
          {suff.level === "sufficient"
            ? "covers distinct matching studies, including disagreement"
            : suff.level === "partial"
              ? "partial — the brief would need to say what is missing"
              : "evidence gap — no selected passage matches all qualifiers"}
        </p>
        <p className="mt-1 text-sm">
          Matching studies in context:{" "}
          {suff.matchingStudies.length ? suff.matchingStudies.join(", ") : "none"}. Conflicting
          finding included: {suff.includesContradiction ? "yes" : "no"}.
        </p>
        {suff.notes.length > 0 && (
          <ul className="mt-2 list-disc pl-5 text-sm">
            {suff.notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        )}
        <p className="mt-2 text-xs text-muted-foreground">
          Learning fixture. Not a measured project result. “Sufficient” here means the context could
          support a balanced brief — it says nothing about whether a generated answer would use it
          correctly.
        </p>
      </div>
    </div>
  );
}
