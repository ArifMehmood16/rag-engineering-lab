// Pure, deterministic logic for Lesson Five: tool-call loop and context budget.

export type ArgType = "string" | "integer";
export interface ToolSpec {
  name: string;
  description: string;
  args: Record<string, { type: ArgType; required: boolean; max?: number }>;
  /** Scope the caller's token must hold. Enforced by application code. */
  scope: string;
  timeoutMs: number;
  maxResults: number;
}

export interface ToolCallCase {
  id: string;
  title: string;
  question: string;
  tool: string;
  args: Record<string, unknown>;
  callerScopes: string[];
  /** Simulated execution behaviour of the synthetic tool. */
  latencyMs: number;
  results: string[];
}

export type StepStatus = "ok" | "blocked" | "warn" | "skipped";
export interface Step {
  key: string;
  label: string;
  status: StepStatus;
  detail: string;
}
export interface Walkthrough {
  steps: Step[];
  outcome: "answered" | "rejected" | "denied" | "timed_out" | "evidence_gap";
  outcomeText: string;
}

export function validateArgs(spec: ToolSpec, args: Record<string, unknown>): string[] {
  const errors: string[] = [];
  for (const [k, rule] of Object.entries(spec.args)) {
    const v = args[k];
    if (v === undefined) {
      if (rule.required) errors.push(`missing required argument "${k}"`);
      continue;
    }
    if (rule.type === "integer" && (!Number.isInteger(v) || (v as number) < 1)) errors.push(`"${k}" must be a positive integer`);
    if (rule.type === "string" && (typeof v !== "string" || v.trim() === "")) errors.push(`"${k}" must be a non-empty string`);
    if (rule.max !== undefined && typeof v === "number" && v > rule.max) errors.push(`"${k}" exceeds maximum ${rule.max}`);
  }
  for (const k of Object.keys(args)) if (!(k in spec.args)) errors.push(`unknown argument "${k}"`);
  return errors;
}

export function walkToolCall(c: ToolCallCase, tools: ToolSpec[]): Walkthrough {
  const steps: Step[] = [];
  const skip = (from: number, labels: [string, string][]) =>
    labels.slice(from).forEach(([key, label]) => steps.push({ key, label, status: "skipped", detail: "Not reached." }));
  const LABELS: [string, string][] = [
    ["propose", "Model proposes a tool call"],
    ["validate", "Application validates arguments"],
    ["permit", "Application checks permission"],
    ["execute", "Application executes the tool"],
    ["result", "Bounded result returns with call ID"],
    ["use", "Model uses the result"],
    ["release", "Application applies release checks"],
  ];
  const spec = tools.find((t) => t.name === c.tool);
  steps.push({ key: "propose", label: LABELS[0]![1], status: "ok", detail: `${c.tool}(${JSON.stringify(c.args)}) — a proposal only; nothing has run.` });

  if (!spec) {
    steps.push({ key: "validate", label: LABELS[1]![1], status: "blocked", detail: `"${c.tool}" is not on the allow-list.` });
    skip(2, LABELS);
    return { steps, outcome: "rejected", outcomeText: "Unknown tool rejected. The model may be told the call failed; it never runs." };
  }
  const errs = validateArgs(spec, c.args);
  if (errs.length) {
    steps.push({ key: "validate", label: LABELS[1]![1], status: "blocked", detail: errs.join("; ") });
    skip(2, LABELS);
    return { steps, outcome: "rejected", outcomeText: "Invalid arguments rejected before execution. A structured error goes back with the call ID; retries are capped." };
  }
  steps.push({ key: "validate", label: LABELS[1]![1], status: "ok", detail: "Arguments match the declared schema and limits." });

  if (!c.callerScopes.includes(spec.scope)) {
    steps.push({ key: "permit", label: LABELS[2]![1], status: "blocked", detail: `Caller lacks scope "${spec.scope}". Checked in code, not by the model.` });
    skip(3, LABELS);
    return { steps, outcome: "denied", outcomeText: "Permission denied. No data leaves the tool; the answer must proceed without it or report the limitation." };
  }
  steps.push({ key: "permit", label: LABELS[2]![1], status: "ok", detail: `Server-side scope "${spec.scope}" present.` });

  if (c.latencyMs > spec.timeoutMs) {
    steps.push({ key: "execute", label: LABELS[3]![1], status: "blocked", detail: `Exceeded ${spec.timeoutMs} ms timeout (simulated ${c.latencyMs} ms).` });
    skip(4, LABELS);
    return { steps, outcome: "timed_out", outcomeText: "Timed out. Recorded as an infrastructure failure — not as an abstention and not as evidence of absence." };
  }
  steps.push({ key: "execute", label: LABELS[3]![1], status: "ok", detail: `Completed in simulated ${c.latencyMs} ms (limit ${spec.timeoutMs} ms).` });

  const bounded = c.results.slice(0, spec.maxResults);
  if (bounded.length === 0) {
    steps.push({ key: "result", label: LABELS[4]![1], status: "warn", detail: "call_01 → [] (zero eligible results)." });
    steps.push({ key: "use", label: LABELS[5]![1], status: "warn", detail: "Model must not fill the gap from memory." });
    steps.push({ key: "release", label: LABELS[6]![1], status: "ok", detail: "Release an explicit evidence gap." });
    return { steps, outcome: "evidence_gap", outcomeText: "Empty result → evidence gap (or one bounded follow-up retrieval). Not an escalation to a larger model." };
  }
  const trimmed = c.results.length > bounded.length ? ` (${c.results.length - bounded.length} trimmed to cap ${spec.maxResults})` : "";
  steps.push({ key: "result", label: LABELS[4]![1], status: "ok", detail: `call_01 → ${bounded.join(", ")}${trimmed}` });
  steps.push({ key: "use", label: LABELS[5]![1], status: "ok", detail: "Draft cites only IDs returned under call_01." });
  steps.push({ key: "release", label: LABELS[6]![1], status: "ok", detail: "Citations resolve, eligibility rechecked, claims verified." });
  return { steps, outcome: "answered", outcomeText: "Answer released after checks. The tool result alone never bypasses verification." };
}

// ---------- Context budget ----------

export interface Passage {
  id: string;
  study: string;
  tokens: number;
  text: string;
  qualifiers: string[];
  /** Passage this one duplicates (same study, same content). */
  duplicateOf?: string;
  /** Finding direction, used to detect contradictions. */
  direction: "benefit" | "no_difference" | "context";
}

export interface BudgetReport {
  used: number;
  budget: number;
  overBudget: boolean;
  studiesCovered: string[];
  studiesTotal: number;
  qualifiersKept: string[];
  qualifiersLost: string[];
  duplicates: string[];
  contradictionAvailable: boolean;
  contradictionIncluded: boolean;
  passagesSelected: number;
  verdict: "good" | "weak" | "invalid";
  notes: string[];
}

export function evaluateContext(all: Passage[], selected: string[], budget: number, requiredQualifiers: string[]): BudgetReport {
  const sel = all.filter((p) => selected.includes(p.id));
  const used = sel.reduce((s, p) => s + p.tokens, 0);
  const studies = [...new Set(all.map((p) => p.study))];
  const covered = [...new Set(sel.map((p) => p.study))];
  const kept = requiredQualifiers.filter((q) => sel.some((p) => p.qualifiers.includes(q)));
  const lost = requiredQualifiers.filter((q) => !kept.includes(q));
  const duplicates = sel.filter((p) => p.duplicateOf && selected.includes(p.duplicateOf)).map((p) => p.id);
  const dirs = new Set(all.map((p) => p.direction));
  const contradictionAvailable = dirs.has("benefit") && dirs.has("no_difference");
  const selDirs = new Set(sel.map((p) => p.direction));
  const contradictionIncluded = selDirs.has("benefit") && selDirs.has("no_difference");
  const notes: string[] = [];
  const overBudget = used > budget;
  if (overBudget) notes.push(`Over budget by ${used - budget} tokens — the context would be truncated unpredictably.`);
  if (duplicates.length) notes.push(`${duplicates.length} duplicate passage(s) spend ${sel.filter((p) => duplicates.includes(p.id)).reduce((s, p) => s + p.tokens, 0)} tokens without new evidence.`);
  if (lost.length) notes.push(`Lost qualifier(s): ${lost.join(", ")}. The answer could over-generalise.`);
  if (contradictionAvailable && !contradictionIncluded) notes.push("Conflicting evidence was omitted — the answer would look more certain than the evidence is.");
  if (covered.length < studies.length) notes.push(`${studies.length - covered.length} of ${studies.length} studies not represented.`);
  const verdict: BudgetReport["verdict"] = overBudget || sel.length === 0 ? "invalid" : lost.length === 0 && duplicates.length === 0 && (!contradictionAvailable || contradictionIncluded) ? "good" : "weak";
  if (verdict === "good") notes.push("Within budget, qualifiers preserved, conflict visible, no duplicates. Passage count is not the goal.");
  return {
    used,
    budget,
    overBudget,
    studiesCovered: covered,
    studiesTotal: studies.length,
    qualifiersKept: kept,
    qualifiersLost: lost,
    duplicates,
    contradictionAvailable,
    contradictionIncluded,
    passagesSelected: sel.length,
    verdict,
    notes,
  };
}
