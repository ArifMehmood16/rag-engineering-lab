import { Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { QUIZ, RRF_CODE, STAGES, WRITING_TOPIC } from "@/content/lesson-context";
import { getLesson } from "@/content/lessons";
import { useProgress } from "@/lib/storage";
import { cn } from "@/lib/utils";
import { NotesPanel } from "./NotesPanel";
import { Quiz } from "./Quiz";
import { RetrievalLab } from "./RetrievalLab";
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

const stageTone = { info: "border-info/40 bg-info-soft", primary: "border-primary/40 bg-primary-soft", accent: "border-accent/50 bg-accent-soft" };

function Detail({ summary, children }: { summary: string; children: React.ReactNode }) {
  return (
    <details className="group rounded-lg border border-border bg-card p-4">
      <summary className="cursor-pointer font-semibold">{summary}</summary>
      <div className="mt-3 space-y-2 text-sm leading-relaxed">{children}</div>
    </details>
  );
}

export function LessonContext() {
  const lesson = getLesson("context")!;
  const { completed, toggle, available } = useProgress();
  const done = completed.includes(lesson.slug);

  return (
    <article className="mx-auto max-w-4xl px-5 py-10 lg:px-10">
      <header>
        <p className="eyebrow">Lesson 01 · {lesson.concept}</p>
        <h1 className="mt-2 text-4xl font-medium sm:text-5xl">{lesson.title}</h1>
        <p className="prose-body mt-4 max-w-2xl text-muted-foreground">
          Retrieval gives a model evidence it was never trained on. But finding text that looks relevant is only the beginning: what you select, and
          whether it can actually answer the question, matters as much.
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
        <Section id="understand" step="1 · Understand it" title="What RAG does">
          <div className="prose-body max-w-2xl">
            <p>
              <strong>Retrieval-augmented generation</strong> retrieves passages from a document collection and places them in the model’s context, so
              the answer can draw on, and cite, specific evidence rather than only what the model absorbed in training.
            </p>
            <p>
              An <strong>embedding</strong> is a list of numbers produced by a <em>particular model</em> and preprocessing process. Documents are
              embedded ahead of time; at query time the question is embedded with the same model, and the system finds passages whose vectors lie
              nearby. That is why “nightly rest quality” can match a question about “sleep”: the vectors are close even when the words differ.
            </p>
            <p>
              Exact-word (lexical) search works differently. It rewards shared terms — which preserves ingredient names, identifiers, and units that
              embeddings may blur, but misses synonyms and paraphrase.
            </p>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Callout title="Similarity is not confidence" tone="accent">
              A high similarity score says a passage is near the query in one model’s space. It is not a calibrated probability that any claim is
              true or supported.
            </Callout>
            <Callout title="A citation is not proof" tone="accent">
              A retrieved, cited passage may still concern a different formulation, population, or outcome. Citation existence and citation support
              are separate checks.
            </Callout>
          </div>
          <div className="mt-4">
            <Detail summary="Deeper: compatible vector spaces and index migration">
              <p>
                Document and query vectors must come from compatible model spaces. Vectors from different models — or the same family at a different
                dimension — are not comparable. Changing the embedding model therefore means re-embedding the corpus into a new, versioned index and
                migrating to it deliberately, rather than mixing old and new vectors.
              </p>
            </Detail>
          </div>
        </Section>

        <Section id="lab" step="2 · See it work" title="Retrieval lab">
          <p className="prose-body mb-5 max-w-2xl">
            Start with keyword search, then switch modes and turn on deduplication and reranking. Click any passage to inspect why it was selected or
            rejected. Try the budget slider too: a tight budget forces trade-offs.
          </p>
          <RetrievalLab />
        </Section>

        <Section id="apply" step="3 · Apply it to EvidenceLens" title="Where retrieval fits in the design">
          <p className="prose-body max-w-2xl">
            The current design proposes hybrid retrieval as a sequence of distinct stages. Each answers a different question, and each can fail
            independently. All of these are <strong>planned</strong>; none is implemented.
          </p>
          <ol aria-label="Planned retrieval stages" className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {STAGES.map((s, i) => (
              <li key={s.key} className={cn("rounded-lg border p-4", stageTone[s.tone])}>
                <span className="flex items-center justify-between">
                  <span className="font-mono text-xs">Stage {i + 1}</span>
                  <Badge tone="planned">Planned</Badge>
                </span>
                <p className="mt-2 font-semibold">{s.name}</p>
                <p className="mt-1 text-sm">{s.does}</p>
              </li>
            ))}
          </ol>
          <div className="mt-6 space-y-3">
            <Detail summary="Proposed candidate budgets (experiment settings, not proven values)">
              <ul className="list-disc pl-5">
                <li>Up to 100 lexical and 100 dense candidates</li>
                <li>Approximately 40–60 candidates for reranking</li>
                <li>Approximately 8–12 selected passages</li>
                <li>An initial maximum evidence budget of approximately 8,000 tokens</li>
              </ul>
              <p className="text-muted-foreground">These are starting points for experiments. Their effect on retrieval quality has not been measured.</p>
            </Detail>
            <Detail summary="Recommended change: evaluate lexical, dense, and hybrid retrieval separately before adding reranking">
              <dl className="grid gap-2 sm:grid-cols-[10rem_1fr]">
                <dt className="font-semibold">Problem</dt><dd>Without separate baselines, you cannot tell which stage helps or hurts.</dd>
                <dt className="font-semibold">Expected benefit</dt><dd>Attributable improvements; each stage justified by evidence.</dd>
                <dt className="font-semibold">Relative effort</dt><dd>Medium.</dd>
                <dt className="font-semibold">Dependencies</dt><dd>One eligible document path, compatible embedding/index versions, and labelled development questions.</dd>
                <dt className="font-semibold">Architectural location</dt><dd>Between “pin one index release” and “rerank and assemble context”.</dd>
                <dt className="font-semibold">Data-flow change</dt><dd>Each retriever returns a ranked candidate list with evidence IDs; fusion consumes both.</dd>
                <dt className="font-semibold">Configuration</dt><dd>Candidate counts per retriever, fusion rank constant, and a switch to disable each stage for ablation.</dd>
                <dt className="font-semibold">Storage/API</dt><dd>Record the retrieval configuration and index release alongside each evaluation run.</dd>
                <dt className="font-semibold">Verification</dt><dd>Evidence Recall@k and ranking quality per configuration on the same fixed question set.</dd>
                <dt className="font-semibold">Failure modes</dt><dd>Overfitting the rank constant to a small set; leakage between development and release questions.</dd>
              </dl>
            </Detail>
          </div>
        </Section>

        <Section id="assess" step="4 · Assess the current plan" title="Review finding">
          <div className="grid gap-3 md:grid-cols-3">
            <Callout title="Already planned" tone="primary">
              Structure-aware chunks, versioned embeddings, lexical and dense baselines, fusion, deduplication, reranking, provenance, and sufficiency
              assessment.
            </Callout>
            <Callout title="Still needs evidence" tone="accent">
              Embedding model selection, chunk sizes, retrieval budgets, and actual retrieval quality.
            </Callout>
            <Callout title="Unnecessary initially">
              An additional vector database or graph system, without a measured failure that justifies it.
            </Callout>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Relevant planning references: <span className="font-mono">F07, F09, F10, F13, F14</span>. This review is a learning aid; it does not change
            the sealed master plan.
          </p>
        </Section>

        <Section id="implement" step="5 · Try a small implementation" title="Reciprocal rank fusion">
          <p className="prose-body mb-4 max-w-2xl">
            RRF combines rankings using only positions, so lexical and dense scores never need to share a scale. The lab’s hybrid mode uses the same
            formula.
          </p>
          <CodeBlock code={RRF_CODE} label="Proposed implementation sketch. Not existing EvidenceLens code." />
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Callout title="Scores are ranking signals">
              A fused score such as 0.0328 is not a confidence percentage. It only orders candidates.
            </Callout>
            <Callout title="The constant is a setting">
              <code className="font-mono">rank_constant = 60</code> is a common default, not a proven optimum. It is configurable and should be
              evaluated.
            </Callout>
          </div>
        </Section>

        <Section id="verify" step="6 · Verify the change" title="Check each property separately">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[34rem] text-left text-sm">
              <caption className="sr-only">Verification checks for retrieval</caption>
              <thead className="border-b border-border">
                <tr>
                  <th className="py-2 pr-4 font-semibold">Check</th>
                  <th className="py-2 font-semibold">Question it answers</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr><td className="py-2 pr-4 font-medium">Evidence Recall@k</td><td>Of the passages labelled as needed, how many appear in the top k?</td></tr>
                <tr><td className="py-2 pr-4 font-medium">Ranking quality</td><td>Do the most useful passages appear near the top?</td></tr>
                <tr><td className="py-2 pr-4 font-medium">Study diversity</td><td>How many distinct studies are represented, rather than repeat reports of one?</td></tr>
                <tr><td className="py-2 pr-4 font-medium">Qualifier preservation</td><td>Do selected passages keep population, formulation, and outcome details intact?</td></tr>
                <tr><td className="py-2 pr-4 font-medium">Context sufficiency</td><td>Could the selected evidence answer the question at all — including conflicts?</td></tr>
              </tbody>
            </table>
          </div>
          <p className="prose-body mt-5 max-w-2xl">
            Having sufficient evidence and successfully using it are different things; see{" "}
            <a
              className="text-primary underline underline-offset-2"
              href="https://research.google/pubs/sufficient-context-a-new-lens-on-retrieval-augmented-generation-systems/"
              target="_blank"
              rel="noreferrer"
            >
              Google’s sufficient-context research
            </a>
            . Evaluations for EvidenceLens are planned; no results exist yet.
          </p>
        </Section>

        <Section id="tradeoffs" step="7 · Inspect trade-offs" title="What could go wrong">
          <ul className="grid gap-3 sm:grid-cols-2">
            {[
              ["More passages, more noise", "Extra passages add duplication, latency, cost, and harder contradiction management. They do not automatically improve answers."],
              ["Dropped qualifiers", "Chunking or truncation can separate a finding from its population or formulation, making it look more general than it is."],
              ["Duplicate reports", "Abstracts and full reports of one trial can make a single study look like a consensus."],
              ["Hidden disagreement", "A budget filled with agreeing passages can crowd out a null or conflicting finding."],
              ["Index drift", "Mixing embeddings from different model versions silently degrades similarity."],
              ["Over-engineering", "Adding databases or graph systems before a measured failure adds operating cost without evidence of benefit."],
            ].map(([t, d]) => (
              <li key={t} className="rounded-lg border border-border bg-card p-4">
                <p className="font-semibold">{t}</p>
                <p className="mt-1 text-sm text-muted-foreground">{d}</p>
              </li>
            ))}
          </ul>
        </Section>

        <Section id="quiz" step="8 · Check understanding" title="Quiz">
          <Quiz lessonSlug={lesson.slug} questions={QUIZ} />
        </Section>

        <Section id="notes" step="9 · Capture a takeaway" title="Notes and writing">
          <NotesPanel lessonSlug={lesson.slug} lessonTitle={`Lesson 1: ${lesson.title}`} topic={WRITING_TOPIC} />
        </Section>

        <footer className="flex flex-col gap-4 rounded-lg border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold">{done ? "Lesson marked complete" : "Finished this lesson?"}</p>
            <p className="text-sm text-muted-foreground">
              {available ? "Completion is stored in this browser only." : "Browser storage is unavailable; completion won’t persist."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" aria-pressed={done} className={btnVariants({ variant: done ? "outline" : "primary" })} onClick={() => toggle(lesson.slug, !done)}>
              <CheckCircle2 className="size-4" aria-hidden />
              {done ? "Mark as not complete" : "Mark lesson complete"}
            </button>
            <Link to="/lessons/$slug" params={{ slug: "cost-latency" }} className={btnVariants({ variant: "ghost" })}>
              Next: Lesson 2 (planned) <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </footer>
      </div>
    </article>
  );
}
