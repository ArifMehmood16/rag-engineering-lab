import { useMemo, useState } from "react";
import { CheckCircle2, ServerCrash, XCircle } from "lucide-react";
import { EVAL_QUESTIONS, FAILURES, JUDGE_JSON_LABEL } from "@/content/lesson-eval";
import { LABELLED, judgeClaim, runEvaluation, type FailureKey, type Metric, type Outcome } from "@/lib/evaluation";
import { cn } from "@/lib/utils";
import { Badge, SyntheticNotice, ToggleChip } from "./ui";

const OUTCOME: Record<Outcome, { label: string; tone: "done" | "warn" | "planned" | "neutral" }> = {
  supported: { label: "Supported, complete answer", tone: "done" },
  defective: { label: "Answer with defects", tone: "warn" },
  falseAbstention: { label: "False abstention", tone: "warn" },
  correctAbstention: { label: "Correct abstention (evidence gap)", tone: "done" },
  infraError: { label: "Infrastructure error — not scored for quality", tone: "planned" },
};

const fmt = (m: Metric) => (m.value === null ? "n/a" : m.value.toFixed(2));

export function EvalLab() {
  const [failures, setFailures] = useState<FailureKey[]>([]);
  const run = useMemo(() => runEvaluation(failures), [failures]);
  const base = useMemo(() => runEvaluation([]), []);
  const toggle = (k: FailureKey) => setFailures((f) => (f.includes(k) ? f.filter((x) => x !== k) : [...f, k]));
  const retrievedIds = new Set(run.retrieved.map((e) => e.id));
  const judged = run.claims.find((c) => c.issue) ?? run.claims[0];

  return (
    <div className="space-y-5">
      <SyntheticNotice>Learning fixture. Not a measured project result. Two synthetic questions; every number below is computed from them.</SyntheticNotice>

      <div className="grid gap-2 sm:grid-cols-2">
        {EVAL_QUESTIONS.map((q) => (
          <div key={q.id} className="rounded-lg border border-border bg-muted/60 p-3 text-sm">
            <p className="flex items-center justify-between gap-2">
              <span className="font-mono text-xs">{q.id}</span>
              <Badge tone={OUTCOME[q.id === "Q1" ? run.q1Outcome : run.q2Outcome].tone}>{OUTCOME[q.id === "Q1" ? run.q1Outcome : run.q2Outcome].label}</Badge>
            </p>
            <p className="mt-1 font-serif text-base">“{q.text}”</p>
            <p className="mt-1 text-xs text-muted-foreground">Expected answerability: {q.answerability}</p>
          </div>
        ))}
      </div>

      <fieldset>
        <legend className="text-sm font-semibold">Introduce failures (combine freely)</legend>
        <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
          {FAILURES.map((f) => (
            <ToggleChip key={f.key} label={f.label} desc={`Stage: ${f.stage}`} pressed={failures.includes(f.key)} onChange={() => toggle(f.key)} />
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-3">
          <p className="eyebrow">Q1 · Labelled evidence → retrieved (top 5)</p>
          <ul className="mt-2 space-y-1 text-sm">
            {LABELLED.map((e) => (
              <li key={e.id} className="flex items-start gap-2">
                {retrievedIds.has(e.id) ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" aria-label="retrieved" /> : <XCircle className="mt-0.5 size-4 shrink-0 text-destructive" aria-label="missed" />}
                <span><span className="font-mono text-xs">{e.id}</span> (grade {e.grade}) {e.summary}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted-foreground">Retrieved order: {run.retrieved.map((e) => `${e.id}(${e.grade})`).join(" → ")}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3">
          <p className="eyebrow">Selected context</p>
          <ul className="mt-2 space-y-1 text-sm">
            {run.context.map((c) => (
              <li key={c.id} className={cn("rounded border px-2 py-1", c.note.startsWith("Population") ? "border-destructive/40 bg-destructive-soft" : "border-border")}>
                <span className="font-mono text-xs">{c.id}</span> · {c.note}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg border border-border bg-card p-3">
          <p className="eyebrow">Generated claims and citation links</p>
          {run.q1Outcome === "falseAbstention" ? (
            <p className="mt-2 text-sm">“There is not enough evidence to answer.” — although the evidence was sufficient.</p>
          ) : (
            <ul className="mt-2 space-y-2 text-sm">
              {run.claims.map((c) => (
                <li key={c.id} className={cn("rounded border px-2 py-1.5", c.issue ? "border-destructive/40 bg-destructive-soft" : "border-border")}>
                  <span className="font-mono text-xs">{c.id}</span> {c.text}
                  <span className="mt-1 flex flex-wrap gap-1">
                    {c.cites.length === 0 && <Badge tone="warn">no citation</Badge>}
                    {c.cites.map((id) => (
                      <Badge key={id} tone={c.supportedBy.includes(id) && c.contentSupported ? "done" : "warn"}>
                        [{id}] {c.supportedBy.includes(id) && c.contentSupported ? "supports" : "does not support"}
                      </Badge>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full min-w-[40rem] text-left text-sm">
          <caption className="sr-only">Metrics computed from the synthetic fixture</caption>
          <thead className="border-b border-border bg-muted">
            <tr>
              <th className="px-3 py-2">Metric</th>
              <th className="px-3 py-2">Stage</th>
              <th className="px-3 py-2">Numerator / denominator</th>
              <th className="px-3 py-2">Value</th>
              <th className="px-3 py-2">vs baseline</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {run.metrics.map((m, i) => {
              const b = base.metrics[i]!;
              const changed = fmt(m) !== fmt(b) || m.ratio?.den !== b.ratio?.den;
              return (
                <tr key={m.key} className={cn(changed && "bg-accent-soft")}>
                  <td className="px-3 py-2 font-medium">{m.name}</td>
                  <td className="px-3 py-2 text-muted-foreground">{m.stage}</td>
                  <td className="px-3 py-2 font-mono text-xs">
                    {m.ratio ? `${m.ratio.num} / ${m.ratio.den}` : "graded"} <span className="font-sans text-muted-foreground">{m.denominatorNote}</span>
                  </td>
                  <td className="px-3 py-2 font-mono">{fmt(m)}</td>
                  <td className="px-3 py-2">{changed ? <Badge tone="planned">Changed from {fmt(b)}</Badge> : <span className="text-xs text-muted-foreground">unchanged</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {failures.includes("outage") && (
        <p className="flex items-start gap-2 rounded-md border border-accent/50 bg-accent-soft p-3 text-sm" role="status">
          <ServerCrash className="mt-0.5 size-4 shrink-0" aria-hidden />
          Q2 returned no answer because of an outage. It is counted only in the infrastructure error rate, so the correct-abstention denominator drops to 0 — it is not credited as an evidence gap.
        </p>
      )}

      {judged && (
        <div>
          <p className="text-sm font-semibold">Judge view of {judged.id}</p>
          <pre className="mt-2 overflow-x-auto rounded-lg bg-code p-4 font-mono text-[0.8rem] text-code-foreground" tabIndex={0}>
            {JSON.stringify(judgeClaim(judged), null, 2)}
          </pre>
          <p className="mt-1 text-xs text-muted-foreground">{JUDGE_JSON_LABEL}</p>
        </div>
      )}
    </div>
  );
}
