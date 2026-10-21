import { Lightbulb, PenLine } from "lucide-react";
import { outlineToMarkdown } from "@/lib/architecture";
import { CopyButton } from "./ui";

export interface Takeaway {
  topic: string;
  points: { prompt: string; tip: string }[];
  outline: { label: string; guidance: string }[];
}

/** Read-only thinking points and a suggested post outline. Nothing is typed or stored. */
export function Takeaways({ data }: { data: Takeaway }) {
  return (
    <div className="space-y-8">
      <ul className="grid gap-3 sm:grid-cols-2">
        {data.points.map((p) => (
          <li key={p.prompt} className="rounded-lg border border-border bg-card p-4">
            <p className="flex items-start gap-2 font-semibold">
              <Lightbulb className="mt-0.5 size-4 shrink-0 text-accent-foreground" aria-hidden /> {p.prompt}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{p.tip}</p>
          </li>
        ))}
      </ul>
      <div className="rounded-lg border border-border bg-muted/50 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="eyebrow flex items-center gap-2">
            <PenLine className="size-3.5" aria-hidden /> Writing it up
          </p>
          <CopyButton text={outlineToMarkdown(data)} label="Copy outline as Markdown" />
        </div>
        <h3 className="mt-1 text-2xl">{data.topic}</h3>
        <p className="mt-1 text-sm text-muted-foreground">A suggested outline. Write from what you learned and designed, not from results that don’t exist yet.</p>
        <ol className="mt-4 space-y-3">
          {data.outline.map((o, i) => (
            <li key={o.label} className="grid gap-1 sm:grid-cols-[14rem_1fr]">
              <span className="font-semibold">
                {i + 1}. {o.label}
              </span>
              <span className="text-sm leading-relaxed">{o.guidance}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
