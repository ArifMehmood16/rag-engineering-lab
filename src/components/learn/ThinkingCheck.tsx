import { Lightbulb } from "lucide-react";
import type { QuizQuestion } from "@/content/lesson-context";

/** Static self-check: each question reveals its answer and reasoning on demand. No answers are recorded. */
export function ThinkingCheck({ questions }: { questions: QuizQuestion[] }) {
  return (
    <div className="space-y-4">
      {questions.map((q, i) => (
        <div key={q.id} className="rounded-lg border border-border bg-card p-4">
          <p className="font-semibold">
            {i + 1}. {q.prompt}
          </p>
          <ul className="mt-2 list-[lower-alpha] space-y-1 pl-6 text-sm">
            {q.options.map((o) => (
              <li key={o}>{o}</li>
            ))}
          </ul>
          <details className="mt-3 rounded-md bg-muted/60 p-3 text-sm">
            <summary className="cursor-pointer font-medium text-primary">Show the reasoning</summary>
            <p className="mt-2 flex gap-2 leading-relaxed">
              <Lightbulb className="mt-0.5 size-4 shrink-0 text-accent-foreground" aria-hidden />
              <span>
                <strong>Best answer: ({String.fromCharCode(97 + q.answer)}) {q.options[q.answer]}</strong> {q.explanation}
              </span>
            </p>
          </details>
        </div>
      ))}
    </div>
  );
}
