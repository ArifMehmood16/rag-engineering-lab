import { useMemo, useState } from "react";
import { AlertTriangle, ArrowDown, CheckCircle2, MinusCircle, Sparkles, XCircle } from "lucide-react";
import { APPROVED_ANSWER, CACHE_TYPES, ROUTING_REQUESTS } from "@/content/lesson-cost";
import { CHANGES, buildPrompt, evaluateAnswerReuse, reusablePrefixLength, routeRequest, type ChangeKey, type RequestKind, type Sufficiency } from "@/lib/caching";
import { cn } from "@/lib/utils";
import { Badge, SyntheticNotice } from "./ui";

const statusTone = { planned: "planned", experiment: "proposed", deferred: "neutral" } as const;
const statusLabel = { planned: "Planned", experiment: "Possible experiment", deferred: "Deferred" };

export function CacheComparison() {
  const [active, setActive] = useState(CACHE_TYPES[0]!.key);
  const c = CACHE_TYPES.find((x) => x.key === active)!;
  return (
    <div>
      <div role="tablist" aria-label="Cache types" className="flex flex-wrap gap-1 rounded-md border border-border bg-card p-1">
        {CACHE_TYPES.map((t) => (
          <button
            key={t.key}
            role="tab"
            id={`tab-${t.key}`}
            aria-selected={active === t.key}
            aria-controls="cache-panel"
            onClick={() => setActive(t.key)}
            onKeyDown={(e) => {
              const i = CACHE_TYPES.findIndex((x) => x.key === active);
              const n = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
              if (n) {
                const next = CACHE_TYPES[(i + n + CACHE_TYPES.length) % CACHE_TYPES.length]!;
                setActive(next.key);
                document.getElementById(`tab-${next.key}`)?.focus();
              }
            }}
            tabIndex={active === t.key ? 0 : -1}
            className={cn("rounded px-3 py-2 text-sm", active === t.key ? "bg-primary text-primary-foreground" : "hover:bg-muted")}
          >
            {t.name}
          </button>
        ))}
      </div>
      <div id="cache-panel" role="tabpanel" aria-labelledby={`tab-${c.key}`} className="mt-3 rounded-lg border border-border bg-card p-5 fade-in" key={c.key}>
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-2xl">{c.name}</h3>
          <Badge tone={statusTone[c.status]}>{statusLabel[c.status]}</Badge>
        </div>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
          <div><dt className="font-semibold">Reuses</dt><dd className="mt-1">{c.reuses}</dd></div>
          <div><dt className="font-semibold">Still required on a hit</dt><dd className="mt-1">{c.stillRequired}</dd></div>
          <div><dt className="font-semibold">Valid only when</dt><dd className="mt-1">{c.validWhen}</dd></div>
        </dl>
      </div>
    </div>
  );
}

export function PrefixDemo() {
  const [timestampFirst, setTimestampFirst] = useState(true);
  const [evidenceFirst, setEvidenceFirst] = useState(false);
  const segs = buildPrompt({ timestampFirst, evidenceFirst });
  const reusable = reusablePrefixLength(segs);
  return (
    <div className="space-y-4">
      <SyntheticNotice>Synthetic illustration. No provider is called; real behaviour depends on the provider and model selected.</SyntheticNotice>
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="flex cursor-pointer items-start gap-3 rounded-md border border-border bg-card p-3 text-sm">
          <input type="checkbox" className="mt-1 size-4 accent-[var(--color-primary)]" checked={timestampFirst} onChange={(e) => setTimestampFirst(e.target.checked)} />
          <span><span className="block font-semibold">Timestamp before the prefix</span><span className="text-xs text-muted-foreground">e.g. “Current time: …” at the top</span></span>
        </label>
        <label className="flex cursor-pointer items-start gap-3 rounded-md border border-border bg-card p-3 text-sm">
          <input type="checkbox" className="mt-1 size-4 accent-[var(--color-primary)]" checked={evidenceFirst} onChange={(e) => setEvidenceFirst(e.target.checked)} />
          <span><span className="block font-semibold">Retrieved evidence before instructions</span><span className="text-xs text-muted-foreground">Another common ordering mistake</span></span>
        </label>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {["Request A", "Request B"].map((r) => (
          <div key={r} className="rounded-lg border border-border bg-card p-3">
            <p className="eyebrow">{r}</p>
            <ol className="mt-2 space-y-1">
              {segs.map((s, i) => {
                const reused = i < reusable;
                return (
                  <li key={s.key} className={cn("flex items-center justify-between rounded border px-2 py-1.5 text-sm", reused ? "border-primary/40 bg-primary-soft" : s.changesPerRequest ? "border-accent/50 bg-accent-soft" : "border-border bg-muted")}>
                    <span>{s.label}{s.changesPerRequest && <span className="text-xs text-muted-foreground"> · differs per request</span>}</span>
                    <span className="font-mono text-[0.68rem] uppercase">{reused ? (r === "Request A" ? "written" : "reused") : "processed"}</span>
                  </li>
                );
              })}
            </ol>
            <p className="mt-2 flex items-center gap-1 rounded border border-info/30 bg-info-soft px-2 py-1.5 text-sm text-info">
              <Sparkles className="size-4" aria-hidden /> Model generates a new response
            </p>
          </div>
        ))}
      </div>
      <p role="status" className={cn("rounded-md border p-3 text-sm", reusable ? "border-primary/40 bg-primary-soft" : "border-accent/50 bg-accent-soft")}>
        {reusable
          ? `${reusable} of ${segs.length} segments form an identical leading prefix and are eligible for reuse in Request B. Generation still happens.`
          : "Nothing is eligible: the first segment differs between requests, so no identical prefix exists. Generation happens as usual."}
      </p>
    </div>
  );
}

const stepIcon = { pass: CheckCircle2, fail: XCircle, skipped: MinusCircle };

export function InvalidationLab() {
  const [active, setActive] = useState<ChangeKey[]>([]);
  const result = useMemo(() => evaluateAnswerReuse(active), [active]);
  const toggle = (k: ChangeKey) => setActive((a) => (a.includes(k) ? a.filter((x) => x !== k) : [...a, k]));
  return (
    <div className="space-y-4">
      <SyntheticNotice>Learning fixture. Not a measured project result. All identifiers are synthetic.</SyntheticNotice>
      <div className="rounded-lg border border-border bg-muted/60 p-4 text-sm">
        <p className="eyebrow">Approved synthetic answer</p>
        <p className="mt-1 font-serif text-lg">“{APPROVED_ANSWER.question}”</p>
        <dl className="mt-2 grid gap-x-4 gap-y-1 font-mono text-xs sm:grid-cols-3">
          <div>population: {APPROVED_ANSWER.population}</div>
          <div>formulation: {APPROVED_ANSWER.formulation}</div>
          <div>index: {APPROVED_ANSWER.index}</div>
          <div>scope: {APPROVED_ANSWER.scope}</div>
          <div>schema: {APPROVED_ANSWER.schema}</div>
          <div>deps: {APPROVED_ANSWER.dependencies.join(", ")}</div>
        </dl>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <fieldset>
          <legend className="text-sm font-semibold">Apply changes since approval</legend>
          <div className="mt-2 grid gap-1.5">
            {CHANGES.map((c) => (
              <label key={c.key} className="flex cursor-pointer items-center gap-3 rounded-md border border-border bg-card px-3 py-2 text-sm">
                <input type="checkbox" className="size-4 accent-[var(--color-primary)]" checked={active.includes(c.key)} onChange={() => toggle(c.key)} />
                {c.label}
              </label>
            ))}
          </div>
        </fieldset>
        <div>
          <p className="text-sm font-semibold">Release path for the same question now</p>
          <ol className="mt-2 space-y-1.5">
            {result.steps.map((s) => {
              const Icon = stepIcon[s.outcome];
              return (
                <li key={s.name} className={cn("rounded-md border px-3 py-2 text-sm", s.outcome === "pass" ? "border-primary/40 bg-card" : s.outcome === "fail" ? "border-destructive/40 bg-destructive-soft" : "border-dashed border-border bg-muted/40 text-muted-foreground")}>
                  <span className="flex items-center gap-2 font-medium">
                    <Icon className="size-4 shrink-0" aria-hidden /> {s.name} <span className="ml-auto font-mono text-[0.68rem] uppercase">{s.outcome}</span>
                  </span>
                  <span className="mt-0.5 block text-xs">{s.note}</span>
                </li>
              );
            })}
          </ol>
          <div role="status" className={cn("mt-3 rounded-md border p-3 text-sm", result.reusable ? "border-primary/40 bg-primary-soft" : "border-accent/50 bg-accent-soft")}>
            <p className="font-semibold">{result.reusable ? "Reuse is valid — every current check passed." : "Reuse is not valid. Take the fresh path: retrieve, generate, verify."}</p>
            {result.reasons.length > 0 && <ul className="mt-1 list-disc pl-5">{result.reasons.map((r) => <li key={r}>{r}</li>)}</ul>}
          </div>
        </div>
      </div>
    </div>
  );
}

const toneCls = { app: "border-border bg-card", model: "border-info/40 bg-info-soft", check: "border-primary/40 bg-primary-soft", stop: "border-accent/50 bg-accent-soft" };
const toneLbl = { app: "Application", model: "Model call", check: "Check", stop: "Stop" };

export function RoutingSim() {
  const [kind, setKind] = useState<RequestKind>("compare");
  const [suff, setSuff] = useState<Sufficiency>("sufficient");
  const [validated, setValidated] = useState(false);
  const r = routeRequest(kind, suff, validated);
  const usesSufficiency = kind === "compare";
  return (
    <div className="space-y-4">
      <SyntheticNotice>Synthetic routing simulation. No models are selected or called; tiers are placeholders.</SyntheticNotice>
      <div className="grid gap-4 md:grid-cols-[1fr_1fr]">
        <fieldset>
          <legend className="text-sm font-semibold">Request</legend>
          <div className="mt-2 grid gap-1.5">
            {ROUTING_REQUESTS.map((q) => (
              <label key={q.kind} className={cn("flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2 text-sm", kind === q.kind ? "border-primary bg-primary-soft" : "border-border bg-card")}>
                <input type="radio" name="route-req" className="size-4 accent-[var(--color-primary)]" checked={kind === q.kind} onChange={() => setKind(q.kind)} />
                “{q.label}”
              </label>
            ))}
          </div>
        </fieldset>
        <div className="space-y-3">
          <fieldset disabled={!usesSufficiency} className={cn(!usesSufficiency && "opacity-50")}>
            <legend className="text-sm font-semibold">Evidence found for the comparison</legend>
            <div className="mt-2 grid grid-cols-3 gap-1">
              {(["sufficient", "partial", "missing"] as Sufficiency[]).map((s) => (
                <label key={s} className={cn("cursor-pointer rounded-md border px-2 py-2 text-center text-sm capitalize", suff === s ? "border-primary bg-primary-soft" : "border-border bg-card")}>
                  <input type="radio" name="suff" className="sr-only" checked={suff === s} onChange={() => setSuff(s)} />
                  {s}
                </label>
              ))}
            </div>
          </fieldset>
          <label className={cn("flex cursor-pointer items-start gap-3 rounded-md border border-border bg-card p-3 text-sm", kind !== "extract" && "opacity-50")}>
            <input type="checkbox" disabled={kind !== "extract"} className="mt-1 size-4 accent-[var(--color-primary)]" checked={validated} onChange={(e) => setValidated(e.target.checked)} />
            <span><span className="block font-semibold">Smaller model passed a separate evaluation</span><span className="text-xs text-muted-foreground">Applies to bounded extraction only (hypothetical)</span></span>
          </label>
        </div>
      </div>
      <div role="status" className="rounded-lg border border-border bg-card p-4">
        <p className="eyebrow">Selected path</p>
        <p className="mt-1 font-serif text-xl">{r.path}</p>
        <p className="mt-1 text-sm">{r.reason}</p>
        <ol className="mt-4 space-y-1">
          {r.steps.map((s, i) => (
            <li key={s.label}>
              <div className={cn("flex items-center justify-between rounded-md border px-3 py-2 text-sm", toneCls[s.tone])}>
                <span>{s.label}</span>
                <span className="font-mono text-[0.68rem] uppercase">{toneLbl[s.tone]}</span>
              </div>
              {i < r.steps.length - 1 && <ArrowDown className="mx-auto my-0.5 size-3 text-muted-foreground" aria-hidden />}
            </li>
          ))}
        </ol>
        <p className="mt-3 text-sm"><strong>Outcome:</strong> {r.outcome}</p>
        <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          <AlertTriangle className="size-3.5" aria-hidden /> Larger model used to fill missing evidence: no — it cannot create source evidence.
        </p>
      </div>
    </div>
  );
}
