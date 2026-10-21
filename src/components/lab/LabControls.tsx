import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { APOLLO_QUESTIONS } from "@/content/apollo";
import { EXPERIMENTS, FAULTS, TOOL_MODES, type ExperimentId } from "@/content/rag-lab";
import { ToggleChip } from "@/components/learn/ui";
import { cn } from "@/lib/utils";
import type { ApolloConfig } from "@/lib/apollo-engine";

function Choices<T extends string | number>({
  label,
  values,
  selected,
  onSelect,
}: {
  label: string;
  values: { value: T; label: string }[];
  selected: T;
  onSelect: (v: T) => void;
}) {
  return (
    <div className="lab-setting">
      <p className="hud-label">{label}</p>
      <div className="choice-row" role="group" aria-label={label}>
        {values.map(({ value, label: text }) => (
          <button
            key={value}
            type="button"
            aria-pressed={selected === value}
            onClick={() => onSelect(value)}
            className={cn("choice-button", selected === value && "selected")}
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}
export function LabControls({
  experiment,
  config,
  questionId,
  onQuestion,
  onConfig,
}: {
  experiment: ExperimentId;
  config: ApolloConfig;
  questionId: string;
  onQuestion: (id: string) => void;
  onConfig: (patch: Partial<ApolloConfig>) => void;
}) {
  const current = EXPERIMENTS.find((e) => e.id === experiment)!;
  const toggle = (key: keyof ApolloConfig, label: string, desc?: string) => (
    <ToggleChip
      label={label}
      {...(desc ? { desc } : {})}
      pressed={Boolean(config[key])}
      onChange={(value) => onConfig({ [key]: value })}
    />
  );
  return (
    <div className="lab-controls-content">
      <div className="control-heading">
        <span className="eyebrow">Experiment {current.number}</span>
        <h2>{current.title}</h2>
        <p>{current.subtitle}</p>
      </div>
      <Choices
        label="Question preset"
        values={APOLLO_QUESTIONS.map((q) => ({ value: q.id, label: q.label }))}
        selected={questionId}
        onSelect={onQuestion}
      />
      {experiment === "retrieval" && (
        <>
          <Choices
            label="Search representation"
            selected={config.mode}
            onSelect={(mode) => onConfig({ mode })}
            values={[
              { value: "keyword", label: "Keyword" },
              { value: "semantic", label: "Toy semantic" },
              { value: "hybrid", label: "Hybrid" },
            ]}
          />
          <Choices
            label="Candidate limit"
            values={[3, 6, 10].map((n) => ({ value: n, label: `${n} passages` }))}
            selected={config.topK}
            onSelect={(topK) => onConfig({ topK })}
          />
          {toggle("rerank", "Rerank candidates", "Transparent toy rule; not a trained reranker")}
          {toggle("dedupe", "Remove repeated evidence", "Two copies are not independent support")}
          <Budget config={config} onConfig={onConfig} />
          <p className="control-note">
            Watch selected passages enter the context, rather than every search result.
          </p>
        </>
      )}
      {experiment === "efficiency" && (
        <>
          {toggle("embeddingCache", "Embedding cache", "Reuse identical toy vectors")}
          {toggle("retrievalCache", "Retrieval cache", "Reuse the scoped candidate list")}
          {toggle(
            "answerCache",
            "Approved-answer cache",
            "Generation can be bypassed; release checks cannot",
          )}
          {toggle(
            "promptCache",
            "Prompt-prefix cache",
            "Simulated provider reuse; generation still runs",
          )}
          {toggle("timestampFirst", "Changing timestamp first", "Break the reusable prompt prefix")}
          <Choices
            label="Generator profile · simulated"
            selected={config.profile}
            onSelect={(profile) => onConfig({ profile })}
            values={[
              { value: "auto", label: "Auto" },
              { value: "small", label: "Small" },
              { value: "large", label: "Large" },
            ]}
          />
          <Choices
            label="Index release"
            selected={config.indexVersion}
            onSelect={(indexVersion) => onConfig({ indexVersion })}
            values={[
              { value: "apollo-v1", label: "Version 1" },
              { value: "apollo-v2", label: "Version 2" },
            ]}
          />
          <p className="control-note">
            Run twice with the same settings. Memory exists only for this page session. Version 2
            uses identical content under a different release ID.
          </p>
        </>
      )}
      {(experiment === "evaluation" || experiment === "guardrails") && (
        <>
          <div className="lab-setting">
            <p className="hud-label">Introduce one controlled fault</p>
            <div className="fault-choices">
              {FAULTS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  aria-pressed={config.fault === f.id}
                  onClick={() => onConfig({ fault: f.id })}
                  className={cn("fault-button", config.fault === f.id && "selected")}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <p className="control-note">{FAULTS.find((f) => f.id === config.fault)?.explanation}</p>
          {experiment === "guardrails" && (
            <>
              {toggle(
                "injectionCheck",
                "Document-injection heuristic",
                "A deliberately limited detector; it can miss attacks",
              )}
              <Choices
                label="Application scope · simulated"
                selected={config.scope}
                onSelect={(scope) => onConfig({ scope })}
                values={[
                  { value: "public", label: "Public access" },
                  { value: "none", label: "Deny access" },
                ]}
              />
              <p className="control-note">
                Scope and citation checks are enforced by local application code, independently of
                the detector.
              </p>
            </>
          )}
        </>
      )}
      {experiment === "tools" && (
        <>
          <Choices
            label="Optional read-only tool"
            values={TOOL_MODES.map((t) => ({ value: t.id, label: t.label }))}
            selected={config.tool}
            onSelect={(tool) => onConfig({ tool })}
          />
          <Budget config={config} onConfig={onConfig} />
          {toggle("dedupe", "Filter repeated passages", "Keep the same evidence only once")}
          <p className="control-note">
            One fixture-selected tool call; validation, permission, a bounded result, and no
            automatic retries. This workflow does not need an autonomous agent.
          </p>
        </>
      )}
      <Link to="/lessons/$slug" params={{ slug: current.lesson }} className="lab-lesson-link">
        Read the full concept <ArrowUpRight size={14} />
      </Link>
    </div>
  );
}
function Budget({
  config,
  onConfig,
}: {
  config: ApolloConfig;
  onConfig: (patch: Partial<ApolloConfig>) => void;
}) {
  return (
    <Choices
      label="Context budget · token estimate"
      values={[35, 120, 260].map((n) => ({ value: n, label: `${n} tokens` }))}
      selected={config.budget}
      onSelect={(budget) => onConfig({ budget })}
    />
  );
}
