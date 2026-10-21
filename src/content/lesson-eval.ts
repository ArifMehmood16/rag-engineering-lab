// Lesson Three content. Edit here; components only render it.
import type { QuizQuestion } from "./lesson-context";
import type { FailureKey } from "@/lib/evaluation";

export const EVAL_VIEWS = [
  { name: "Retrieval evaluation", question: "Did the system find the relevant evidence and rank it usefully?", isolates: "Search, fusion, reranking." },
  { name: "Generation evaluation", question: "Given sufficient, fixed evidence, did the model produce a supported and appropriately qualified answer?", isolates: "The generator, with retrieval held constant." },
  { name: "End-to-end evaluation", question: "Did the complete system produce the correct user-visible outcome under realistic conditions?", isolates: "Nothing — it shows the combined result." },
];

export const FAILURES: { key: FailureKey; label: string; stage: string }[] = [
  { key: "retrievalMiss", label: "Retrieval misses a required passage", stage: "Retrieval" },
  { key: "dropQualifier", label: "Context drops a population qualifier", stage: "Context assembly" },
  { key: "inventNumber", label: "Generation invents a number", stage: "Generation" },
  { key: "badCitation", label: "A citation exists but does not support its claim", stage: "Generation" },
  { key: "omitCitation", label: "An answer omits a necessary citation", stage: "Generation" },
  { key: "falseRefusal", label: "The system refuses an answerable question", stage: "Sufficiency / release" },
  { key: "outage", label: "A provider outage occurs (on Q2)", stage: "Infrastructure" },
];

export const EVAL_QUESTIONS = [
  { id: "Q1", text: "What evidence addresses magnesium glycinate and sleep outcomes in adults?", answerability: "Answerable — 4 labelled evidence units, 4 expected key points" },
  { id: "Q2", text: "What evidence addresses a synthetic ingredient absent from the corpus?", answerability: "Unanswerable — correct outcome is an evidence gap" },
];

export const DATASET_TIERS = [
  { count: 30, name: "Seed questions", use: "Define behaviour and annotation rules; iterate freely." },
  { count: 200, name: "Development questions", use: "Tune retrieval, prompts, and thresholds here." },
  { count: 400, name: "Locked release test", use: "Inspected rarely; run only to decide a release." },
];

export const DATASET_CATEGORIES = ["Direct evidence questions", "Comparisons", "Conflicting findings", "Unanswerable questions", "Robustness cases (rewording, typos, unit variants)"];

export const DATASET_RULES = [
  ["Synthetic questions are candidates", "A generated question becomes part of a set only after review confirms it is well-formed and correctly labelled."],
  ["Control leakage by family", "Questions about the same study, or rewordings of one query, go into the same split — otherwise development tuning leaks into release results."],
  ["Tune only on development data", "Every prompt, threshold, and budget change is chosen using development questions."],
  ["Protect the holdout", "Repeatedly inspecting release-test failures and fixing them turns the holdout into development data."],
  ["Practitioner review is a different question", "Engineering evaluation asks whether the system meets its specification; practitioner review asks whether the output is useful in practice. Neither substitutes for the other."],
];

export const METRIC_DEFS = [
  ["Evidence Recall@k", "Labelled evidence units in the top k ÷ all labelled evidence units."],
  ["nDCG@k", "Graded ranking quality: rewards relevant evidence near the top, normalised by the ideal order."],
  ["Citation correctness", "Citation links whose passage supports the claim ÷ all citation links."],
  ["Citation completeness", "Claims with at least one supporting citation ÷ all claims."],
  ["Unsupported claim rate", "Claims whose content is not supported by the evidence ÷ all claims."],
  ["Useful answer coverage", "Expected key points addressed by supported claims ÷ expected key points."],
  ["Correct abstention", "Unanswerable questions answered with a gap ÷ unanswerable questions scored."],
  ["False abstention", "Answerable questions refused ÷ answerable questions scored."],
  ["Infrastructure error rate", "Requests that failed for operational reasons ÷ requests attempted. Excluded from quality metrics."],
  ["Latency and cost", "Per stage and end-to-end, with usage assumptions recorded."],
];

export const JUDGE_RUBRIC = [
  ["Claim support", "Does the cited passage state what the claim says?"],
  ["Qualifier preservation", "Are population, formulation, dose, and outcome kept as in the source?"],
  ["Completeness", "Are the expected key points, including conflicts, present?"],
  ["Appropriate abstention", "If evidence is insufficient, does the answer say so instead of filling the gap?"],
];

export const JUDGE_RISKS = [
  ["Judge error", "A judge is another model and can be wrong."],
  ["Model and version dependence", "Changing the judge model or prompt changes scores; record both."],
  ["Correlated errors", "A judge similar to the generator may share its blind spots."],
  ["Wording and ordering sensitivity", "Option order or phrasing can shift verdicts; test for it."],
  ["Injection in evidence", "Retrieved text may contain instructions aimed at the judge; treat it as data."],
  ["Comparison with human labels", "Measure agreement with reviewed labels before trusting the judge on a slice."],
  ["Record disagreement", "Keep cases where judge and humans differ; they show where the rubric is unclear."],
];

export const RUN_RECORD = `# Proposed run record (illustrative fields; values are placeholders)
run_id: SYN-RUN-0001
corpus_release: SYN-CORPUS-R3
index_release: SYN-INDEX-R3
question_set: dev-questions@<version>
code_version: <commit>
configuration: retrieval-config@<version>
models:
  generator: <not selected>
  judge: <not selected>
prompt_versions: { generation: <version>, judge: <version> }
raw_outputs: outputs/SYN-RUN-0001.jsonl
stage_timing_ms: { retrieval: <measured>, generation: <measured>, verification: <measured> }
usage_and_cost_assumptions: <recorded per provider pricing at run time>
error_slices: [unanswerable, conflicting, robustness]
sample_sizes: { scored: <n>, infrastructure_errors: <n> }
uncertainty: <interval method and result>`;

export const JUDGE_JSON_LABEL = "Synthetic judge output, generated by rules from the fixture — no model is called.";

export const QUIZ_EVAL: QuizQuestion[] = [
  {
    id: "e1",
    prompt: "Why test generation with fixed evidence?",
    options: ["It is cheaper.", "It separates generator failures from retrieval failures.", "It replaces end-to-end testing.", "Judges require it."],
    answer: 1,
    explanation: "Holding evidence constant means any defect in the answer comes from generation, not from what retrieval happened to find.",
  },
  {
    id: "e2",
    prompt: "A provider outage stops the system from answering an unanswerable question. How is it scored?",
    options: ["As a correct abstention.", "As a false abstention.", "As an infrastructure error, excluded from quality metrics.", "It is ignored entirely."],
    answer: 2,
    explanation: "An outage is not a decision about evidence. Scoring it as correct abstention would reward failures. Try it in the lab.",
  },
  {
    id: "e3",
    prompt: "Every claim has a citation that exists. What do you still not know?",
    options: ["Nothing.", "Whether each cited passage supports its claim, and whether key points are missing.", "Only the latency.", "Whether the JSON is valid."],
    answer: 1,
    explanation: "Citation existence is not citation support, and a fully supported answer can still be incomplete.",
  },
  {
    id: "e4",
    prompt: "You keep reviewing release-test failures and fixing each one. What happens?",
    options: ["Release results become more trustworthy.", "The release test becomes development data and stops estimating unseen performance.", "Nothing changes.", "Recall improves."],
    answer: 1,
    explanation: "A holdout only measures generalisation while it remains unseen by tuning decisions.",
  },
  {
    id: "e5",
    prompt: "What does a judge’s “rationale” field give you?",
    options: ["Access to the model’s hidden reasoning.", "Proof of clinical validity.", "An inspectable justification you can check against the evidence.", "A calibrated probability."],
    answer: 2,
    explanation: "The rationale is output text to inspect and audit, not a window into internal reasoning — and it establishes nothing clinical.",
  },
];

export const TAKEAWAY_EVAL = {
  topic: "Why retrieval and generation need separate evaluations",
  points: [
    { prompt: "Explain it in your own words", tip: "A wrong answer can come from missing evidence or from misusing good evidence; one score cannot tell you which." },
    { prompt: "What might surprise you", tip: "A wrong citation leaves the unsupported-claim rate untouched; only citation correctness moves." },
    { prompt: "Where it fits in EvidenceLens", tip: "Evaluation spans the system offline; it is not a synchronous step in every request." },
    { prompt: "An experiment worth running", tip: "Measure judge agreement with reviewed labels on a development slice before using it to compare configurations." },
    { prompt: "A result that would change the plan", tip: "If judge–human disagreement concentrates on qualifier cases, the rubric needs revision before any comparison." },
  ],
  outline: [
    { label: "The misconception", guidance: "One accuracy score tells you whether a RAG system works." },
    { label: "The concept", guidance: "Retrieval, generation with fixed evidence, and end-to-end evaluations answer different questions." },
    { label: "An EvidenceLens design example", guidance: "An outage on an unanswerable question that must not count as correct abstention." },
    { label: "A trade-off", guidance: "LLM-as-judge scales review but introduces its own errors and version dependence." },
    { label: "An experiment to validate it", guidance: "Inject one failure at a time into fixtures and confirm the expected metric moves." },
    { label: "What remains unknown", guidance: "No labelled datasets, harness, or results exist yet." },
  ],
};
