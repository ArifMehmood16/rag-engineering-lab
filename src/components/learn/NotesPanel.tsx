import { useLocalState } from "@/lib/storage";
import { CopyButton } from "./ui";

export const REFLECTION_PROMPTS = [
  { key: "own-words", label: "Explain it in your own words." },
  { key: "surprised", label: "What surprised you?" },
  { key: "fit", label: "Where does it fit in EvidenceLens?" },
  { key: "experiment", label: "What experiment would you run?" },
  { key: "change-mind", label: "What result would change your mind?" },
] as const;

export const OUTLINE_SECTIONS = [
  { key: "misconception", label: "1. The misconception" },
  { key: "concept", label: "2. The concept" },
  { key: "example", label: "3. An EvidenceLens design example" },
  { key: "tradeoff", label: "4. A trade-off" },
  { key: "experiment", label: "5. An experiment to validate it" },
  { key: "unknown", label: "6. What remains unknown" },
] as const;

type Notes = Record<string, string>;

export function notesToMarkdown(title: string, topic: string, notes: Notes, outline: Notes) {
  const lines = [`# ${title} — notes`, ""];
  REFLECTION_PROMPTS.forEach((p) => lines.push(`## ${p.label}`, "", notes[p.key]?.trim() || "_(empty)_", ""));
  lines.push(`# Post outline: ${topic}`, "");
  OUTLINE_SECTIONS.forEach((s) => lines.push(`## ${s.label}`, "", outline[s.key]?.trim() || "_(empty)_", ""));
  return lines.join("\n");
}

export function NotesPanel({ lessonSlug, lessonTitle, topic }: { lessonSlug: string; lessonTitle: string; topic: string }) {
  const [notes, setNotes, available] = useLocalState<Notes>(`notes:${lessonSlug}`, {});
  const [outline, setOutline] = useLocalState<Notes>(`outline:${lessonSlug}`, {});
  const field = "w-full rounded-md border border-input bg-card p-3 text-sm leading-relaxed";

  return (
    <div className="space-y-8">
      <p className="text-sm text-muted-foreground">
        {available
          ? "Notes save automatically to this browser only. Clearing site data removes them — use “Copy as Markdown” to keep a copy elsewhere."
          : "Browser storage is unavailable, so notes last only until you leave this page. Use “Copy as Markdown” to keep them."}
      </p>

      <div className="grid gap-4">
        {REFLECTION_PROMPTS.map((p) => (
          <div key={p.key}>
            <label htmlFor={`${lessonSlug}-${p.key}`} className="text-sm font-semibold">
              {p.label}
            </label>
            <textarea
              id={`${lessonSlug}-${p.key}`}
              rows={3}
              className={`${field} mt-1`}
              value={notes[p.key] ?? ""}
              onChange={(e) => setNotes((n) => ({ ...n, [p.key]: e.target.value }))}
            />
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-border bg-muted/50 p-4">
        <h3 className="text-xl">Editable post outline</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Suggested topic: <em>{topic}</em>. Write from what you learned and designed — not from implementation results that don’t exist yet.
        </p>
        <div className="mt-4 grid gap-4">
          {OUTLINE_SECTIONS.map((s) => (
            <div key={s.key}>
              <label htmlFor={`${lessonSlug}-outline-${s.key}`} className="text-sm font-semibold">
                {s.label}
              </label>
              <textarea
                id={`${lessonSlug}-outline-${s.key}`}
                rows={2}
                className={`${field} mt-1`}
                value={outline[s.key] ?? ""}
                onChange={(e) => setOutline((o) => ({ ...o, [s.key]: e.target.value }))}
              />
            </div>
          ))}
        </div>
      </div>

      <CopyButton text={notesToMarkdown(lessonTitle, topic, notes, outline)} label="Copy notes and outline as Markdown" />
    </div>
  );
}
