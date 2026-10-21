import { createFileRoute, Link } from "@tanstack/react-router";
import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowUpRight,
  Check,
  ChevronDown,
  Expand,
  GitCompareArrows,
  Layers,
  Pause,
  Play,
  RotateCcw,
  SkipForward,
  SlidersHorizontal,
  Square,
  X,
  Zap,
} from "lucide-react";
import { APOLLO_RECORDS, APOLLO_QUESTIONS, DEFAULT_QUESTION } from "@/content/apollo";
import {
  DEFAULT_LEARNING_PATH,
  EXPERIMENTS,
  KNOWLEDGE_STAGES,
  STAGE_EXPLANATIONS,
  type ExperimentId,
} from "@/content/rag-lab";
import { LabControls } from "@/components/lab/LabControls";
import { RagFlow } from "@/components/lab/RagFlow";
import { EvidenceCard, RunInspector } from "@/components/lab/RunInspector";
import { CompareRuns, OUTCOMES, RunReport } from "@/components/lab/RunReport";
import { Badge, CopyButton, ToggleChip, btnVariants } from "@/components/learn/ui";
import {
  advance,
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
const SPEEDS = [0.5, 1, 2] as const;

export function Lab() {
  const [engine, setEngine] = useState<EngineState>(() => initEngine(DEFAULT_QUESTION));
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(1);
  const [selected, setSelected] = useState(0);
  const [knowledge, setKnowledge] = useState<number | null>(null);
  const [knowledgeStep, setKnowledgeStep] = useState(3);
  const [indexing, setIndexing] = useState(false);
  const [experiment, setExperiment] = useState<ExperimentId>("retrieval");
  const [evidence, setEvidence] = useState<string | null>(null);
  const [reduced, setReduced] = useState(false);
  const [low, setLow] = useState(false);
  const [visible, setVisible] = useState(true);
  const [compare, setCompare] = useState(false);
  const [controlsOpen, setControlsOpen] = useState(false);
  const [focus, setFocus] = useState(false);
  const finished = engine.halted || engine.cursor >= ENGINE_STAGES.length - 1;
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
  useEffect(() => {
    if (!playing || finished || !visible) return;
    const timer = setTimeout(() => {
      const next = advance(engine, APOLLO_RECORDS);
      setEngine(next);
      setSelected(next.cursor);
      setKnowledge(null);
      if (next.halted || next.cursor === ENGINE_STAGES.length - 1) setPlaying(false);
    }, 1200 / speed);
    return () => clearTimeout(timer);
  }, [playing, finished, visible, engine, speed]);
  useEffect(() => {
    if (!indexing || !visible) return;
    if (knowledgeStep >= 3) {
      setIndexing(false);
      return;
    }
    const timer = setTimeout(() => {
      setKnowledgeStep((n) => n + 1);
      setKnowledge((n) => (n ?? 0) + 1);
    }, 1000 / speed);
    return () => clearTimeout(timer);
  }, [indexing, knowledgeStep, visible, speed]);

  const inspect = (n: number) => {
    setSelected(n);
    setKnowledge(null);
  };
  const configure = (patch: Partial<ApolloConfig>) => {
    setPlaying(false);
    setIndexing(false);
    setSelected(0);
    setKnowledge(null);
    setEngine((s) => initEngine(s.ctx.question, { ...s.config, ...patch }, s.memory));
  };
  const chooseQuestion = (id: string) => {
    setPlaying(false);
    setSelected(0);
    setKnowledge(null);
    setEngine((s) =>
      initEngine(APOLLO_QUESTIONS.find((q) => q.id === id)!.text, s.config, s.memory),
    );
  };
  const start = () => {
    setIndexing(false);
    setKnowledge(null);
    if (finished) setEngine((s) => initEngine(s.ctx.question, s.config, s.memory));
    setPlaying(true);
  };
  const step = () => {
    setPlaying(false);
    setIndexing(false);
    const next = advance(engine, APOLLO_RECORDS);
    setEngine(next);
    inspect(next.cursor >= 0 ? next.cursor : 0);
  };
  const complete = () => {
    setPlaying(false);
    setIndexing(false);
    setKnowledge(null);
    let next = finished ? initEngine(engine.ctx.question, engine.config, engine.memory) : engine;
    for (let n = 0; n < ENGINE_STAGES.length; n++) next = advance(next, APOLLO_RECORDS);
    setEngine(next);
    setSelected(next.cursor);
  };
  const reset = () => {
    setEngine(initEngine(DEFAULT_QUESTION));
    setPlaying(false);
    setIndexing(false);
    setKnowledgeStep(3);
    setSelected(0);
    setKnowledge(null);
    setCompare(false);
  };
  const applyPath = (path: (typeof DEFAULT_LEARNING_PATH)[number]) => {
    setEngine(
      initEngine(APOLLO_QUESTIONS.find((q) => q.id === (path.questionId ?? "crew"))!.text, {
        ...DEFAULT_CONFIG,
        ...path.config,
      }),
    );
    setExperiment(path.experiment);
    setPlaying(false);
    setIndexing(false);
    setKnowledge(null);
    setSelected(0);
  };
  const selectedRecord = APOLLO_RECORDS.find((r) => r.id === evidence);
  const runLabel = finished
    ? OUTCOMES[engine.ctx.outcome]
    : playing
      ? "Following the request"
      : engine.cursor === -1
        ? "Ready to explore"
        : "Paused";
  const narratedStage = ENGINE_STAGES[playing && !finished ? engine.cursor + 1 : selected]!;
  const narration =
    knowledge !== null
      ? KNOWLEDGE_STAGES[knowledge]!
      : { title: narratedStage.name, detail: STAGE_EXPLANATIONS[narratedStage.id]!.why };
  const outline = `# ${current.subtitle}: a lab observation\n\n1. Misconception: [What did you expect?]\n2. Concept: ${current.title}.\n3. Observation: This local simulation ended with ${OUTCOMES[engine.ctx.outcome].toLowerCase()}. It selected ${engine.ctx.context.length} passages, used approximately ${engine.ctx.tokensUsed} context tokens, and made ${engine.ctx.usage.generationCalls} fixture-generation calls.\n4. Trade-off: [Which change helped, hurt, or made no difference?]\n5. Proposed EvidenceLens experiment: ${current.transfer}\n6. Unknown: No real model or production benchmark ran. [What would you measure next?]\n`;

  return (
    <div className={cn("rag-lab", (reduced || low) && "lab-low-motion", focus && "lab-focus")}>
      <header className="lab-intro">
        <div>
          <p className="eyebrow">
            <span className="live-indicator" /> The intelligence lab / interactive systems
          </p>
          <h1>
            See how <span>RAG works.</span>
          </h1>
          <p>
            Follow the evidence. Build the context. Inspect what the model receives—and what reaches
            the user.
          </p>
        </div>
        <div className="intro-badges">
          <Badge tone="synthetic">Local simulation</Badge>
          <span>Source-backed fixtures · no live LLM</span>
          <span>Example data: 2 NASA pages</span>
        </div>
      </header>

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

        <section className="lab-main" aria-label="Working RAG pipeline">
          <div className="run-toolbar" role="group" aria-label="Run controls">
            <button
              type="button"
              onClick={start}
              disabled={playing}
              className={btnVariants({ variant: "primary", size: "sm" })}
            >
              <Play size={14} aria-hidden />
              {finished ? "Repeat request" : engine.cursor >= 0 ? "Resume" : "Run the pipeline"}
            </button>
            <button
              type="button"
              onClick={() => setPlaying(false)}
              disabled={!playing}
              className={btnVariants({ size: "sm" })}
            >
              <Pause size={14} aria-hidden />
              Pause
            </button>
            <button
              type="button"
              onClick={step}
              disabled={finished || playing}
              className={btnVariants({ size: "sm" })}
            >
              <SkipForward size={14} aria-hidden />
              Step
            </button>
            <button
              type="button"
              onClick={complete}
              disabled={playing}
              className={btnVariants({ size: "sm" })}
            >
              <Zap size={14} aria-hidden />
              {finished ? "Repeat instantly" : "Run to result"}
            </button>
            <button
              type="button"
              onClick={reset}
              className={btnVariants({ variant: "ghost", size: "sm" })}
              title="Clear run and in-memory caches"
            >
              <Square size={13} aria-hidden />
              Reset
            </button>
            <div className="speed-controls" role="group" aria-label="Playback speed">
              {SPEEDS.map((s) => (
                <button
                  key={s}
                  type="button"
                  aria-pressed={s === speed}
                  onClick={() => setSpeed(s)}
                >
                  {s}×
                </button>
              ))}
            </div>
          </div>
          <div className="pipeline-status" aria-live="polite">
            <span className={cn("status-lamp", playing && "running", engine.halted && "stopped")} />
            <strong>{runLabel}</strong>
            <span>
              {engine.results.length} / {ENGINE_STAGES.length} request stages
            </span>
            <button type="button" aria-pressed={focus} onClick={() => setFocus(!focus)}>
              <Expand size={12} aria-hidden />
              {focus ? "Exit focus" : "Focus on flow"}
            </button>
            <button
              type="button"
              onClick={() => {
                setPlaying(false);
                setKnowledgeStep(0);
                setKnowledge(0);
                setIndexing(true);
              }}
            >
              <RotateCcw size={12} aria-hidden />
              Replay knowledge preparation
            </button>
          </div>
          <div className="flow-narration" aria-live="polite">
            <span>
              {indexing
                ? "Preparing knowledge"
                : playing
                  ? "Now processing"
                  : "Understand the stage"}
            </span>
            <strong>{narration.title}</strong>
            <p>{narration.detail}</p>
          </div>
          <RagFlow
            engine={engine}
            records={APOLLO_RECORDS}
            playing={playing && visible}
            reduced={reduced || low}
            selected={selected}
            onSelect={inspect}
            onKnowledge={setKnowledge}
            knowledgeStep={knowledgeStep}
            indexing={indexing && visible}
          />
          <p className="diagram-instruction">
            <Layers size={14} aria-hidden />
            Click a stage to inspect its data. The upper path prepares knowledge; the lower path
            answers a question. Retrieval adds evidence to the prompt—it does not retrain the LLM.
          </p>
          <nav className="execution-timeline" aria-label="Detailed execution trace">
            {ENGINE_STAGES.map((stage, i) => (
              <button
                key={stage.id}
                type="button"
                aria-pressed={knowledge === null && selected === i}
                onClick={() => inspect(i)}
                data-state={
                  engine.results[i]?.status ??
                  (playing && i === engine.cursor + 1 ? "active" : "waiting")
                }
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
