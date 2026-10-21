import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowDown } from "lucide-react";
import { EVAL_COVERS, EVAL_NOTE, OVERLAYS, PROMPT_CACHE_NOTE, type OverlayId } from "@/content/architecture";
import { getLesson } from "@/content/lessons";
import { buildFlow } from "@/lib/architecture";
import { cn } from "@/lib/utils";
import { Badge, SyntheticNotice, ToggleChip } from "./ui";

export function ArchitectureMap() {
  const [on, setOn] = useState<OverlayId[]>([]);
  const [sel, setSel] = useState("auth");
  const flow = useMemo(() => buildFlow(on), [on]);
  const stage = flow.find((s) => s.id === sel) ?? flow[0]!;
  const lesson = getLesson(stage.lesson)!;
  const toggle = (id: OverlayId) => setOn((o) => (o.includes(id) ? o.filter((x) => x !== id) : [...o, id]));
  const evalOn = on.includes("evaluation");

  return (
    <div className="space-y-5">
      <SyntheticNotice>Design-phase map. Planned stages come from the EvidenceLens design; overlays are proposed teaching options. Nothing here is implemented.</SyntheticNotice>
      <div>
        <p className="text-sm font-semibold">Overlays</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {OVERLAYS.map((o) => <ToggleChip key={o.id} label={o.label} desc={o.desc} pressed={on.includes(o.id)} onChange={() => toggle(o.id)} />)}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_20rem]">
        <ol aria-label="Planned query workflow, in order" className="space-y-1">
          {flow.map((s, i) => {
            const covered = evalOn && EVAL_COVERS.includes(s.id);
            return (
              <li key={s.id} className="fade-in">
                <button
                  type="button"
                  aria-pressed={sel === s.id}
                  onClick={() => setSel(s.id)}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 rounded-md border px-3 py-2 text-left text-sm",
                    s.overlay ? "border-dashed border-accent bg-accent-soft" : "border-border bg-card",
                    sel === s.id && "ring-2 ring-primary",
                  )}
                >
                  <span><span className="font-mono text-xs text-muted-foreground">{i + 1}.</span> {s.name}</span>
                  <span className="flex shrink-0 gap-1">
                    {covered && <Badge tone="synthetic">Evaluated offline</Badge>}
                    <Badge tone={s.status === "planned" ? "planned" : "proposed"}>{s.status}</Badge>
                  </span>
                </button>
                {s.id === "generate" && on.includes("promptCache") && <p className="ml-4 mt-1 border-l-2 border-accent pl-3 text-xs">{PROMPT_CACHE_NOTE}</p>}
                {s.id === "sufficiency" && <p className="ml-4 mt-1 border-l-2 border-border pl-3 text-xs text-muted-foreground">Insufficient evidence branches to an evidence gap or partial answer at release.</p>}
                {i < flow.length - 1 && <ArrowDown className="mx-auto my-0.5 size-3 text-muted-foreground" aria-hidden />}
              </li>
            );
          })}
        </ol>

        <aside aria-live="polite" className="h-fit rounded-lg border border-border bg-card p-4 text-sm lg:sticky lg:top-6">
          <p className="eyebrow">Selected stage</p>
          <h3 className="mt-1 text-xl">{stage.name}</h3>
          <Badge tone={stage.status === "planned" ? "planned" : "proposed"} className="mt-2">{stage.status === "planned" ? "Planned in design" : "Proposed overlay"}</Badge>
          <dl className="mt-3 space-y-2">
            {([["Responsibility", stage.responsibility], ["Inputs", stage.inputs], ["Outputs", stage.outputs], ["Trust boundary", stage.trust]] as const).map(([k, v]) => (
              <div key={k}><dt className="font-semibold">{k}</dt><dd className="text-muted-foreground">{v}</dd></div>
            ))}
            <div><dt className="font-semibold">Relevant lesson</dt><dd><Link to="/lessons/$slug" params={{ slug: lesson.slug }} className="text-primary underline underline-offset-2">Lesson {lesson.number}: {lesson.concept}</Link></dd></div>
          </dl>
        </aside>
      </div>
      {evalOn && <p className="rounded-md border border-info/30 bg-info-soft p-3 text-sm text-info">{EVAL_NOTE}</p>}
      <p className="text-xs text-muted-foreground">The five concepts are not one mandatory execution order; each lesson touches the stages it explains.</p>
    </div>
  );
}
