import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { CHECK_LIMITS, CONTRACT_CODE, LAYER_DETAILS, PLACEMENT, PRINCIPLE, QUIZ_GUARD, TAKEAWAY_GUARD, TEST_FIXTURES } from "@/content/lesson-guardrails";
import { getLesson } from "@/content/lessons";
import { GuardLab } from "./GuardLab";
import { Takeaways } from "./Takeaways";
import { ThinkingCheck } from "./ThinkingCheck";
import { Badge, Callout, CodeBlock, Section, btnVariants } from "./ui";

const TOC = [
  ["understand", "Understand it"],
  ["lab", "See it work"],
  ["apply", "Apply it to EvidenceLens"],
  ["assess", "Assess the current plan"],
  ["implement", "Try a small implementation"],
  ["verify", "Verify the change"],
  ["tradeoffs", "Inspect trade-offs"],
  ["quiz", "Check understanding"],
  ["notes", "Capture a takeaway"],
] as const;

export function LessonGuard() {
  const lesson = getLesson("guardrails")!;
  return (
    <article className="mx-auto max-w-4xl px-5 py-10 lg:px-10">
      <header>
        <p className="eyebrow">Lesson 04 · {lesson.concept}</p>
        <h1 className="mt-2 text-4xl font-medium sm:text-5xl">{lesson.title}</h1>
        <p className="prose-body mt-4 max-w-2xl text-muted-foreground">
          Guardrails are not one filter. They are separate checks at separate boundaries — and the ones that matter most live in application code,
          not in the prompt.
        </p>
        <nav aria-label="Lesson sections" className="mt-6 flex flex-wrap gap-2">
          {TOC.map(([id, label], i) => (
            <a key={id} href={`#${id}`} className="rounded-full border border-border bg-card px-3 py-1 text-xs hover:bg-muted">
              {i + 1}. {label}
            </a>
          ))}
        </nav>
      </header>

      <div className="mt-10 space-y-14">
        <Section id="understand" step="1 · Understand it" title="Four layers of control">
          <blockquote className="rounded-lg border-l-4 border-primary bg-primary-soft p-5 font-serif text-xl">{PRINCIPLE}</blockquote>
          <ol className="mt-6 grid gap-3 sm:grid-cols-2">
            {LAYER_DETAILS.map(([t, d], i) => (
              <li key={t} className="rounded-lg border border-border bg-card p-4">
                <span className="font-mono text-xs text-muted-foreground">Layer {i + 1}</span>
                <p className="mt-1 font-semibold">{t}</p>
                <p className="mt-1 text-sm text-muted-foreground">{d}</p>
              </li>
            ))}
          </ol>
          <div className="prose-body mt-6 max-w-2xl">
            <p>
              <strong>Direct prompt injection</strong> arrives in the user’s own input. <strong>Indirect injection</strong> hides in content the system
              fetches — a retrieved page or a tool result. Retrieval does not make a document trustworthy: being relevant and being honest are
              unrelated. See{" "}
              <a className="text-primary underline underline-offset-2" href="https://genai.owasp.org/llmrisk/llm01-prompt-injection/" target="_blank" rel="noreferrer">
                OWASP’s prompt-injection guidance
              </a>
              .
            </p>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Callout title="No detector or prompt solves injection" tone="accent">
              Detectors miss paraphrases and system prompts can be overridden. They can reduce risk; they cannot be the control you rely on.
            </Callout>
            <Callout title="Guardrails ≠ permissions" tone="accent">
              A guardrail shapes or checks output. A permission decides what the system may access or do — and is enforced by code.
            </Callout>
          </div>
        </Section>

        <Section id="lab" step="2 · See it work" title="Trust-boundary lab">
          <p className="prose-body mb-5 max-w-2xl">
            Pick a case and inspect its input, evidence, proposed response, and proposed action. Then see which control stops it, and what that control
            cannot do.
          </p>
          <GuardLab />
        </Section>

        <Section id="apply" step="3 · Apply it to EvidenceLens" title="Where each control would sit">
          <p className="prose-body max-w-2xl">The current design proposes these controls along the query flow. All are planned; none is implemented.</p>
          <ol className="mt-4 divide-y divide-border rounded-lg border border-border bg-card">
            {PLACEMENT.map(([stage, ctl]) => (
              <li key={stage} className="grid gap-1 p-3 text-sm sm:grid-cols-[18rem_1fr_auto] sm:items-center">
                <span className="font-medium">{stage}</span>
                <span className="text-muted-foreground">{ctl}</span>
                <Badge tone="planned">Planned</Badge>
              </li>
            ))}
          </ol>
          <ul className="mt-5 grid gap-2 text-sm sm:grid-cols-2">
            {[
              "Retrieved instructions remain data.",
              "The generator receives bounded evidence.",
              "Citation IDs resolve through server-held records.",
              "Numeric and qualifier checks happen before release.",
              "Authorization is enforced independently of model output.",
              "Current eligibility is rechecked at release.",
              "Logs exclude secrets and unnecessary content.",
              "Unverified draft text is never streamed as the final answer.",
            ].map((x) => (
              <li key={x} className="rounded-md border border-border bg-card px-3 py-2">{x}</li>
            ))}
          </ul>
        </Section>

        <Section id="assess" step="4 · Assess the current plan" title="Review finding">
          <div className="grid gap-3 md:grid-cols-3">
            <Callout title="Already planned" tone="primary">
              Source admission, untrusted evidence handling, structured output, claim/citation checks, authentication, request limits, controlled
              egress, and exclusion propagation.
            </Callout>
            <Callout title="Needs implementation detail" tone="accent">Executable policies and fixtures at each boundary.</Callout>
            <Callout title="Unnecessary initially">An autonomous security agent or a separate guardrail service without a demonstrated need.</Callout>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Relevant references: <span className="font-mono">F02, F11, F14, F17, F19</span>. This review does not change the sealed master plan.
          </p>
        </Section>

        <Section id="implement" step="5 · Try a small implementation" title="A typed output contract">
          <CodeBlock code={CONTRACT_CODE} label="Proposed implementation sketch. Not existing EvidenceLens code." />
          <p className="prose-body mt-4 max-w-2xl">
            <code className="font-mono text-base">extra="forbid"</code> rejects unexpected fields, and <code className="font-mono text-base">min_length=1</code> requires every claim
            to cite something. That is all it does.
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[28rem] text-left text-sm">
              <caption className="sr-only">What each check establishes</caption>
              <thead className="border-b border-border"><tr><th className="py-2 pr-4">Check</th><th className="py-2">Establishes only</th></tr></thead>
              <tbody className="divide-y divide-border">
                {CHECK_LIMITS.map(([a, b]) => <tr key={a}><td className="py-2 pr-4 font-medium">{a}</td><td>{b}</td></tr>)}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-sm font-semibold">Passing one does not imply passing the others.</p>
        </Section>

        <Section id="verify" step="6 · Verify the change" title="Test fixtures">
          <ul className="grid gap-2 sm:grid-cols-2">
            {TEST_FIXTURES.map((x) => <li key={x} className="rounded-md border border-border bg-card px-3 py-2 text-sm">{x}</li>)}
          </ul>
          <p className="mt-4 text-sm">
            For each fixture, record which control stopped it and confirm the outcome holds with any detector disabled. These tests provide scoped
            evidence, not a guarantee of complete security.
          </p>
        </Section>

        <Section id="tradeoffs" step="7 · Inspect trade-offs" title="What could go wrong">
          <ul className="grid gap-3 sm:grid-cols-2">
            {[
              ["False rejections", "Strict verification may remove correct claims phrased differently from the source."],
              ["Latency", "Each check adds time before release; the brief cannot stream unverified text."],
              ["Verifier blind spots", "A model-based verifier has its own errors and must be evaluated like any component."],
              ["Policy drift", "Authorization rules that lag behind source licences leak or over-block evidence."],
              ["Log over-collection", "Logging full prompts and evidence for debugging can expose restricted content."],
              ["False confidence", "Passing fixtures may encourage claims of security the tests cannot support."],
            ].map(([t, d]) => (
              <li key={t} className="rounded-lg border border-border bg-card p-4"><p className="font-semibold">{t}</p><p className="mt-1 text-sm text-muted-foreground">{d}</p></li>
            ))}
          </ul>
        </Section>

        <Section id="quiz" step="8 · Check understanding" title="Check your thinking">
          <ThinkingCheck questions={QUIZ_GUARD} />
        </Section>

        <Section id="notes" step="9 · Capture a takeaway" title="Thinking points">
          <Takeaways data={TAKEAWAY_GUARD} />
        </Section>

        <footer className="flex flex-col gap-4 rounded-lg border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">Ready for the next idea?</p>
          <Link to="/lessons/$slug" params={{ slug: "tools-agents" }} className={btnVariants({ variant: "ghost" })}>
            Next: Lesson 5 (planned) <ArrowRight className="size-4" aria-hidden />
          </Link>
        </footer>
      </div>
    </article>
  );
}
