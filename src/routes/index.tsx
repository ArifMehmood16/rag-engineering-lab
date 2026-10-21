import { createFileRoute, Link } from "@tanstack/react-router";
import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowUpRight,
  Check,
  ChevronDown,
  GitCompareArrows,
  Layers,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { APOLLO_RECORDS, APOLLO_QUESTIONS, DEFAULT_QUESTION } from "@/content/apollo";
import { DEFAULT_LEARNING_PATH, EXPERIMENTS, type ExperimentId } from "@/content/rag-lab";
import { LabControls } from "@/components/lab/LabControls";
import { RagFlow } from "@/components/lab/RagFlow";
import { RagWalkthrough } from "@/components/lab/RagWalkthrough";
import { EvidenceCard, RunInspector } from "@/components/lab/RunInspector";
import { CompareRuns, OUTCOMES, RunReport } from "@/components/lab/RunReport";
import { Badge, CopyButton, ToggleChip, btnVariants } from "@/components/learn/ui";
import {
  DEFAULT_CONFIG,
  ENGINE_STAGES,
  initEngine,
  type ApolloConfig,
  type EngineState,
} from "@/lib/apollo-engine";
import { cn } from "@/lib/utils";

const TITLE = "The Intelligence Lab — See how RAG works";
const DESC =
  "Follow documents into an index, a question into retrieved context, and an LLM draft through verification. Five interactive AI engineering experiments.";
export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Lab,
});

export function Lab() {
  const [engine, setEngine] = useState<EngineState>(() => initEngine(DEFAULT_QUESTION));
  const [prepared, setPrepared] = useState(false);
  const [walkthroughKey, setWalkthroughKey] = useState(0);
  const [explored, setExplored] = useState<string[]>([]);
  const [selected, setSelected] = useState(0);
  const [knowledge, setKnowledge] = useState<number | null>(0);
  const [experiment, setExperiment] = useState<ExperimentId>("retrieval");
  const [evidence, setEvidence] = useState<string | null>(null);
  const [reduced, setReduced] = useState(false);
  const [low, setLow] = useState(false);
  const [visible, setVisible] = useState(true);
  const [compare, setCompare] = useState(false);
  const [controlsOpen, setControlsOpen] = useState(false);
  const current = EXPERIMENTS.find((e) => e.id === experiment)!;
  const questionId = APOLLO_QUESTIONS.find((q) => q.text === engine.ctx.question)?.id ?? "crew";

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const motion = () => setReduced(media.matches);
    const visibility = () => setVisible(!document.hidden);
    motion();
    visibility();
    media.addEventListener("change", motion);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      media.removeEventListener("change", motion);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, []);
  const inspect = (n: number) => {
    setSelected(n);
    setKnowledge(null);
  };
  const configure = (patch: Partial<ApolloConfig>) => {
    setWalkthroughKey((key) => key + 1);
    setSelected(0);
    setKnowledge(null);
    setEngine((s) => initEngine(s.ctx.question, { ...s.config, ...patch }, s.memory));
  };
  const chooseQuestion = (id: string) => {
    setWalkthroughKey((key) => key + 1);
    setSelected(0);
    setKnowledge(null);
    setEngine((s) =>
      initEngine(APOLLO_QUESTIONS.find((q) => q.id === id)!.text, s.config, s.memory),
    );
  };
  const reset = () => {
    setEngine(initEngine(DEFAULT_QUESTION));
    setPrepared(false);
    setWalkthroughKey((key) => key + 1);
    setSelected(0);
    setKnowledge(0);
    setCompare(false);
  };
  const applyPath = (path: (typeof DEFAULT_LEARNING_PATH)[number]) => {
    setWalkthroughKey((key) => key + 1);
    setEngine(
      initEngine(APOLLO_QUESTIONS.find((q) => q.id === (path.questionId ?? "crew"))!.text, {
        ...DEFAULT_CONFIG,
        ...path.config,
      }),
    );
    setExperiment(path.experiment);
    setKnowledge(null);
    setSelected(0);
  };
  const selectedRecord = APOLLO_RECORDS.find((r) => r.id === evidence);
  const outline = `# ${current.subtitle}: a lab observation\n\n1. Misconception: [What did you expect?]\n2. Concept: ${current.title}.\n3. Observation: This local simulation ended with ${OUTCOMES[engine.ctx.outcome].toLowerCase()}. It selected ${engine.ctx.context.length} passages, used approximately ${engine.ctx.tokensUsed} context tokens, and made ${engine.ctx.usage.generationCalls} fixture-generation calls.\n4. Trade-off: [Which change helped, hurt, or made no difference?]\n5. Proposed EvidenceLens experiment: ${current.transfer}\n6. Unknown: No real model or production benchmark ran. [What would you measure next?]\n`;

  return (
    <div className={cn("rag-lab guided-lab", (reduced || low) && "lab-low-motion")}>
      <header className="lab-intro">
        <div>
          <p className="eyebrow">
            <span className="live-indicator" /> The intelligence lab / interactive systems
          </p>
          <h1>
            See how <span>RAG works.</span>
          </h1>
          <p>
            First build the knowledge. Then follow a question. Take each transformation at your own
            pace.
          </p>
        </div>
        <div className="intro-badges">
          <Badge tone="synthetic">Local simulation</Badge>
          <span>Source-backed fixtures · no live LLM</span>
          <span>Example data: 2 NASA pages</span>
        </div>
      </header>

      <RagWalkthrough
        key={walkthroughKey}
        engine={engine}
        records={APOLLO_RECORDS}
        prepared={prepared}
        explored={explored}
        onExplore={(id) => setExplored((seen) => (seen.includes(id) ? seen : [...seen, id]))}
        onPrepared={() => setPrepared(true)}
        onEngine={setEngine}
        onInspect={inspect}
        onKnowledge={setKnowledge}
        onEvidence={setEvidence}
        onReset={reset}
        reduced={reduced || low}
        visible={visible}
      />
      <div className="lab-experiments-heading">
        <p className="eyebrow">Explore after the walkthrough</p>
        <h2>Change one setting. Repeat the same system.</h2>
      </div>

      <nav className="experiment-nav" aria-label="Five AI engineering experiments">
        {EXPERIMENTS.map((e) => (
          <button
            key={e.id}
            type="button"
            aria-pressed={experiment === e.id}
            onClick={() => {
              setExperiment(e.id);
              setControlsOpen(true);
            }}
            className={cn(experiment === e.id && "selected")}
          >
            <span>{e.number}</span>
            <div>
              <strong>{e.title}</strong>
              <small>{e.subtitle}</small>
            </div>
            <ArrowUpRight size={14} aria-hidden />
          </button>
        ))}
      </nav>

      <div className="lab-workspace">
        <section
          className={cn("lab-controls", controlsOpen && "controls-open")}
          aria-label="Experiment configuration"
        >
          <button
            className="mobile-controls-toggle"
            type="button"
            aria-expanded={controlsOpen}
            onClick={() => setControlsOpen(!controlsOpen)}
          >
            <SlidersHorizontal size={15} />
            <span>Configure {current.subtitle}</span>
            <ChevronDown size={14} />
          </button>
          <LabControls
            experiment={experiment}
            config={engine.config}
            questionId={questionId}
            onQuestion={chooseQuestion}
            onConfig={configure}
          />
          <a href="#rag-stage" className="back-to-system">
            Return to the system <ArrowUpRight size={13} />
          </a>
          <details className="display-settings">
            <summary>
              Display & motion <ChevronDown size={13} />
            </summary>
            <ToggleChip
              label="Reduced motion"
              desc="Keep every stage readable without moving packets"
              pressed={reduced}
              onChange={setReduced}
            />
            <ToggleChip
              label="Low effects"
              desc="Disable glows and background patterns"
              pressed={low}
              onChange={setLow}
            />
          </details>
        </section>

        <section className="lab-main" aria-label="Experiment results and details">
          <details className="expanded-flow">
            <summary>Open the expanded system diagram</summary>
            <RagFlow
              engine={engine}
              records={APOLLO_RECORDS}
              playing={false}
              reduced={reduced || low}
              selected={selected}
              onSelect={inspect}
              onKnowledge={setKnowledge}
              knowledgeStep={prepared ? 3 : (knowledge ?? 0)}
              indexing={false}
            />
          </details>
          <p className="diagram-instruction">
            <Layers size={14} aria-hidden />
            Detailed results and evidence stay available here. The guided frame above shows each
            transformation together.
          </p>
          <nav className="execution-timeline" aria-label="Detailed execution trace">
            {ENGINE_STAGES.map((stage, i) => (
              <button
                key={stage.id}
                type="button"
                aria-pressed={knowledge === null && selected === i}
                onClick={() => inspect(i)}
                data-state={engine.results[i]?.status ?? "waiting"}
              >
                <span>
                  {String(i + 1).padStart(2, "0")}
                  {engine.results[i]?.status === "done" && <Check size={10} />}
                </span>
                <strong>{stage.name}</strong>
                <small>{engine.results[i]?.status ?? "waiting"}</small>
              </button>
            ))}
          </nav>
          <div className="run-detail-grid">
            <RunInspector
              engine={engine}
              records={APOLLO_RECORDS}
              selected={selected}
              knowledge={knowledge}
              onEvidence={setEvidence}
            />
            <RunReport engine={engine} records={APOLLO_RECORDS} onEvidence={setEvidence} />
          </div>
        </section>
      </div>

      <div className="lab-bottom-grid">
        <section className="lab-learning-path">
          <p className="eyebrow">Not sure where to begin?</p>
          <h2>Change one thing. Follow the consequence.</h2>
          <div>
            {DEFAULT_LEARNING_PATH.map((p, i) => (
              <button key={p.title} type="button" onClick={() => applyPath(p)}>
                <span>0{i + 1}</span>
                <div>
                  <strong>{p.title}</strong>
                  <p>{p.description}</p>
                </div>
                <ArrowUpRight size={16} />
              </button>
            ))}
          </div>
        </section>
        <section className="lab-transfer">
          <div className="flex flex-wrap items-center gap-2">
            <p className="eyebrow">Apply the concept</p>
            <Badge tone="planned">EvidenceLens · design phase</Badge>
          </div>
          <h2>{current.subtitle}, in your RAG</h2>
          <p>{current.transfer}</p>
          <div className="thinking-point">
            <span className="eyebrow">Thinking point</span>
            <p>{current.thinking}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link to="/lessons/$slug" params={{ slug: current.lesson }} className="lab-lesson-link">
              Explore implementation details <ArrowUpRight size={14} />
            </Link>
            <CopyButton text={outline} label="Copy observation outline" />
          </div>
          <p className="control-note">
            Read-only learning experience. Nothing you select is stored after leaving this page.
          </p>
        </section>
      </div>

      <section className="lab-comparison">
        <button
          className="compare-trigger"
          type="button"
          aria-expanded={compare}
          onClick={() => setCompare(!compare)}
        >
          <GitCompareArrows size={18} />
          <span>
            <strong>Compare with the baseline</strong>
            <small>Same question and data. Inspect the effect of your configuration.</small>
          </span>
          <ArrowDown size={16} className={cn(compare && "rotate-180")} />
        </button>
        {compare && <CompareRuns modified={engine} records={APOLLO_RECORDS} />}
      </section>
      <details className="corpus-details">
        <summary>
          Inspect the example corpus{" "}
          <span>
            {APOLLO_RECORDS.length} records · source-backed passages and labelled test fixtures
          </span>
        </summary>
        <div>
          {APOLLO_RECORDS.map((r) => (
            <EvidenceCard key={r.id} record={r} />
          ))}
        </div>
      </details>
      <footer className="lab-footer">
        <span>THE INTELLIGENCE LAB</span>
        <p>The system is the subject. The dataset makes its behavior inspectable.</p>
        <Link to="/overview">
          Five concepts, explained <ArrowUpRight size={13} />
        </Link>
      </footer>

      <Dialog.Root
        open={evidence !== null}
        onOpenChange={(open) => {
          if (!open) setEvidence(null);
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm" />
          <Dialog.Content className="evidence-dialog">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Dialog.Title className="text-xl font-semibold">
                  Trace back to the evidence
                </Dialog.Title>
                <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                  Original record, source identity, locator, and version.
                </Dialog.Description>
              </div>
              <Dialog.Close
                className={btnVariants({ variant: "ghost", size: "sm" })}
                aria-label="Close evidence inspector"
              >
                <X size={18} />
              </Dialog.Close>
            </div>
            {selectedRecord ? (
              <EvidenceCard record={selectedRecord} />
            ) : (
              <p className="boundary-note">
                This citation ID does not exist in the supplied context.
              </p>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
