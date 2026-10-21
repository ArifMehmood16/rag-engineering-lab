import { CheckCircle2, XCircle } from "lucide-react";
import type { QuizQuestion } from "@/content/lesson-context";
import { useLocalState } from "@/lib/storage";
import { cn } from "@/lib/utils";
import { btnVariants } from "./ui";

export function Quiz({ lessonSlug, questions }: { lessonSlug: string; questions: QuizQuestion[] }) {
  const [answers, setAnswers] = useLocalState<Record<string, number>>(`quiz:${lessonSlug}`, {});
  const answered = Object.keys(answers).length;
  const correct = questions.filter((q) => answers[q.id] === q.answer).length;

  return (
    <div className="space-y-6">
      {questions.map((q, qi) => {
        const chosen = answers[q.id];
        const done = chosen !== undefined;
        return (
          <fieldset key={q.id} className="rounded-lg border border-border bg-card p-4">
            <legend className="px-1 font-semibold">
              {qi + 1}. {q.prompt}
            </legend>
            <div className="mt-2 grid gap-2">
              {q.options.map((opt, oi) => {
                const isRight = oi === q.answer;
                const isChosen = chosen === oi;
                return (
                  <label
                    key={oi}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-md border px-3 py-2 text-sm",
                      done && isRight && "border-primary bg-primary-soft",
                      done && isChosen && !isRight && "border-destructive bg-destructive-soft",
                      !done && "hover:bg-muted",
                    )}
                  >
                    <input
                      type="radio"
                      name={q.id}
                      className="mt-1 accent-[var(--color-primary)]"
                      checked={isChosen}
                      onChange={() => setAnswers((a) => ({ ...a, [q.id]: oi }))}
                    />
                    <span className="flex-1">{opt}</span>
                    {done && isRight && (
                      <span className="flex items-center gap-1 text-xs font-semibold text-primary">
                        <CheckCircle2 className="size-4" aria-hidden /> Correct answer
                      </span>
                    )}
                    {done && isChosen && !isRight && (
                      <span className="flex items-center gap-1 text-xs font-semibold text-destructive">
                        <XCircle className="size-4" aria-hidden /> Your choice
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
            {done && (
              <p className="mt-3 text-sm leading-relaxed fade-in" role="status">
                <strong>{chosen === q.answer ? "Right. " : "Not quite. "}</strong>
                {q.explanation}
              </p>
            )}
          </fieldset>
        );
      })}
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span aria-live="polite">
          {answered} of {questions.length} answered · {correct} correct
        </span>
        {answered > 0 && (
          <button type="button" className={btnVariants({ variant: "ghost", size: "sm" })} onClick={() => setAnswers({})}>
            Clear quiz answers
          </button>
        )}
      </div>
    </div>
  );
}
