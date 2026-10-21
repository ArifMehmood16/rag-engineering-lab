import { ClientOnly, createFileRoute, Link } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState } from "react";
import { ArrowUpRight, Unplug } from "lucide-react";
import { BASE_STAGES } from "@/content/architecture";
import { LAB_EXPERIMENTS, LAB_QUESTIONS, ORBIT_DISCLAIMER } from "@/content/lab";
import { getLesson } from "@/content/lessons";
import { OrbitStatic } from "@/components/lab/OrbitStatic";
import { Badge, ToggleChip } from "@/components/learn/ui";
import { cn } from "@/lib/utils";

const OrbitScene = lazy(() => import("@/components/lab/OrbitScene"));

const TITLE = "THE INTELLIGENCE LAB — An interactive AI engineering lab";
const DESC = "Explore five AI engineering concepts around ORBIT, a visual model of a bounded RAG pipeline, using the design-phase EvidenceLens case study.";

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

function NotConnected() {
  return (
    <Badge tone="planned">
      <Unplug className="size-3" aria-hidden /> Not connected yet
    </Badge>
  );
}

function Lab() {
  const [q, setQ] = useState(LAB_QUESTIONS[0]!.id);
  const [sel, setSel] = useState(1);
  const [reduced, setReduced] = useState(false);
  const [low, setLow] = useState(false);
  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(m.matches);
  }, []);
  const stage = BASE_STAGES[sel]!;
  const lesson = getLesson(stage.lesson)!;
  const question = LAB_QUESTIONS.find((x) => x.id === q)!;

  return (
    <div className="mx-auto grid max-w-[1600px] gap-4 p-4 lg:grid-cols-[19rem_minmax(0,1fr)_21rem] lg:p-5">
      <h1 className="sr-only">THE INTELLIGENCE LAB</h1>

      {/* Left: question & experiment controls */}
      <section aria-labelledby="ctl-h" className="glass order-3 space-y-5 rounded-xl p-4 lg:order-1">
        <div>
          <p className="hud-label" id="ctl-h">01 · Question</p>
          <div role="radiogroup" aria-label="Synthetic question" className="mt-2 space-y-1.5">
            {LAB_QUESTIONS.map((x) => (
              <button
                key={x.id}
                type="button"
                role="radio"
                aria-checked={q === x.id}
                onClick={() => setQ(x.id)}
                className={cn("w-full rounded-md border px-3 py-2 text-left text-sm transition-colors", q === x.id ? "border-primary bg-primary-soft" : "border-border hover:bg-muted")}
              >
                {x.text}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{question.note}</p>
        </div>
        <div>
          <p className="hud-label">02 · Experiments</p>
          <ul className="mt-2 space-y-2">
            {LAB_EXPERIMENTS.map((e) => {
              const l = getLesson(e.lesson)!;
              return (
                <li key={e.id} className="rounded-md border border-dashed border-border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold">{e.title}</p>
                    <NotConnected />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{e.desc}</p>
                  <Link to="/lessons/$slug" params={{ slug: e.lesson }} className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline">
                    Working version in Lesson {l.number} <ArrowUpRight className="size-3" aria-hidden />
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
        <div>
          <p className="hud-label">03 · Display</p>
          <div className="mt-2 space-y-2">
            <ToggleChip label="Reduced motion" desc="Stop ORBIT’s movement" pressed={reduced} onChange={setReduced} />
            <ToggleChip label="Low effects" desc="Static vector ORBIT, no 3D rendering" pressed={low} onChange={setLow} />
          </div>
        </div>
      </section>

      {/* Center: ORBIT and pipeline */}
      <section aria-labelledby="orbit-h" className="order-1 flex min-w-0 flex-col lg:order-2">
        <div className="flex items-baseline justify-between gap-3 px-1">
          <h2 id="orbit-h" className="text-3xl font-semibold tracking-[0.12em] sm:text-4xl">ORBIT</h2>
          <span className="hud-label hidden sm:inline">EvidenceLens query workflow · planned</span>
        </div>
        <div
          role="img"
          aria-label={`ORBIT: an abstract visual of ${BASE_STAGES.length} planned pipeline stages around a central core. Selected stage: ${stage.name}.`}
          className="relative mt-2 h-[44vh] min-h-[280px] overflow-hidden rounded-xl border border-border lg:h-[56vh]"
        >
          {low ? (
            <OrbitStatic count={BASE_STAGES.length} selected={sel} />
          ) : (
            <ClientOnly fallback={<OrbitStatic count={BASE_STAGES.length} selected={sel} />}>
              <Suspense fallback={<OrbitStatic count={BASE_STAGES.length} selected={sel} />}>
                <OrbitScene count={BASE_STAGES.length} selected={sel} animate={!reduced} onSelect={setSel} />
              </Suspense>
            </ClientOnly>
          )}
          <div className="pointer-events-none absolute inset-x-3 top-3 flex justify-between">
            <span className="hud-label">Q · {question.text}</span>
          </div>
          <p className="pointer-events-none absolute inset-x-3 bottom-3 text-[0.7rem] text-muted-foreground">{ORBIT_DISCLAIMER}</p>
        </div>
        <nav aria-label="Pipeline stages" className="mt-3 overflow-x-auto pb-1">
          <ol className="flex min-w-max gap-1.5">
            {BASE_STAGES.map((s, i) => (
              <li key={s.id}>
                <button
                  type="button"
                  aria-pressed={sel === i}
                  onClick={() => setSel(i)}
                  className={cn("glass rounded-md px-3 py-2 text-left text-xs transition-colors", sel === i ? "border-primary text-primary shadow-[var(--glow-cyan)]" : "hover:bg-muted")}
                >
                  <span className="block font-mono text-[0.6rem] text-muted-foreground">S{String(i + 1).padStart(2, "0")}</span>
                  {s.name}
                </button>
              </li>
            ))}
          </ol>
        </nav>
      </section>

      {/* Right: inspector */}
      <aside aria-labelledby="insp-h" aria-live="polite" className="glass order-2 h-fit rounded-xl p-4 lg:order-3">
        <p className="hud-label">Inspector · S{String(sel + 1).padStart(2, "0")}</p>
        <h2 id="insp-h" className="mt-1 text-2xl font-semibold">{stage.name}</h2>
        <Badge tone="planned" className="mt-2">Planned in design · not implemented</Badge>
        <dl className="mt-4 space-y-3 text-sm">
          {([["Responsibility", stage.responsibility], ["Inputs", stage.inputs], ["Outputs", stage.outputs], ["Trust boundary", stage.trust]] as const).map(([k, v]) => (
            <div key={k}>
              <dt className="hud-label">{k}</dt>
              <dd className="mt-0.5">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-5 rounded-md border border-border bg-muted p-3">
          <p className="hud-label">Lesson {lesson.number} · {lesson.concept}</p>
          <p className="mt-1 text-sm text-muted-foreground">{lesson.summary}</p>
          <Link to="/lessons/$slug" params={{ slug: lesson.slug }} className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            Inspect the full lesson <ArrowUpRight className="size-4" aria-hidden />
          </Link>
        </div>
        <div className="mt-3 flex flex-wrap gap-3 text-xs">
          <Link to="/architecture" className="text-primary hover:underline">Architecture overlays</Link>
          <Link to="/overview" className="text-primary hover:underline">All lessons</Link>
          <Link to="/writing" className="text-primary hover:underline">Writing exercises</Link>
        </div>
      </aside>

      {/* Bottom: execution timeline */}
      <section aria-labelledby="tl-h" className="glass order-4 rounded-xl p-4 lg:col-span-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p id="tl-h" className="hud-label">Execution timeline</p>
          <NotConnected />
        </div>
        <ol className="mt-3 grid grid-cols-3 gap-1.5 sm:grid-cols-5 lg:grid-cols-9">
          {BASE_STAGES.map((s, i) => (
            <li key={s.id} className={cn("rounded border-t-2 px-2 pt-1.5", sel === i ? "border-primary" : "border-border")}>
              <span className="block font-mono text-[0.6rem] text-muted-foreground">S{String(i + 1).padStart(2, "0")} · idle</span>
              <span className="block truncate text-xs">{s.name}</span>
              <span className="block font-mono text-[0.6rem] text-muted-foreground">— ms</span>
            </li>
          ))}
        </ol>
        <p className="mt-3 text-xs text-muted-foreground">No run has executed. When connected, this will show synthetic, deterministic steps from the lesson labs — never measured EvidenceLens timings.</p>
      </section>
    </div>
  );
}
