import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, CircleSlash, MinusCircle, XCircle } from "lucide-react";
import { BUDGET, PASSAGES, REQUIRED_QUALIFIERS, TOOLS, TOOL_CASES } from "@/content/lesson-agents";
import { evaluateContext, walkToolCall, type StepStatus } from "@/lib/agents";
import { cn } from "@/lib/utils";
import { Badge, SyntheticNotice } from "./ui";

const STEP: Record<StepStatus, { cls: string; Icon: typeof CheckCircle2 }> = {
  ok: { cls: "border-primary/40 bg-primary-soft", Icon: CheckCircle2 },
  blocked: { cls: "border-destructive/40 bg-destructive-soft", Icon: XCircle },
  warn: { cls: "border-accent/50 bg-accent-soft", Icon: AlertTriangle },
  skipped: {
    cls: "border-dashed border-border bg-muted/40 text-muted-foreground",
    Icon: MinusCircle,
  },
};

export function ToolCallLab() {
  const [id, setId] = useState(TOOL_CASES[0]!.id);
  const c = TOOL_CASES.find((x) => x.id === id)!;
  const w = useMemo(() => walkToolCall(c, TOOLS), [c]);
  return (
    <div className="space-y-5">
      <SyntheticNotice>
        Synthetic walkthrough. Tool names and interfaces are proposed examples, not implemented
        EvidenceLens APIs. Nothing executes.
      </SyntheticNotice>
      <div>
        <p className="text-sm font-semibold" id="tc-label">
          Choose a case
        </p>
        <div role="radiogroup" aria-labelledby="tc-label" className="mt-2 flex flex-wrap gap-1.5">
          {TOOL_CASES.map((x) => (
            <button
              key={x.id}
              type="button"
              role="radio"
              aria-checked={id === x.id}
              onClick={() => setId(x.id)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm",
                id === x.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card hover:bg-muted",
              )}
            >
              {x.title}
            </button>
          ))}
        </div>
      </div>
      <div className="rounded-lg border border-border bg-muted/50 p-3">
        <p className="eyebrow">User question</p>
        <p className="mt-1 text-sm">{c.question}</p>
        <p className="mt-2 font-mono text-xs text-muted-foreground">
          Caller scopes (server-held): {c.callerScopes.join(", ")}
        </p>
      </div>
      <ol className="space-y-2" key={c.id} aria-label="Tool-call loop">
        {w.steps.map((s, i) => {
          const { cls, Icon } = STEP[s.status];
          return (
            <li key={s.key} className={cn("fade-in flex gap-3 rounded-md border p-3 text-sm", cls)}>
              <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
              <div>
                <p className="font-semibold">
                  {i + 1}. {s.label} <span className="sr-only">— {s.status}</span>
                </p>
                <p className="mt-0.5 font-mono text-[0.78rem] leading-relaxed">{s.detail}</p>
              </div>
            </li>
          );
        })}
      </ol>
      <p role="status" className="rounded-lg border-l-4 border-primary bg-card p-4 text-sm">
        <strong>Outcome: {w.outcome.replace("_", " ")}.</strong> {w.outcomeText}
      </p>
    </div>
  );
}

export function ContextBudgetLab() {
  const [sel, setSel] = useState<string[]>(["P1", "P2", "P6"]);
  const r = useMemo(() => evaluateContext(PASSAGES, sel, BUDGET, REQUIRED_QUALIFIERS), [sel]);
  const toggle = (id: string) =>
    setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const pct = Math.min(100, (r.used / BUDGET) * 100);
  return (
    <div className="space-y-5">
      <SyntheticNotice>
        Synthetic passages with illustrative token estimates. Not real studies and not a real
        tokenizer.
      </SyntheticNotice>
      <p className="text-sm">
        Question: <em>Does oral drug A reduce 12-month relapse in adults?</em> Required qualifiers:{" "}
        {REQUIRED_QUALIFIERS.map((q) => (
          <Badge key={q} className="mr-1">
            {q}
          </Badge>
        ))}
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        {PASSAGES.map((p) => {
          const on = sel.includes(p.id);
          return (
            <button
              key={p.id}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(p.id)}
              className={cn(
                "rounded-md border p-3 text-left text-sm transition-colors",
                on ? "border-primary bg-primary-soft" : "border-border bg-card hover:bg-muted",
              )}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs">
                  {p.id} · {p.study}
                </span>
                <span className="font-mono text-xs">~{p.tokens} tok</span>
              </span>
              <span className="mt-1 block">{p.text}</span>
              <span className="mt-2 flex flex-wrap gap-1">
                {p.duplicateOf && <Badge tone="warn">duplicate of {p.duplicateOf}</Badge>}
                {p.direction === "no_difference" && <Badge tone="warn">conflicting finding</Badge>}
                {p.qualifiers.map((q) => (
                  <Badge key={q}>{q}</Badge>
                ))}
              </span>
            </button>
          );
        })}
      </div>
      <div className="rounded-lg border border-border bg-card p-4" role="status" aria-live="polite">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold">Budget used</span>
          <span className={cn("font-mono", r.overBudget && "text-destructive")}>
            {r.used} / {BUDGET} tokens
          </span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
          <div
            className={cn("h-full", r.overBudget ? "bg-destructive" : "bg-primary")}
            style={{ width: `${pct}%` }}
          />
        </div>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="eyebrow">Study coverage</dt>
            <dd>
              {r.studiesCovered.length} of {r.studiesTotal} studies
            </dd>
          </div>
          <div>
            <dt className="eyebrow">Qualifiers</dt>
            <dd>
              {r.qualifiersKept.length} of {REQUIRED_QUALIFIERS.length} preserved
              {r.qualifiersLost.length ? ` · lost: ${r.qualifiersLost.join(", ")}` : ""}
            </dd>
          </div>
          <div>
            <dt className="eyebrow">Duplicates</dt>
            <dd>{r.duplicates.length ? r.duplicates.join(", ") : "None"}</dd>
          </div>
          <div>
            <dt className="eyebrow">Contradiction</dt>
            <dd>{r.contradictionIncluded ? "Included — conflict stays visible" : "Omitted"}</dd>
          </div>
        </dl>
        <p className="mt-4 flex items-center gap-2 text-sm font-semibold">
          {r.verdict === "good" ? (
            <CheckCircle2 className="size-4 text-primary" aria-hidden />
          ) : r.verdict === "weak" ? (
            <AlertTriangle className="size-4" aria-hidden />
          ) : (
            <CircleSlash className="size-4 text-destructive" aria-hidden />
          )}
          {r.verdict === "good"
            ? "Sound selection"
            : r.verdict === "weak"
              ? "Weak selection"
              : "Unusable selection"}{" "}
          · {r.passagesSelected} passage(s)
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          {r.notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
