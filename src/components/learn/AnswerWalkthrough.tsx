import {
  ANSWER_CASES,
  DRAFT_OPTIONS,
  type AnswerCase,
  type DraftVariant,
} from "@/content/answer-delivery";
import { passageById, type SourceId } from "@/content/insurance";
import { answerTrace } from "@/lib/answer-delivery";
import type { TopKSearch } from "@/lib/top-k-search";

const replyLabels = {
  answered: "Answered",
  needs_input: "Clarification requested",
  needs_review: "Needs verification",
  unavailable: "Access unavailable",
};

export function AnswerWalkthrough({
  packed,
  caseId,
  variant,
  onChange,
}: {
  packed: readonly SourceId[];
  caseId: AnswerCase;
  variant: DraftVariant;
  onChange: (patch: TopKSearch) => void;
}) {
  const trace = answerTrace(caseId, variant, packed);
  const reply = trace.reply;
  const prompt = trace.prompt;
  return (
    <section
      id="answer-delivery"
      aria-labelledby="delivery-title"
      className="my-6 max-w-3xl scroll-mt-20 space-y-5 rounded-lg border border-border bg-card p-4 sm:p-6"
    >
      <header>
        <h2 id="delivery-title" className="text-3xl">
          From retrieved passages to a user reply
        </h2>
        <p className="mt-2 leading-relaxed">
          This trace uses the last settings you applied above. The app builds the prompt and runs
          the checks locally. The selectable drafts are authored examples of model output.
        </p>
      </header>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm font-medium">
          Case to trace
          <select
            className="mt-1 block min-h-11 w-full rounded-md border bg-background px-2"
            value={caseId}
            onChange={(event) => onChange({ case: event.target.value as AnswerCase })}
          >
            {ANSWER_CASES.map((item) => (
              <option value={item.id} key={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium">
          Model output to test
          <select
            className="mt-1 block min-h-11 w-full rounded-md border bg-background px-2"
            disabled={!prompt}
            value={variant}
            onChange={(event) => onChange({ draft: event.target.value as DraftVariant })}
          >
            {Object.entries(DRAFT_OPTIONS).map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <section
        aria-labelledby="recipient-heading"
        className="rounded-md border-l-4 border-primary bg-muted p-4"
      >
        <h3 id="recipient-heading" className="text-2xl">
          What the handler sees
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">Question</p>
        <p>{trace.question}</p>
        <div aria-live="polite" aria-atomic="true">
          <p className="mt-3 text-sm font-semibold text-primary">{replyLabels[reply.status]}</p>
          <p className="mt-1 text-lg leading-relaxed">{reply.message}</p>
          {reply.sources.length > 0 && (
            <ul aria-label="Sources for this answer" className="mt-2 flex flex-wrap gap-x-4">
              {reply.sources.map((id) => (
                <li key={id}>
                  <a
                    href={`#${id}`}
                    className="text-primary underline underline-offset-4 inline-flex min-h-11 items-center text-sm"
                  >
                    {id} · {passageById(id).label}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
      <nav aria-label="Inspect the answer trace" className="flex flex-wrap gap-x-5 border-y">
        <a
          href="#prompt-heading"
          className="text-primary underline underline-offset-4 inline-flex min-h-11 items-center text-sm"
        >
          Augmented prompt
        </a>
        <a
          href="#draft-heading"
          className="text-primary underline underline-offset-4 inline-flex min-h-11 items-center text-sm"
        >
          Model draft
        </a>
        <a
          href="#checks-heading"
          className="text-primary underline underline-offset-4 inline-flex min-h-11 items-center text-sm"
        >
          Guardrail results
        </a>
      </nav>
      <section aria-labelledby="prompt-heading" className="space-y-2 border-t pt-4">
        <h3 id="prompt-heading" className="scroll-mt-20 text-2xl">
          1. Augment the model request
        </h3>
        {prompt ? (
          <>
            <p>
              The service adds the selected text to the handler’s question. The model receives a
              task and evidence for this request.
            </p>
            <p className="pt-1 font-semibold">System instruction</p>
            <p className="border-l-2 pl-3 text-sm leading-relaxed">{prompt.instruction}</p>
            <p className="pt-1 font-semibold">User question and supplied evidence</p>
            <p>{prompt.question}</p>
            <ol className="divide-y rounded-md border px-3">
              {prompt.evidence.map((source) => (
                <li
                  id={source.id}
                  key={source.id}
                  className="scroll-mt-20 py-2 text-sm leading-relaxed"
                >
                  <span className="block font-semibold">
                    {source.id} · {source.location}
                  </span>
                  <q>{source.excerpt}</q>
                  {source.footnote && <span className="block">{source.footnote}</span>}
                </li>
              ))}
            </ol>
          </>
        ) : (
          <p>The service stopped before constructing a model request. No source text was sent.</p>
        )}
      </section>
      <section aria-label="Model draft" className="space-y-2 border-t pt-4">
        <h3 id="draft-heading" className="scroll-mt-20 text-2xl">
          2. Generate a draft
        </h3>
        {trace.draft !== null ? (
          <>
            <p>
              A language model predicts successive pieces of text using the instruction, question,
              evidence and what it has already written. Here is the example response before
              validation.
            </p>
            <pre
              tabIndex={0}
              aria-label="Illustrative raw model response"
              className="whitespace-pre-wrap break-words rounded-md border bg-muted p-3 text-sm"
            >
              {formatDraft(trace.draft)}
            </pre>
          </>
        ) : (
          <p>
            {prompt
              ? "The request reached the generation stage, but the deadline expired before a complete draft arrived."
              : "Generation was skipped because an input check stopped the request."}
          </p>
        )}
      </section>
      <section aria-labelledby="checks-heading" className="space-y-2 border-t pt-4">
        <h3 id="checks-heading" className="scroll-mt-20 text-2xl">
          3. Check before delivery
        </h3>
        <p>
          A guardrail is a check that can change what the application does. These are the checks
          that ran, in order.
        </p>
        <ol className="divide-y">
          {trace.checks.map((check) => (
            <li className="py-2" key={check.label}>
              <p className="font-semibold">
                <span className={check.pass ? "text-primary" : "text-destructive"}>
                  {check.pass ? "Pass" : "Hold"}
                </span>{" "}
                · {check.label}
              </p>
              <p className="mt-1 text-sm leading-relaxed">{check.detail}</p>
            </li>
          ))}
        </ol>
        <details className="border-t">
          <summary className="cursor-pointer py-3 font-medium">
            Inspect the response delivered to the interface
          </summary>
          <p className="mb-2">
            A production service can return this object after validation. The interface shows its
            message and resolves each source ID to a permitted excerpt. The raw draft stays in the
            teaching trace.
          </p>
          <pre
            tabIndex={0}
            aria-label="Final response object"
            className="whitespace-pre-wrap break-words rounded-md border bg-muted p-3 text-sm"
          >
            {JSON.stringify(reply, null, 2)}
          </pre>
        </details>
      </section>
    </section>
  );
}

function formatDraft(raw: string) {
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
}
