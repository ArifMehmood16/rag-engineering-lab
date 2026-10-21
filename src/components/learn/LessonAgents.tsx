import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import {
  AGENT_REQUIREMENTS, BOUNDED_CONTROLS, COMPACT, DISTINCTIONS, FILTER, FOLLOWUP_CODE, NEVER_COMPACT, NOT_OFFERED,
  QUIZ_AGENTS, RECOMMENDATION, RETAIN, TAKEAWAY_AGENTS, TOOLS, VERIFY,
} from "@/content/lesson-agents";
import { getLesson } from "@/content/lessons";
import { ContextBudgetLab, ToolCallLab } from "./AgentLabs";
import { Takeaways } from "./Takeaways";
import { ThinkingCheck } from "./ThinkingCheck";
import { Badge, Callout, CodeBlock, Section, btnVariants } from "./ui";

const TOC = [
  ["understand", "Understand it"], ["lab", "See it work"], ["apply", "Apply it to EvidenceLens"], ["assess", "Assess the current plan"],
  ["implement", "Try a small implementation"], ["verify", "Verify the change"], ["tradeoffs", "Inspect trade-offs"], ["quiz", "Check understanding"], ["notes", "Capture a takeaway"],
] as const;

const List = ({ title, items, tone }: { title: string; items: string[]; tone?: "warn" }) => (
  <div className="rounded-lg border border-border bg-card p-4">
    <p className="font-semibold">{title}</p>
    <ul className="mt-2 space-y-1 text-sm">
      {items.map((x) => <li key={x} className={tone === "warn" ? "text-destructive" : undefined}>• {x}</li>)}
    </ul>
  </div>
);

export function LessonAgents() {
  const lesson = getLesson("tools-agents")!;
  return (
    <article className="mx-auto max-w-4xl px-5 py-10 lg:px-10">
      <header>
        <p className="eyebrow">Lesson 05 · {lesson.concept}</p>
        <h1 className="mt-2 text-4xl font-medium sm:text-5xl">{lesson.title}</h1>
        <p className="prose-body mt-4 max-w-2xl text-muted-foreground">
          “Agent” is not a synonym for “app with an LLM”. Most of what a RAG system needs is a workflow your code controls — with tools the model may
          propose but never runs itself.
        </p>
        <nav aria-label="Lesson sections" className="mt-6 flex flex-wrap gap-2">
          {TOC.map(([id, label], i) => (
            <a key={id} href={`#${id}`} className="rounded-full border border-border bg-card px-3 py-1 text-xs hover:bg-muted">{i + 1}. {label}</a>
          ))}
        </nav>
      </header>

      <div className="mt-10 space-y-14">
        <Section id="understand" step="1 · Understand it" title="Tools, workflows, and agents">
          <dl className="grid gap-3 sm:grid-cols-2">
            {DISTINCTIONS.map(([t, d]) => (
              <div key={t} className="rounded-lg border border-border bg-card p-4"><dt className="font-semibold">{t}</dt><dd className="mt-1 text-sm text-muted-foreground">{d}</dd></div>
            ))}
          </dl>
          <h3 className="mt-8 text-2xl">Context: retain, filter, compact</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <List title="Retain" items={RETAIN} />
            <List title="Filter out" items={FILTER} />
            <List title="Compact carefully" items={COMPACT} />
            <List title="Never compact away" items={NEVER_COMPACT} tone="warn" />
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Callout title="Context is not enforcement" tone="accent">Writing permissions into the prompt does not enforce them. Authorization and release state live in application code; secrets never enter the model’s context.</Callout>
            <Callout title="A summary is not evidence" tone="accent">A conversational summary can carry intent forward. It must never stand in for the original supporting passages and their locators.</Callout>
          </div>
        </Section>

        <Section id="lab" step="2 · See it work" title="Tool-call walkthrough and context budget">
          <h3 className="text-2xl">A. The tool-call / result loop</h3>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {TOOLS.map((t) => (
              <div key={t.name} className="rounded-md border border-border bg-card p-3 text-sm">
                <p className="font-mono text-xs font-semibold">{t.name}</p>
                <p className="mt-1 text-muted-foreground">{t.description}</p>
                <p className="mt-1 font-mono text-[0.7rem]">scope {t.scope} · ≤{t.maxResults} results · {t.timeoutMs} ms</p>
                <Badge tone="proposed" className="mt-2">Proposed · read-only</Badge>
              </div>
            ))}
          </div>
          <p className="mt-3 text-sm text-muted-foreground">Deliberately not offered: {NOT_OFFERED.join(", ")}.</p>
          <div className="mt-5"><ToolCallLab /></div>
          <h3 className="mt-12 text-2xl">B. Context-budget lab</h3>
          <p className="prose-body mb-4 mt-2 max-w-2xl">Toggle passages into the context. More passages is not better — watch qualifiers, duplicates, and whether the conflicting trial stays visible.</p>
          <ContextBudgetLab />
        </Section>

        <Section id="apply" step="3 · Apply it to EvidenceLens" title="The decision: bounded workflow first">
          <blockquote className="rounded-lg border-l-4 border-primary bg-primary-soft p-5 font-serif text-xl">{RECOMMENDATION}</blockquote>
          <p className="prose-body mt-4 max-w-2xl">The planned targeted follow-up retrieval does not need an agent. Ordinary Python application code can decide when one extra, scoped retrieval runs, and stop after it.</p>
          <div className="mt-4 rounded-lg border border-border bg-card p-4">
            <p className="font-semibold">If a future agent is ever explored, it must have <Badge tone="planned">Planned requirement</Badge></p>
            <ul className="mt-2 grid gap-1 text-sm sm:grid-cols-3">{AGENT_REQUIREMENTS.map((x) => <li key={x}>• {x}</li>)}</ul>
          </div>
        </Section>

        <Section id="assess" step="4 · Assess the current plan" title="Review finding">
          <div className="grid gap-3 md:grid-cols-3">
            <Callout title="Already planned" tone="primary">Bounded context, evidence selection, provenance, and limited follow-up behaviour.</Callout>
            <Callout title="Optional" tone="neutral">Model-selected read-only tool calls — only for a demonstrated use case.</Callout>
            <Callout title="Not recommended now" tone="accent">An autonomous agent without a task the workflow demonstrably fails to serve.</Callout>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">All EvidenceLens capabilities are planned; none is implemented, and no results exist.</p>
        </Section>

        <Section id="implement" step="5 · Try a small implementation" title="One follow-up, orchestrated by code">
          <CodeBlock label="Illustrative bounded follow-up loop" code={FOLLOWUP_CODE} />
          <h3 className="mt-8 text-xl">Bounded-loop controls</h3>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {BOUNDED_CONTROLS.map(([t, d]) => (
              <li key={t} className="rounded-lg border border-border bg-card p-4"><p className="font-semibold">{t}</p><p className="mt-1 text-sm text-muted-foreground">{d}</p></li>
            ))}
          </ul>
        </Section>

        <Section id="verify" step="6 · Verify the change" title="How you would know it works">
          <ul className="space-y-2 text-sm">{VERIFY.map((v) => <li key={v} className="rounded-md border border-border bg-card px-3 py-2">{v}</li>)}</ul>
        </Section>

        <Section id="tradeoffs" step="7 · Inspect trade-offs" title="What could go wrong">
          <ul className="grid gap-3 sm:grid-cols-2">
            {[
              ["Rigidity", "A fixed workflow may miss questions that need an unforeseen extra step — and that is the evidence to collect before adding an agent."],
              ["Agent cost and variance", "Dynamic loops make latency, cost, and behaviour harder to bound and to evaluate reproducibly."],
              ["Over-filtering", "Aggressive deduplication can drop a distinct publication that adds a subgroup or limitation."],
              ["Lossy compaction", "Summaries that drop qualifiers or conflicts quietly make answers more confident than the evidence."],
              ["Hidden failures", "Timeouts or denials treated as empty results look like real evidence gaps."],
              ["Tool sprawl", "Each new tool widens the attack and test surface; read-only and narrow is the default."],
            ].map(([t, d]) => (
              <li key={t} className="rounded-lg border border-border bg-card p-4"><p className="font-semibold">{t}</p><p className="mt-1 text-sm text-muted-foreground">{d}</p></li>
            ))}
          </ul>
        </Section>

        <Section id="quiz" step="8 · Check understanding" title="Check your thinking">
          <ThinkingCheck questions={QUIZ_AGENTS} />
        </Section>

        <Section id="notes" step="9 · Capture a takeaway" title="Thinking points">
          <Takeaways data={TAKEAWAY_AGENTS} />
        </Section>

        <footer className="flex flex-col gap-4 rounded-lg border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">That completes the five lessons.</p>
          <Link to="/" className={btnVariants({ variant: "ghost" })}><ArrowLeft className="size-4" aria-hidden /> Back to overview</Link>
        </footer>
      </div>
    </article>
  );
}
