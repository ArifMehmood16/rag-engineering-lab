import { BASE_STAGES, OVERLAY_STAGES, type OverlayId, type Stage } from "@/content/architecture";

/** Ordered stages for the chosen overlays. Pure and deterministic. */
export function buildFlow(on: OverlayId[]): Stage[] {
  const extras = OVERLAY_STAGES.filter((s) => s.overlay && on.includes(s.overlay));
  const out: Stage[] = [];
  for (const b of BASE_STAGES) {
    out.push(...extras.filter((e) => e.before === b.id));
    out.push(b);
  }
  return out;
}

export interface Outline {
  topic: string;
  points: { prompt: string; tip: string }[];
  outline: { label: string; guidance: string }[];
}

export const OUTLINE_LABELS = ["The misconception", "The concept", "An EvidenceLens design example", "A trade-off", "An experiment to validate it", "What remains unknown"];

export function outlineToMarkdown(o: Outline): string {
  const lines = [`# ${o.topic}`, "", "_Design-phase draft. EvidenceLens is not implemented; no results exist._", "", "## Outline", ""];
  o.outline.forEach((s, i) => lines.push(`${i + 1}. **${s.label}** — ${s.guidance}`));
  lines.push("", "## Reflection prompts", "");
  o.points.forEach((p) => lines.push(`- **${p.prompt}:** ${p.tip}`));
  return lines.join("\n") + "\n";
}
