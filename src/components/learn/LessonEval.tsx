import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import {
  DATASET_CATEGORIES,
  DATASET_RULES,
  DATASET_TIERS,
  EVAL_VIEWS,
  JUDGE_RISKS,
  JUDGE_RUBRIC,
  METRIC_DEFS,
  QUIZ_EVAL,
  RUN_RECORD,
  TAKEAWAY_EVAL,
} from "@/content/lesson-eval";
import { getLesson } from "@/content/lessons";
import { EvalLab } from "./EvalLab";
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

function Detail({ summary, children }: { summary: string; children: ReactNode }) {
  return (
    <details className="rounded-lg border border-border bg-card p-4">
      <summary className="cursor-pointer font-semibold">{summary}</summary>
      <div className="mt-3 space-y-2 text-sm leading-relaxed">{children}</div>
    </details>
  );
}

const JUDGE_EXAMPLE = `{
  "claim_id": "synthetic-claim-1",
  "support": "insufficient",
  "issues": ["population_mismatch"],
  "rationale": "The cited passage concerns a different population."
}`;

export function LessonEval() {
  const lesson = getLesson("evaluation")!;
  return (
    <article className="mx-auto max-w-4xl px-5 py-10 lg:px-10">
      <header>
        <p className="eyebrow">Lesson 03 · {lesson.concept}</p>
        <h1 className="mt-2 text-4xl font-medium sm:text-5xl">{lesson.title}</h1>
        <p className="prose-body mt-4 max-w-2xl text-muted-foreground">
          A useful evaluation doesn’t just say the system failed — it says which part failed. That means measuring retrieval, generation, and the
          whole system separately, and keeping infrastructure failures out of quality scores.
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
        <Section id="understand" step="1 · Understand it" title="Three views of one system">
          <ol className="grid gap-3 md:grid-cols-3">
            {EVAL_VIEWS.map((v, i) => (
              <li key={v.name} className="rounded-lg border border-border bg-card p-4">
                <span className="font-mono text-xs text-muted-foreground">View {i + 1}</span>
                <p className="mt-1 font-semibold">{v.name}</p>
                <p className="mt-1 font-serif text-base">{v.question}</p>
                <p className="mt-2 text-xs text-muted-foreground">Isolates: {v.isolates}</p>
              </li>
            ))}
          </ol>
          <div className="prose-body mt-6 max-w-2xl">
            <p>
              Testing generation with <strong>fixed evidence</strong> — the same, known-sufficient passages every run — isolates the generator. If the
              answer is wrong with perfect evidence, retrieval is not to blame. End-to-end tests then show how the stages combine.
            </p>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Callout title="Citation existence ≠ citation support" tone="accent">
              A citation can point to a real passage that says something else. And a fully supported answer can still miss key points. See{" "}
              <a className="text-primary underline underline-offset-2" href="https://aclanthology.org/2023.emnlp-main.398/" target="_blank" rel="noreferrer">
                ALCE’s work on evaluating answers with citations
              </a>
              .
            </Callout>
            <Callout title="Outages are not abstentions" tone="accent">
              An infrastructure error says nothing about evidence. Scoring it as a correct “evidence gap” would reward the system for failing.
            </Callout>
          </div>
        </Section>

        <Section id="lab" step="2 · See it work" title="Evaluation lab">
          <p className="prose-body mb-5 max-w-2xl">
            Turn on one failure at a time and watch which metrics change — and which don’t. Rows that changed are highlighted and labelled.
          </p>
          <EvalLab />
        </Section>

        <Section id="apply" step="3 · Apply it to EvidenceLens" title="Planned dataset design">
          <ol className="grid gap-3 sm:grid-cols-3">
            {DATASET_TIERS.map((t) => (
              <li key={t.name} className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-center justify-between">
                  <span className="font-serif text-3xl">{t.count}</span>
                  <Badge tone="planned">Planned</Badge>
                </div>
                <p className="mt-1 font-semibold">{t.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">{t.use}</p>
              </li>
            ))}
          </ol>
          <p className="mt-3 text-sm text-muted-foreground">None of these datasets has been collected or completed.</p>
          <h3 className="mt-6 font-sans text-sm font-semibold">Question categories</h3>
          <ul className="mt-2 flex flex-wrap gap-2">
            {DATASET_CATEGORIES.map((c) => (
              <li key={c} className="rounded-full border border-border bg-card px-3 py-1 text-sm">{c}</li>
            ))}
          </ul>
          <dl className="mt-6 grid gap-3 sm:grid-cols-2">
            {DATASET_RULES.map(([t, d]) => (
              <div key={t} className="rounded-lg border border-border bg-card p-4">
                <dt className="font-semibold">{t}</dt>
                <dd className="mt-1 text-sm text-muted-foreground">{d}</dd>
              </div>
            ))}
          </dl>

          <h3 className="mt-10 text-2xl">Metrics, with their denominators</h3>
          <dl className="mt-3 divide-y divide-border rounded-lg border border-border bg-card">
            {METRIC_DEFS.map(([t, d]) => (
              <div key={t} className="grid gap-1 p-3 sm:grid-cols-[13rem_1fr]">
                <dt className="font-medium">{t}</dt>
                <dd className="text-sm">{d}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-sm text-muted-foreground">Figures such as “85%” or “8/10” are not universal targets; acceptable values depend on the task, risk, and sample size.</p>
          <div className="mt-4">
            <Detail summary="Proposed project gates">
              <p className="font-semibold">Proposed project gates, subject to ratification. No measured results exist.</p>
              <p>
                The design proposes release gates per metric slice — for example, separate thresholds for unsupported claims, citation correctness,
                and false abstention. This brief supplies no ratified numeric values, so none are shown here.
              </p>
            </Detail>
          </div>

          <h3 className="mt-10 text-2xl">LLM-as-judge</h3>
          <p className="prose-body mt-2 max-w-2xl">A judge model scores outputs against a structured rubric, so review can scale beyond what humans can read.</p>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            {JUDGE_RUBRIC.map(([t, d]) => (
              <div key={t} className="rounded-lg border border-primary/30 bg-primary-soft p-4">
                <dt className="font-semibold">{t}</dt>
                <dd className="mt-1 text-sm">{d}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-4">
            <CodeBlock code={JUDGE_EXAMPLE} label="Illustrative judge output. Not existing EvidenceLens output." language="json" />
          </div>
          <p className="mt-3 text-sm">
            The <code className="font-mono">rationale</code> is an inspectable justification you can check against the evidence — not access to hidden
            model reasoning. A judge never establishes clinical validity.
          </p>
        </Section>

        <Section id="assess" step="4 · Assess the current plan" title="Review finding">
          <div className="grid gap-3 md:grid-cols-3">
            <Callout title="Already planned" tone="primary">Benchmark design, separate metrics, controlled comparisons, judge evaluation, and human review.</Callout>
            <Callout title="Missing in implementation" tone="accent">Actual labelled datasets, an application evaluation harness, and observed results.</Callout>
            <Callout title="Unnecessary initially">A paid evaluation platform, when local versioned fixtures and reports suffice.</Callout>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Relevant references: <span className="font-mono">F03, F14, F16</span>. This review does not change the sealed master plan.
          </p>
        </Section>

        <Section id="implement" step="5 · Try a small implementation" title="A reproducible run record">
          <CodeBlock code={RUN_RECORD} label="Proposed implementation sketch. Not existing EvidenceLens code." language="yaml" />
          <div className="mt-4">
            <Detail summary="Recommended change: build a local evaluation harness over versioned fixtures">
              <dl className="grid gap-2 sm:grid-cols-[10rem_1fr]">
                <dt className="font-semibold">Problem</dt><dd>Without a harness, no change can be compared fairly with another.</dd>
                <dt className="font-semibold">Expected benefit</dt><dd>Attributable, repeatable comparisons per stage.</dd>
                <dt className="font-semibold">Relative effort</dt><dd>Medium.</dd>
                <dt className="font-semibold">Dependencies</dt><dd>Seed questions with annotation rules; one complete baseline path.</dd>
                <dt className="font-semibold">Architectural location</dt><dd>Offline, beside the query flow; it calls stages, not the reverse.</dd>
                <dt className="font-semibold">Data-flow change</dt><dd>Each stage’s inputs and outputs are captured per question.</dd>
                <dt className="font-semibold">Configuration</dt><dd>Question-set version, configuration, and model/prompt versions pinned per run.</dd>
                <dt className="font-semibold">Storage/API</dt><dd>Run manifests in PostgreSQL; raw outputs in versioned object storage.</dd>
                <dt className="font-semibold">Verification</dt><dd>Inject known failures into fixtures, as in the lab, and confirm the expected metric moves.</dd>
                <dt className="font-semibold">Failure modes</dt><dd>Silent fixture drift; mixing infrastructure errors into quality; tuning on the release set.</dd>
              </dl>
            </Detail>
          </div>
        </Section>

        <Section id="verify" step="6 · Verify the change" title="What every run must record">
          <ul className="grid gap-2 sm:grid-cols-2">
            {[
              "Corpus and index release",
              "Question-set version",
              "Code and configuration versions",
              "Model and prompt versions",
              "Raw outputs",
              "Stage timing",
              "Usage and cost assumptions",
              "Error slices",
              "Sample sizes and uncertainty",
            ].map((x) => (
              <li key={x} className="rounded-md border border-border bg-card px-3 py-2 text-sm">{x}</li>
            ))}
          </ul>
          <p className="mt-4 text-sm">Small samples produce wide uncertainty. Report the interval, not just the point estimate.</p>
        </Section>

        <Section id="tradeoffs" step="7 · Inspect trade-offs" title="Judge weaknesses and other risks">
          <ul className="grid gap-3 sm:grid-cols-2">
            {JUDGE_RISKS.map(([t, d]) => (
              <li key={t} className="rounded-lg border border-border bg-card p-4">
                <p className="font-semibold">{t}</p>
                <p className="mt-1 text-sm text-muted-foreground">{d}</p>
              </li>
            ))}
          </ul>
        </Section>

        <Section id="quiz" step="8 · Check understanding" title="Check your thinking">
          <ThinkingCheck questions={QUIZ_EVAL} />
        </Section>

        <Section id="notes" step="9 · Capture a takeaway" title="Thinking points">
          <Takeaways data={TAKEAWAY_EVAL} />
        </Section>

        <footer className="flex flex-col gap-4 rounded-lg border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">Ready for the next idea?</p>
          <Link to="/lessons/$slug" params={{ slug: "guardrails" }} className={btnVariants({ variant: "ghost" })}>
            Next: Lesson 4 (planned) <ArrowRight className="size-4" aria-hidden />
          </Link>
        </footer>
      </div>
    </article>
  );
}
