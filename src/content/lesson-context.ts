// Lesson One content and synthetic fixtures. Edit text here; components only render it.
// Every passage below is invented for teaching. IDs are synthetic and findings are not real.

export interface Passage {
  id: string;
  docId: string;
  studyId: string | null;
  title: string;
  text: string;
  population: string;
  formulation: string;
  outcome: string;
  sourceType: "Trial report" | "Secondary publication" | "Commentary";
  version: string;
  locator: string;
  tokens: number;
  /** Curated toy similarity standing in for a dense retriever. Not a probability. */
  toySimilarity: number;
  matches: { formulation: boolean; population: boolean; outcome: boolean };
  direction?: "improvement" | "no-difference" | "not-applicable";
  lesson: string;
}

export const LAB_QUESTION =
  "What evidence addresses magnesium glycinate and sleep outcomes in adults?";

export const PASSAGES: Passage[] = [
  {
    id: "P1",
    docId: "SYN-DOC-101",
    studyId: "SYN-STUDY-A",
    title: "Trial report, results section",
    text: "In this synthetic trial of adults, magnesium glycinate was compared with placebo. Adults completed a sleep quality questionnaire; the sleep score favoured the glycinate arm.",
    population: "Adults (synthetic cohort)",
    formulation: "Magnesium glycinate",
    outcome: "Self-reported sleep quality",
    sourceType: "Trial report",
    version: "v2",
    locator: "Results §3.1, para 2",
    tokens: 420,
    toySimilarity: 0.86,
    matches: { formulation: true, population: true, outcome: true },
    direction: "improvement",
    lesson: "A direct match: the formulation, population, and outcome all align with the question.",
  },
  {
    id: "P2",
    docId: "SYN-DOC-102",
    studyId: "SYN-STUDY-A",
    title: "Conference abstract of the same trial",
    text: "Abstract: adults receiving magnesium glycinate reported better sleep scores than placebo in a trial of adults.",
    population: "Adults (synthetic cohort)",
    formulation: "Magnesium glycinate",
    outcome: "Self-reported sleep quality",
    sourceType: "Secondary publication",
    version: "v1",
    locator: "Abstract, sentence 2",
    tokens: 380,
    toySimilarity: 0.84,
    matches: { formulation: true, population: true, outcome: true },
    direction: "improvement",
    lesson: "Same underlying study as P1. Counting it again would make one trial look like two.",
  },
  {
    id: "P3",
    docId: "SYN-DOC-103",
    studyId: "SYN-STUDY-B",
    title: "Trial report, methods and results",
    text: "Adults received magnesium oxide nightly; time to fall asleep was recorded. Sleep onset changed little.",
    population: "Adults (synthetic cohort)",
    formulation: "Magnesium oxide",
    outcome: "Sleep onset latency",
    sourceType: "Trial report",
    version: "v1",
    locator: "Results table 2",
    tokens: 300,
    toySimilarity: 0.8,
    matches: { formulation: false, population: true, outcome: true },
    direction: "not-applicable",
    lesson:
      "A different formulation. Magnesium oxide evidence does not answer a glycinate question.",
  },
  {
    id: "P4",
    docId: "SYN-DOC-104",
    studyId: "SYN-STUDY-C",
    title: "Trial report in adolescents",
    text: "Adolescents took magnesium glycinate before bed and kept sleep diaries.",
    population: "Adolescents (synthetic cohort)",
    formulation: "Magnesium glycinate",
    outcome: "Sleep diary entries",
    sourceType: "Trial report",
    version: "v1",
    locator: "Results §2, para 1",
    tokens: 340,
    toySimilarity: 0.79,
    matches: { formulation: true, population: false, outcome: true },
    direction: "not-applicable",
    lesson: "A different population. The question asks about adults.",
  },
  {
    id: "P5",
    docId: "SYN-DOC-105",
    studyId: "SYN-STUDY-D",
    title: "Trial report, primary endpoint",
    text: "Adults took magnesium glycinate; serum magnesium concentration was the primary endpoint. Sleep was mentioned only as background motivation.",
    population: "Adults (synthetic cohort)",
    formulation: "Magnesium glycinate",
    outcome: "Serum magnesium concentration",
    sourceType: "Trial report",
    version: "v3",
    locator: "Methods §2.4",
    tokens: 360,
    toySimilarity: 0.62,
    matches: { formulation: true, population: true, outcome: false },
    direction: "not-applicable",
    lesson: "A different endpoint. Many matching words, but no sleep outcome was measured.",
  },
  {
    id: "P6",
    docId: "SYN-DOC-106",
    studyId: null,
    title: "Narrative commentary",
    text: "Commentary: magnesium glycinate is popular for sleep. Discussing a trial of magnesium glycinate in adults, the author speculates about sleep benefits.",
    population: "Not a study population",
    formulation: "Magnesium glycinate (discussed)",
    outcome: "Sleep (discussed)",
    sourceType: "Commentary",
    version: "v1",
    locator: "Para 4",
    tokens: 280,
    toySimilarity: 0.74,
    matches: { formulation: true, population: true, outcome: true },
    direction: "not-applicable",
    lesson:
      "Commentary about a study, not the study itself. Keyword search ranks it highly because it repeats the terms.",
  },
  {
    id: "P7",
    docId: "SYN-DOC-107",
    studyId: "SYN-STUDY-E",
    title: "Trial report using different wording",
    text: "Grown participants took a chelated bisglycinate mineral supplement; nightly rest quality was rated on a validated scale and improved modestly.",
    population: "Adults (synthetic cohort)",
    formulation: "Magnesium bisglycinate (synonym)",
    outcome: "Rated rest quality",
    sourceType: "Trial report",
    version: "v1",
    locator: "Results §3, para 3",
    tokens: 400,
    toySimilarity: 0.78,
    matches: { formulation: true, population: true, outcome: true },
    direction: "improvement",
    lesson:
      "Relevant but shares no exact query words. Keyword search misses it; dense search can find it.",
  },
  {
    id: "P8",
    docId: "SYN-DOC-108",
    studyId: "SYN-STUDY-F",
    title: "Trial report on a different supplement",
    text: "Melatonin and sleep in adults: a synthetic trial report.",
    population: "Adults (synthetic cohort)",
    formulation: "Melatonin",
    outcome: "Sleep onset",
    sourceType: "Trial report",
    version: "v1",
    locator: "Abstract",
    tokens: 260,
    toySimilarity: 0.7,
    matches: { formulation: false, population: true, outcome: true },
    direction: "not-applicable",
    lesson: "Topically nearby, but a different ingredient entirely.",
  },
  {
    id: "P9",
    docId: "SYN-DOC-109",
    studyId: "SYN-STUDY-G",
    title: "Trial report with a null finding",
    text: "Adult volunteers took magnesium glycinate or placebo; the sleep quality score showed no meaningful difference between groups.",
    population: "Adults (synthetic cohort)",
    formulation: "Magnesium glycinate",
    outcome: "Self-reported sleep quality",
    sourceType: "Trial report",
    version: "v2",
    locator: "Results §3.2",
    tokens: 390,
    toySimilarity: 0.81,
    matches: { formulation: true, population: true, outcome: true },
    direction: "no-difference",
    lesson: "A conflicting finding. A trustworthy brief must keep it next to the positive results.",
  },
];

export const RRF_CODE = `from collections import defaultdict


def reciprocal_rank_fusion(
    rankings: list[list[str]],
    rank_constant: int = 60,
) -> list[tuple[str, float]]:
    if rank_constant <= 0:
        raise ValueError("rank_constant must be positive")

    scores: dict[str, float] = defaultdict(float)

    for ranking in rankings:
        unique_ids = dict.fromkeys(ranking)

        for rank, evidence_id in enumerate(unique_ids, start=1):
            scores[evidence_id] += 1.0 / (rank_constant + rank)

    return sorted(
        scores.items(),
        key=lambda item: (-item[1], item[0]),
    )`;

export const STAGES = [
  {
    key: "lexical",
    name: "Lexical search",
    does: "Preserves exact ingredient names, identifiers, units, and numeric terms.",
    tone: "info",
  },
  {
    key: "dense",
    name: "Dense search",
    does: "Retrieves conceptually related wording through embedding similarity.",
    tone: "info",
  },
  {
    key: "fusion",
    name: "Fusion",
    does: "Combines the two candidate rankings into one list.",
    tone: "primary",
  },
  {
    key: "rerank",
    name: "Reranking",
    does: "Changes candidate order using a closer look at each passage against the question.",
    tone: "primary",
  },
  {
    key: "assembly",
    name: "Context assembly",
    does: "Chooses passages under a budget while keeping qualifiers and contradictory findings.",
    tone: "accent",
  },
  {
    key: "sufficiency",
    name: "Sufficiency assessment",
    does: "Asks whether the selected evidence can answer the question at all.",
    tone: "accent",
  },
] as const;

export interface QuizQuestion {
  id: string;
  prompt: string;
  options: string[];
  answer: number;
  explanation: string;
}

export const QUIZ: QuizQuestion[] = [
  {
    id: "q1",
    prompt: "A passage has the highest similarity score for the question. What does that tell you?",
    options: [
      "The answer built from it is very likely correct.",
      "It is close to the query in one model's vector space — nothing more about support.",
      "It is a primary study.",
      "It can be cited without checking.",
    ],
    answer: 1,
    explanation:
      "Similarity is a ranking signal from a particular model and preprocessing. It is not a calibrated probability that a claim is supported. P6 (commentary) and P5 (wrong endpoint) both look similar.",
  },
  {
    id: "q2",
    prompt:
      "You switch embedding models from one with 768 dimensions to one with 1,024. What must happen?",
    options: [
      "Nothing; vectors are interchangeable.",
      "Only new documents need the new model.",
      "Documents and queries must share a compatible space, so the index needs a planned migration and re-embedding.",
      "Increase the reranking budget.",
    ],
    answer: 2,
    explanation:
      "Query and document vectors must come from compatible model spaces. Changing model or dimension means re-embedding and a versioned index migration, not mixing vectors.",
  },
  {
    id: "q3",
    prompt: "Why does the design propose hybrid retrieval rather than only dense search?",
    options: [
      "Lexical search keeps exact names, identifiers, and units that dense search can blur; dense search finds related wording lexical search misses.",
      "Hybrid retrieval is always more accurate.",
      "Dense search cannot rank results.",
      "It removes the need for reranking.",
    ],
    answer: 0,
    explanation:
      "Each retriever fails differently. In the lab, keyword search misses P7 (bisglycinate, different wording) while dense search alone can still surface wrong-formulation passages. Whether hybrid helps must be measured.",
  },
  {
    id: "q4",
    prompt: "Adding more passages to the context will usually…",
    options: [
      "Always improve answer quality.",
      "Possibly add noise, duplication, latency, and harder contradiction handling.",
      "Reduce cost.",
      "Make citations correct.",
    ],
    answer: 1,
    explanation:
      "More is not better by default. Selection should maximise distinct, qualifier-matching studies — including conflicting ones — within a budget.",
  },
  {
    id: "q5",
    prompt: "An answer cites P1 and the citation ID exists. Is the claim supported?",
    options: [
      "Yes, because the citation exists.",
      "Not necessarily: a separate check must confirm the cited passage actually supports the specific claim.",
      "Yes, if the similarity score is above 0.8.",
      "Only if the passage is short.",
    ],
    answer: 1,
    explanation:
      "Citation existence is not citation support. Verification compares the claim with the cited span, including its population, formulation, and outcome.",
  },
];

export const WRITING_TOPIC = "Why retrieval similarity is not answer confidence";

export const TAKEAWAY_CONTEXT = {
  topic: "Why retrieval similarity is not answer confidence",
  points: [
    {
      prompt: "Explain it in your own words.",
      tip: "Try one sentence: retrieval finds nearby text; something else must decide whether that text answers the question.",
    },
    {
      prompt: "What surprised you?",
      tip: "The most keyword-dense passage in the lab (P6) is commentary, and the most useful paraphrase (P7) shares no query words.",
    },
    {
      prompt: "Where does it fit in EvidenceLens?",
      tip: "Between pinning an index release and generation: retrieve, fuse, deduplicate, rerank, assemble, then assess sufficiency.",
    },
    {
      prompt: "What experiment would you run?",
      tip: "Compare lexical, dense, and hybrid retrieval on the same labelled questions, measuring Recall@k and study diversity separately.",
    },
    {
      prompt: "What result would change your mind?",
      tip: "If dense-only retrieval matched hybrid on identifiers and units, the lexical path might not justify its cost.",
    },
  ],
  outline: [
    {
      label: "The misconception",
      guidance: "A high similarity score means the answer is probably right.",
    },
    {
      label: "The concept",
      guidance:
        "Embeddings measure closeness in one model’s space; support is a separate property of a claim and its evidence.",
    },
    {
      label: "An EvidenceLens design example",
      guidance:
        "A glycinate question retrieving oxide, adolescent, and commentary passages — and how the planned stages handle each.",
    },
    {
      label: "A trade-off",
      guidance:
        "More passages improve recall but add duplication, latency, and contradiction-handling difficulty.",
    },
    {
      label: "An experiment to validate it",
      guidance: "Separate retrieval baselines evaluated on labelled development questions.",
    },
    {
      label: "What remains unknown",
      guidance:
        "Model choice, chunk sizes, budgets, and real retrieval quality — none measured yet.",
    },
  ],
};
