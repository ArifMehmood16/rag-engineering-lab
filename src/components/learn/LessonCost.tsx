import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import {
  ANSWER_EXTRA_FIELDS,
  CACHE_KEY_CODE,
  QUIZ_COST,
  RETRIEVAL_CONTRACT_FIELDS,
  ROUTING_PROGRESSION,
  TAKEAWAY_COST,
} from "@/content/lesson-cost";
import { getLesson } from "@/content/lessons";
import { CacheComparison, InvalidationLab, PrefixDemo, RoutingSim } from "./CostLabs";
import { Takeaways } from "./Takeaways";
import { ThinkingCheck } from "./ThinkingCheck";
import { Callout, CodeBlock, Section, btnVariants } from "./ui";

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

export function LessonCost() {
  const lesson = getLesson("cost-latency")!;

  return (
    <article className="mx-auto max-w-4xl px-5 py-10 lg:px-10">
      <header>
        <p className="eyebrow">Lesson 02 · {lesson.concept}</p>
        <h1 className="mt-2 text-4xl font-medium sm:text-5xl">{lesson.title}</h1>
        <p className="prose-body mt-4 max-w-2xl text-muted-foreground">
          Caching and routing both promise to save time and money, but they are separate decisions
          with separate risks. The question is always: what exactly is reused or skipped, and which
          checks must still run?
        </p>
        <nav aria-label="Lesson sections" className="mt-6 flex flex-wrap gap-2">
          {TOC.map(([id, label], i) => (
            <a
              key={id}
              href={`#${id}`}
              className="rounded-full border border-border bg-card px-3 py-1 text-xs hover:bg-muted"
            >
              {i + 1}. {label}
            </a>
          ))}
        </nav>
      </header>

      <div className="mt-10 space-y-14">
        <Section id="understand" step="1 · Understand it" title="Five caches, one routing decision">
          <div className="prose-body max-w-2xl">
            <p>
              A <strong>cache</strong> stores the result of earlier work so it can be reused. The
              five kinds below store very different things, so they are safe under very different
              conditions. Use the tabs (arrow keys work) to compare them.
            </p>
          </div>
          <div className="mt-5">
            <CacheComparison />
          </div>
          <div className="prose-body mt-6 max-w-2xl">
            <p>
              <strong>Model routing</strong> sends different tasks to different processing paths —
              sometimes no model at all, sometimes a smaller or stronger one. Routing saves money
              only if quality holds once retries, escalations, and verification failures are
              counted.
            </p>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Callout title="A prompt-cache hit still generates" tone="accent">
              Prompt caching reuses processing of a shared prefix. The model still writes a new
              response, and verification still runs.
            </Callout>
            <Callout title="A bigger model can’t find missing evidence" tone="accent">
              If the corpus doesn’t support the question, the right outcomes are targeted retrieval,
              a partial answer, or an evidence gap.
            </Callout>
          </div>
        </Section>

        <Section id="lab" step="2 · See it work" title="Three demonstrations">
          <h3 className="text-2xl">A. Prompt prefix</h3>
          <p className="prose-body mb-4 mt-2 max-w-2xl">
            Two requests share a policy, instructions, output contract, and examples. Move the
            timestamp and evidence and watch the reusable prefix change.
          </p>
          <PrefixDemo />
          <p className="mt-3 text-sm text-muted-foreground">
            Prefix requirements, minimum lengths, retention, and usage accounting vary by provider
            and must be checked after one is selected; see{" "}
            <a
              className="text-primary underline underline-offset-2"
              href="https://platform.claude.com/docs/en/build-with-claude/prompt-caching"
              target="_blank"
              rel="noreferrer"
            >
              provider documentation illustrating prompt caching
            </a>
            . No price or saving is implied.
          </p>

          <h3 className="mt-12 text-2xl">B. Approved-answer invalidation</h3>
          <p className="prose-body mb-4 mt-2 max-w-2xl">
            Start from an approved answer, then apply changes. Notice that some changes leave the
            key identical but still block reuse.
          </p>
          <InvalidationLab />

          <h3 className="mt-12 text-2xl">C. Conservative routing</h3>
          <p className="prose-body mb-4 mt-2 max-w-2xl">
            Pick a request and the evidence situation. The simulator shows the path, why, and which
            checks still run.
          </p>
          <RoutingSim />
        </Section>

        <Section
          id="apply"
          step="3 · Apply it to EvidenceLens"
          title="Where caching and routing would fit"
        >
          <ul className="grid gap-3 sm:grid-cols-2">
            {[
              [
                "Embedding cache",
                "At the planned ingestion stage, keyed by text, preprocessing, and embedding-model revision.",
              ],
              [
                "Retrieval cache",
                "After authentication, scope resolution, and index pinning — never before them.",
              ],
              [
                "Approved-answer cache",
                "Checked after scope resolution; a hit still passes current permission and eligibility checks before release.",
              ],
              [
                "Prompt-cache experiment",
                "In prompt assembly: stable policy, instructions, contract, and examples first; question and evidence after.",
              ],
              [
                "Routing",
                "Per task, not per request: metadata lookups need no model; bounded extraction is a candidate experiment.",
              ],
              [
                "Invalidation",
                "Source retraction and exclusion changes propagate to dependent cache entries, including during rollback.",
              ],
            ].map(([t, d]) => (
              <li key={t} className="rounded-lg border border-border bg-card p-4">
                <p className="font-semibold">{t}</p>
                <p className="mt-1 text-sm text-muted-foreground">{d}</p>
                <p className="mt-2 font-mono text-[0.68rem] uppercase text-accent-foreground">
                  Planned / proposed — not implemented
                </p>
              </li>
            ))}
          </ul>
          <h3 className="mt-8 font-sans text-sm font-semibold">
            A conservative routing progression
          </h3>
          <ol className="mt-2 list-decimal space-y-1 pl-5">
            {ROUTING_PROGRESSION.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
          <p className="mt-3 text-sm text-muted-foreground">
            Candidate experiments: structured query interpretation, bounded metadata extraction, and
            a separately evaluated generation task with predictable requirements. A
            conflicting-evidence comparison might need a stronger generator, but model size alone
            does not establish fitness.
          </p>
          <div className="mt-6">
            <Detail summary="Recommended change: specify a provider prompt-cache experiment">
              <dl className="grid gap-2 sm:grid-cols-[10rem_1fr]">
                <dt className="font-semibold">Problem</dt>
                <dd>
                  Prompt caching is not yet designed; prompt order may accidentally defeat it.
                </dd>
                <dt className="font-semibold">Expected benefit</dt>
                <dd>
                  Possible reduction in prefix processing latency and cost; size unknown until
                  measured.
                </dd>
                <dt className="font-semibold">Relative effort</dt>
                <dd>Small, once a provider is selected.</dd>
                <dt className="font-semibold">Dependencies</dt>
                <dd>
                  Provider and model selection; a stable prompt version; a generation baseline.
                </dd>
                <dt className="font-semibold">Architectural location</dt>
                <dd>Prompt assembly, before “generate a structured, cited draft”.</dd>
                <dt className="font-semibold">Data-flow change</dt>
                <dd>
                  None to evidence flow; prompt segments are reordered with stable content first.
                </dd>
                <dt className="font-semibold">Prompt/config</dt>
                <dd>
                  Versioned stable prefix; per-request values (time, question, evidence) only after
                  it.
                </dd>
                <dt className="font-semibold">Storage/API</dt>
                <dd>Record provider-reported cache usage per run, where reported.</dd>
                <dt className="font-semibold">Verification</dt>
                <dd>
                  Cold vs warm latency and cost on the same questions, with unchanged task quality.
                </dd>
                <dt className="font-semibold">Failure modes</dt>
                <dd>
                  Silent prefix drift; provider accounting changes; treating a cache hit as skipping
                  verification.
                </dd>
              </dl>
            </Detail>
          </div>
        </Section>

        <Section id="assess" step="4 · Assess the current plan" title="Review finding">
          <div className="grid gap-3 md:grid-cols-3">
            <Callout title="Already planned" tone="primary">
              Embedding caching, exact retrieval and approved-answer caching, invalidation, and
              exclusion propagation.
            </Callout>
            <Callout title="Needs elaboration" tone="accent">
              Provider prompt caching and a measured routing policy.
            </Callout>
            <Callout title="Deferred">
              Semantic answer caching and a complex learned router.
            </Callout>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Relevant references: <span className="font-mono">F09, F19</span>. Model-access and
            resource decisions are still open. This review does not change the sealed master plan.
          </p>
        </Section>

        <Section id="implement" step="5 · Try a small implementation" title="A versioned cache key">
          <CodeBlock
            code={CACHE_KEY_CODE}
            label="Proposed implementation sketch. Not existing EvidenceLens code."
          />
          <p className="prose-body mt-4 max-w-2xl">
            Canonical JSON makes the key stable regardless of field order. But the hash does not
            make an incomplete contract safe: leave out the authorization scope and two users with
            different permissions share an entry.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Callout title="Retrieval cache contract">
              <ul className="list-disc pl-5">
                {RETRIEVAL_CONTRACT_FIELDS.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </Callout>
            <Callout title="Answer cache adds">
              <ul className="list-disc pl-5">
                {ANSWER_EXTRA_FIELDS.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </Callout>
          </div>
          <p className="mt-3 text-sm">
            A valid key is necessary but does not replace current authorization and
            source-eligibility checks.
          </p>
        </Section>

        <Section id="verify" step="6 · Verify the change" title="Compare, don’t assume">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[34rem] text-left text-sm">
              <caption className="sr-only">Verification checks for caching and routing</caption>
              <thead className="border-b border-border">
                <tr>
                  <th className="py-2 pr-4 font-semibold">Measure</th>
                  <th className="py-2 font-semibold">Why</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  [
                    "Cold vs warm requests",
                    "Shows what reuse actually changes on identical inputs.",
                  ],
                  [
                    "Prefix cache usage (where reported)",
                    "Confirms the prefix is really being reused.",
                  ],
                  ["End-to-end latency", "A faster model step can be hidden by other stages."],
                  ["Total generation + verification cost", "The real cost, not one call’s price."],
                  ["Routing overhead", "Deciding the route has its own cost."],
                  ["Escalation frequency", "Frequent fallbacks erase savings."],
                  ["Task quality", "Savings that lower quality are not savings."],
                  [
                    "Unsafe cache reuse",
                    "Any reuse after retraction or scope change is a defect, at any rate.",
                  ],
                ].map(([a, b]) => (
                  <tr key={a}>
                    <td className="py-2 pr-4 font-medium">{a}</td>
                    <td>{b}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-sm">
            Do not report cheaper model calls as a win if retries, escalations, or verification
            failures erase the saving. No EvidenceLens measurements exist yet.
          </p>
        </Section>

        <Section id="tradeoffs" step="7 · Inspect trade-offs" title="What could go wrong">
          <ul className="grid gap-3 sm:grid-cols-2">
            {[
              [
                "Stale answers",
                "An answer cache without dependency invalidation can resurrect retracted evidence.",
              ],
              [
                "Permission leaks",
                "A key missing authorization scope shares results across users.",
              ],
              [
                "Semantic near-misses",
                "Similar questions with different populations or doses receive the wrong answer.",
              ],
              [
                "Prefix drift",
                "A small change early in the prompt silently disables prompt caching.",
              ],
              [
                "Routing complexity",
                "Each route needs its own evaluation, monitoring, and fallback.",
              ],
              [
                "False economy",
                "Retries and escalations after a cheap model fails can cost more than the baseline.",
              ],
            ].map(([t, d]) => (
              <li key={t} className="rounded-lg border border-border bg-card p-4">
                <p className="font-semibold">{t}</p>
                <p className="mt-1 text-sm text-muted-foreground">{d}</p>
              </li>
            ))}
          </ul>
        </Section>

        <Section id="quiz" step="8 · Check understanding" title="Check your thinking">
          <ThinkingCheck questions={QUIZ_COST} />
        </Section>

        <Section id="notes" step="9 · Capture a takeaway" title="Thinking points">
          <Takeaways data={TAKEAWAY_COST} />
        </Section>
      </div>
    </article>
  );
}
