import { ClientOnly, createFileRoute, Link } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  ExternalLink,
  Pause,
  Play,
  RotateCcw,
  SkipForward,
  Square,
  Unplug,
} from "lucide-react";
import { BASE_STAGES } from "@/content/architecture";
import { APOLLO_RECORDS, DEFAULT_QUESTION, type EvidenceRecord } from "@/content/apollo";
import { LAB_EXPERIMENTS, ORBIT_DISCLAIMER } from "@/content/lab";
import { getLesson } from "@/content/lessons";
import { OrbitStatic } from "@/components/lab/OrbitStatic";
import type { NodeState } from "@/components/lab/OrbitScene";
import { Badge, ToggleChip, btnVariants } from "@/components/learn/ui";
import { advance, ENGINE_STAGES, initEngine, type EngineState } from "@/lib/apollo-engine";
import { cn } from "@/lib/utils";

const OrbitScene = lazy(() => import("@/components/lab/OrbitScene"));

const TITLE = "THE INTELLIGENCE LAB — An interactive AI engineering lab";
const DESC =
  "Run a local, source-backed Apollo 11 retrieval experiment around ORBIT and inspect every stage, from request checks to release.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Lab,
});

// Engine stage → planned design stage (for the design context in the inspector).
const DESIGN: Record<string, string> = {
  question: "intake",
  request: "auth",
  retrieve: "retrieve",
  assemble: "select",
  sufficiency: "sufficiency",
  draft: "generate",
  verify: "verify",
  eligibility: "release",
  release: "release",
};
const SPEEDS = [0.5, 1, 2] as const;
const pad = (i: number) => `S${String(i + 1).padStart(2, "0")}`;
const KIND_LABEL: Record<EvidenceRecord["kind"], string> = {
  source: "Source-backed",
  "synthetic-distractor": "Synthetic distractor",
  adversarial: "Adversarial fixture",
};

function NotConnected() {
  return (
    <Badge tone="planned">
      <Unplug className="size-3" aria-hidden /> Not connected yet
    </Badge>
  );
}

function RecordCard({ r }: { r: EvidenceRecord }) {
  return (
    <div className="rounded-md border border-border bg-muted p-3 text-sm">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="font-mono text-xs">{r.id}</span>
        <Badge tone={r.kind === "source" ? "proposed" : "warn"}>{KIND_LABEL[r.kind]}</Badge>
        <Badge tone={r.eligibility === "eligible" ? "neutral" : "warn"}>
          {r.eligibility.replace("_", " ")}
        </Badge>
      </div>
      <p className="mt-2">“{r.text}”</p>
      <dl className="mt-2 grid gap-x-3 gap-y-0.5 text-xs text-muted-foreground sm:grid-cols-[6rem_1fr]">
        <dt>Source</dt>
        <dd>
          {r.source.url ? (
            <a
              href={r.source.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              {r.source.publisher} · {r.source.title}{" "}
              <ExternalLink className="size-3" aria-hidden />
            </a>
          ) : (
            r.source.title
          )}
        </dd>
        <dt>Locator</dt>
        <dd>{r.locator}</dd>
        <dt>Version</dt>
        <dd>{r.version}</dd>
        <dt>Mission</dt>
        <dd>
          {r.mission.name} · launch {r.mission.launch} · splashdown {r.mission.splashdown}
        </dd>
        <dt>Eligibility</dt>
        <dd>{r.eligibilityReason}</dd>
      </dl>
    </div>
  );
}

function Lab() {
  const [engine, setEngine] = useState<EngineState>(() => initEngine(DEFAULT_QUESTION));
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(1);
  const [sel, setSel] = useState(0);
  const [evidence, setEvidence] = useState<string | null>(null);
  const [reduced, setReduced] = useState(false);
  const [low, setLow] = useState(false);
  const last = ENGINE_STAGES.length - 1;
  const finished = engine.cursor >= last || engine.halted;

  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  useEffect(() => {
    if (!playing) return;
    if (finished) {
      setPlaying(false);
      return;
    }
    const t = setTimeout(() => {
      const n = advance(engine, APOLLO_RECORDS);
      setEngine(n);
      setSel(n.cursor);
    }, 1100 / speed);
    return () => clearTimeout(t);
  }, [playing, engine, speed, finished, last]);

  const step = () => {
    if (finished) return;
    setPlaying(false);
    const n = advance(engine, APOLLO_RECORDS);
    setEngine(n);
    setSel(n.cursor);
  };
  const reset = () => {
    setPlaying(false);
    setEngine(initEngine(DEFAULT_QUESTION));
    setSel(0);
    setEvidence(null);
  };
  const run = () => {
    if (finished) return;
    if (engine.cursor === -1) {
      setEngine(advance(engine, APOLLO_RECORDS));
      setSel(0);
    }
    setPlaying(true);
  };
  const replay = () => {
    setEngine(advance(initEngine(DEFAULT_QUESTION), APOLLO_RECORDS));
    setSel(0);
    setEvidence(null);
    setPlaying(true);
  };

  const states: NodeState[] = useMemo(
    () =>
      ENGINE_STAGES.map((_, i) => {
        const r = engine.results[i];
        if (r) return r.status;
        if (playing && i === engine.cursor + 1) return "active";
        return "idle";
      }),
    [engine, playing],
  );

  const stage = ENGINE_STAGES[sel]!;
  const result = engine.results[sel];
  const design = BASE_STAGES.find((b) => b.id === DESIGN[stage.id])!;
  const lesson = getLesson(design.lesson)!;
  const released = engine.ctx.released;
  const evRec = evidence ? APOLLO_RECORDS.find((r) => r.id === evidence) : undefined;
  const statusLabel = finished
    ? engine.halted
      ? "Halted"
      : "Complete"
    : playing
      ? "Running"
      : engine.cursor === -1
        ? "Ready"
        : "Paused";

  return (
    <div className="mx-auto grid max-w-[1600px] gap-4 p-4 lg:grid-cols-[19rem_minmax(0,1fr)_23rem] lg:p-5">
      <h1 className="sr-only">THE INTELLIGENCE LAB — Apollo 11 experiment</h1>

      {/* Left: question & experiment controls */}
      <section
        aria-labelledby="ctl-h"
        className="glass order-3 space-y-5 rounded-xl p-4 lg:order-1 lg:max-h-[calc(56vh+12rem)] lg:overflow-y-auto"
      >
        <div>
          <p className="hud-label" id="ctl-h">
            01 · Question
          </p>
          <p className="mt-2 rounded-md border border-primary bg-primary-soft px-3 py-2 text-sm">
            {DEFAULT_QUESTION}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Corpus: {APOLLO_RECORDS.filter((r) => r.kind === "source").length} source-backed NASA
            excerpts, 1 synthetic distractor, 1 adversarial fixture.
          </p>
        </div>
        <div>
          <p className="hud-label">02 · Experiments</p>
          <ul className="mt-2 space-y-2">
            <li className="rounded-md border border-primary p-3">
              <p className="text-sm font-semibold">Apollo 11 · grounded answer</p>
              <div className="mt-1">
                <Badge tone="proposed">Connected · local</Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Full pipeline from request checks to release.
              </p>
            </li>
            {LAB_EXPERIMENTS.map((e) => {
              const l = getLesson(e.lesson)!;
              return (
                <li key={e.id} className="rounded-md border border-dashed border-border p-3">
                  <p className="text-sm font-semibold">{e.title}</p>
                  <div className="mt-1">
                    <NotConnected />
                  </div>
                  <Link
                    to="/lessons/$slug"
                    params={{ slug: e.lesson }}
                    className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    Working version in Lesson {l.number}{" "}
                    <ArrowUpRight className="size-3" aria-hidden />
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
        <div>
          <p className="hud-label">03 · Display</p>
          <div className="mt-2 space-y-2">
            <ToggleChip
              label="Reduced motion"
              desc="Stop ORBIT’s movement"
              pressed={reduced}
              onChange={setReduced}
            />
            <ToggleChip
              label="Low effects"
              desc="Static vector ORBIT, no 3D rendering"
              pressed={low}
              onChange={setLow}
            />
          </div>
        </div>
      </section>

      {/* Center: ORBIT, controls, pipeline */}
      <section aria-labelledby="orbit-h" className="order-1 flex min-w-0 flex-col lg:order-2">
        <div className="flex flex-wrap items-baseline justify-between gap-3 px-1">
          <h2 id="orbit-h" className="text-3xl font-semibold tracking-[0.12em] sm:text-4xl">
            ORBIT
          </h2>
          <Badge tone="synthetic">Local simulation · source-backed fixtures</Badge>
        </div>
        <div
          role="img"
          aria-label={`ORBIT: ${ENGINE_STAGES.length} engine stages around a core. ${engine.results.length} of ${ENGINE_STAGES.length} completed. Status: ${statusLabel}.`}
          className="relative mt-2 h-[42vh] min-h-[280px] overflow-hidden rounded-xl border border-border lg:h-[50vh]"
        >
          {low ? (
            <OrbitStatic states={states} selected={sel} />
          ) : (
            <ClientOnly fallback={<OrbitStatic states={states} selected={sel} />}>
              <Suspense fallback={<OrbitStatic states={states} selected={sel} />}>
                <OrbitScene
                  states={states}
                  selected={sel}
                  animate={!reduced}
                  speed={speed}
                  onSelect={setSel}
                />
              </Suspense>
            </ClientOnly>
          )}
          <div className="pointer-events-none absolute inset-x-3 top-3 flex justify-between gap-2">
            <span className="hud-label">Q · {DEFAULT_QUESTION}</span>
            <span className="hud-label shrink-0 text-primary" aria-live="polite">
              {statusLabel} · {engine.results.length}/{ENGINE_STAGES.length}
            </span>
          </div>
          <p className="pointer-events-none absolute inset-x-3 bottom-3 text-[0.7rem] text-muted-foreground">
            {ORBIT_DISCLAIMER} Generation is fixture-based; no real model is running.
          </p>
        </div>

        <div
          role="toolbar"
          aria-label="Run controls"
          className="glass mt-3 flex flex-wrap items-center gap-2 rounded-xl p-2"
        >
          <button
            type="button"
            className={btnVariants({ variant: "primary", size: "sm" })}
            onClick={run}
            disabled={playing || finished}
          >
            <Play className="size-4" aria-hidden /> Run
          </button>
          <button
            type="button"
            className={btnVariants({ size: "sm" })}
            onClick={() => setPlaying(false)}
            disabled={!playing}
          >
            <Pause className="size-4" aria-hidden /> Pause
          </button>
          <button
            type="button"
            className={btnVariants({ size: "sm" })}
            onClick={step}
            disabled={finished}
          >
            <SkipForward className="size-4" aria-hidden /> Next step
          </button>
          <button type="button" className={btnVariants({ size: "sm" })} onClick={replay}>
            <RotateCcw className="size-4" aria-hidden /> Replay
          </button>
          <button type="button" className={btnVariants({ size: "sm" })} onClick={reset}>
            <Square className="size-4" aria-hidden /> Reset
          </button>
          <div
            role="radiogroup"
            aria-label="Animation speed"
            className="ml-auto flex items-center gap-1"
          >
            <span className="hud-label mr-1">Speed</span>
            {SPEEDS.map((s) => (
              <button
                key={s}
                type="button"
                role="radio"
                aria-checked={speed === s}
                onClick={() => setSpeed(s)}
                className={cn(
                  "rounded px-2 py-1 font-mono text-xs",
                  speed === s ? "bg-primary text-primary-foreground" : "hover:bg-muted",
                )}
              >
                {s}×
              </button>
            ))}
          </div>
        </div>

        <nav aria-label="Pipeline stages" className="mt-3 overflow-x-auto pb-1">
          <ol className="flex min-w-max gap-1.5">
            {ENGINE_STAGES.map((s, i) => (
              <li key={s.id}>
                <button
                  type="button"
                  aria-pressed={sel === i}
                  onClick={() => setSel(i)}
                  className={cn(
                    "glass rounded-md px-3 py-2 text-left text-xs transition-colors",
                    sel === i
                      ? "border-primary text-primary shadow-[var(--glow-cyan)]"
                      : "hover:bg-muted",
                  )}
                >
                  <span className="block font-mono text-[0.6rem] text-muted-foreground">
                    {pad(i)} · {states[i]}
                  </span>
                  {s.name}
                </button>
              </li>
            ))}
          </ol>
        </nav>
      </section>

      {/* Right: inspector */}
      <aside
        aria-labelledby="insp-h"
        className="glass order-2 h-fit space-y-4 rounded-xl p-4 lg:order-3 lg:max-h-[calc(56vh+12rem)] lg:overflow-y-auto"
      >
        <div aria-live="polite">
          <p className="hud-label">
            Inspector · {pad(sel)} · {states[sel]}
          </p>
          <h2 id="insp-h" className="mt-1 text-2xl font-semibold">
            {stage.name}
          </h2>
          {result ? (
            <div className="mt-3 space-y-3 text-sm">
              <div>
                <p className="hud-label">Input</p>
                <ul className="mt-1 space-y-0.5 font-mono text-[0.75rem]">
                  {result.input.map((x) => (
                    <li key={x}>› {x}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="hud-label">Output</p>
                <ul className="mt-1 space-y-0.5 font-mono text-[0.75rem]">
                  {result.output.map((x) => (
                    <li
                      key={x}
                      className={x.startsWith("excluded") ? "text-accent-foreground" : undefined}
                    >
                      › {x}
                    </li>
                  ))}
                </ul>
              </div>
              {result.note && (
                <p className="rounded bg-info-soft px-2 py-1 text-xs text-info">{result.note}</p>
              )}
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              Not executed yet. Press Run or Next step.
            </p>
          )}
        </div>

        {released && (
          <div className="rounded-lg border border-primary bg-primary-soft p-3">
            <p className="hud-label text-primary">Released answer</p>
            <ul className="mt-2 space-y-2 text-sm">
              {released.claims.map((c) => (
                <li key={c.id}>
                  {c.text}{" "}
                  {c.cites.map((id) => (
                    <button
                      key={id}
                      type="button"
                      aria-pressed={evidence === id}
                      onClick={() => setEvidence(evidence === id ? null : id)}
                      className="mr-1 rounded border border-primary px-1 font-mono text-[0.65rem] text-primary hover:bg-primary hover:text-primary-foreground"
                    >
                      {id}
                    </button>
                  ))}
                </li>
              ))}
            </ul>
            {evRec && (
              <div className="mt-3">
                <RecordCard r={evRec} />
              </div>
            )}
            <p className="mt-2 text-[0.7rem] text-muted-foreground">
              A model might answer this correctly without retrieval. The value shown here is
              traceable, checked evidence — not a claim that retrieval was needed to be right.
            </p>
          </div>
        )}

        <div className="rounded-md border border-border p-3 text-sm">
          <p className="hud-label">Design context · Lesson {lesson.number}</p>
          <p className="mt-1 text-muted-foreground">{design.responsibility}</p>
          <Link
            to="/lessons/$slug"
            params={{ slug: lesson.slug }}
            className="mt-2 inline-flex items-center gap-1 font-medium text-primary hover:underline"
          >
            Inspect: {lesson.concept} <ArrowUpRight className="size-4" aria-hidden />
          </Link>
        </div>
      </aside>

      {/* Bottom: execution timeline + fixtures */}
      <section aria-labelledby="tl-h" className="glass order-4 rounded-xl p-4 lg:col-span-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p id="tl-h" className="hud-label">
            Execution timeline
          </p>
          <span className="hud-label">Deterministic steps · no timings measured</span>
        </div>
        <ol className="mt-3 grid grid-cols-3 gap-1.5 sm:grid-cols-5 lg:grid-cols-9">
          {ENGINE_STAGES.map((s, i) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => setSel(i)}
                className={cn(
                  "w-full rounded border-t-2 px-2 pt-1.5 text-left",
                  states[i] === "done"
                    ? "border-primary"
                    : states[i] === "blocked"
                      ? "border-destructive"
                      : states[i] === "active"
                        ? "border-foreground"
                        : "border-border",
                  sel === i && "bg-muted",
                )}
              >
                <span className="block font-mono text-[0.6rem] text-muted-foreground">
                  {pad(i)} · {states[i]}
                </span>
                <span className="block truncate text-xs">{s.name}</span>
                <span className="block truncate font-mono text-[0.6rem] text-muted-foreground">
                  {engine.results[i]?.output[0] ?? "—"}
                </span>
              </button>
            </li>
          ))}
        </ol>
        <details className="mt-4">
          <summary className="cursor-pointer text-sm font-medium text-primary">
            Inspect all {APOLLO_RECORDS.length} fixtures
          </summary>
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            {APOLLO_RECORDS.map((r) => (
              <RecordCard key={r.id} r={r} />
            ))}
          </div>
        </details>
      </section>
    </div>
  );
}
