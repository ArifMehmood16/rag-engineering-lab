import { useMemo, useState } from "react";
import { CheckCircle2, MinusCircle, ShieldAlert, ShieldCheck } from "lucide-react";
import { SCENARIOS } from "@/content/lesson-guardrails";
import { LAYERS, evaluateScenario, type ControlResult } from "@/lib/guardrails";
import { cn } from "@/lib/utils";
import { Badge, SyntheticNotice, ToggleChip } from "./ui";

const RESULT: Record<ControlResult, { label: string; cls: string; Icon: typeof CheckCircle2 }> = {
  caught: { label: "Caught", cls: "border-primary bg-primary-soft", Icon: ShieldCheck },
  contained: { label: "Contained", cls: "border-info/40 bg-info-soft", Icon: ShieldAlert },
  passed: { label: "Passed", cls: "border-border bg-card", Icon: CheckCircle2 },
  "n/a": { label: "N/A", cls: "border-dashed border-border bg-muted/40", Icon: MinusCircle },
};

export function GuardLab() {
  const [id, setId] = useState(SCENARIOS[1]!.id);
  const [detector, setDetector] = useState(false);
  const s = SCENARIOS.find((x) => x.id === id)!;
  const ev = useMemo(() => evaluateScenario(s, detector), [s, detector]);

  return (
    <div className="space-y-5">
      <SyntheticNotice>
        Synthetic trust-boundary simulation. No model runs and no real or privileged tools are
        connected.
      </SyntheticNotice>

      <div>
        <p className="text-sm font-semibold" id="scen-label">
          Choose a case
        </p>
        <div role="radiogroup" aria-labelledby="scen-label" className="mt-2 flex flex-wrap gap-1.5">
          {SCENARIOS.map((x) => (
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

      <div className="grid gap-2 sm:grid-cols-2" key={s.id}>
        {[
          ["User input", s.userInput],
          ["Retrieved evidence / tool output", s.evidence],
          ["Proposed model response", s.response],
          ["Proposed action", s.action],
        ].map(([k, v]) => (
          <div key={k} className="rounded-lg border border-border bg-muted/50 p-3 fade-in">
            <p className="eyebrow">{k}</p>
            <p className="mt-1 font-mono text-[0.8rem] leading-relaxed">{v}</p>
          </div>
        ))}
      </div>

      <ToggleChip
        label="Add a heuristic injection detector"
        desc="See what a pattern-matching detector adds — and what it misses"
        pressed={detector}
        onChange={setDetector}
      />

      <div>
        <p className="text-sm font-semibold">Controls applied</p>
        <ol className="mt-2 space-y-1.5">
          {ev.rows.map(({ control, result, note }) => {
            const R = RESULT[result];
            return (
              <li key={control.id} className={cn("rounded-md border p-3 text-sm", R.cls)}>
                <div className="flex flex-wrap items-center gap-2">
                  <R.Icon className="size-4 shrink-0" aria-hidden />
                  <span className="font-semibold">{control.name}</span>
                  <span className="font-mono text-[0.68rem] text-muted-foreground">
                    Layer {control.layer}
                  </span>
                  <span className="ml-auto font-mono text-[0.68rem] uppercase">{R.label}</span>
                </div>
                <p className="mt-1">{note}</p>
                {(result === "caught" || result === "contained") && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    <strong>Limitation:</strong> {control.limitation}
                  </p>
                )}
              </li>
            );
          })}
        </ol>
        {ev.detector.shown && (
          <div
            className={cn(
              "mt-2 rounded-md border p-3 text-sm",
              ev.detector.flagged
                ? "border-info/40 bg-info-soft"
                : "border-accent/50 bg-accent-soft",
            )}
          >
            <p className="font-semibold">
              Heuristic injection detector:{" "}
              {ev.detector.flagged === null
                ? "not applicable"
                : ev.detector.flagged
                  ? "flagged"
                  : "missed"}
            </p>
            <p className="mt-0.5">{ev.detector.note}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              A detector is a signal, not a guarantee. It does not prove a request or document is
              safe.
            </p>
          </div>
        )}
      </div>

      <div role="status" className="rounded-lg border border-primary/40 bg-card p-4">
        <p className="eyebrow">Release decision</p>
        <p className="mt-1 font-serif text-lg">{ev.release}</p>
        <p className="mt-2 flex flex-wrap gap-1 text-xs">
          Stopped or contained by:{" "}
          {ev.stoppedBy.map((c) => (
            <Badge key={c} tone="proposed">
              {ev.rows.find((r) => r.control.id === c)!.control.name}
            </Badge>
          ))}
        </p>
      </div>

      <details className="rounded-lg border border-border bg-card p-4 text-sm">
        <summary className="cursor-pointer font-semibold">The four control layers</summary>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          {Object.values(LAYERS).map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ol>
      </details>
    </div>
  );
}
