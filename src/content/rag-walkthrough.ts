import { getApolloQuestion } from "./apollo";
import { routeDecision, type EngineState } from "@/lib/apollo-engine";
export interface WalkthroughStep {
  title: string;
  short: string;
  work: { title: string; detail: string }[];
}

export const KNOWLEDGE_WALKTHROUGH: WalkthroughStep[] = [
  {
    title: "Read and identify the source material",
    short: "Sources",
    work: [
      { title: "Identify the source", detail: "Keep the publisher and source URL with the text." },
      {
        title: "Retain readable text",
        detail:
          "Review the prepared excerpt or paraphrase. This replay does not fetch or parse a live page.",
      },
      {
        title: "Keep its provenance",
        detail:
          "Carry the version and original locator forward. Label separately authored test material.",
      },
    ],
  },
  {
    title: "Turn source material into bounded chunks",
    short: "Chunks",
    work: [
      {
        title: "Choose a useful boundary",
        detail:
          "Keep related facts together in one passage. The boundaries in this lab are curated.",
      },
      {
        title: "Measure the passage",
        detail:
          "Estimate its token size so the application can later fit evidence into a context budget.",
      },
      {
        title: "Attach an ID and source",
        detail: "Give each chunk a stable ID, source locator, version, and eligibility metadata.",
      },
    ],
  },
  {
    title: "Encode each chunk as a numeric vector",
    short: "Embeddings",
    work: [
      {
        title: "Read the chunk text",
        detail: "Use the passage itself as the encoder input, not just its title or ID.",
      },
      {
        title: "Count seven concept groups",
        detail:
          "This toy encoder counts explicit word groups. A production embedding model learns a much richer representation.",
      },
      {
        title: "Normalise the vector",
        detail:
          "Divide the feature counts by their vector length. Query encoding will use exactly the same representation.",
      },
    ],
  },
  {
    title: "Store vectors together with the original evidence",
    short: "Index",
    work: [
      {
        title: "Pair the vector with its chunk",
        detail: "Store the numeric representation beside its passage ID.",
      },
      {
        title: "Retain text and metadata",
        detail:
          "The index must lead back to the text, locator, version, and eligibility. Numbers alone cannot ground an answer.",
      },
      {
        title: "Publish a searchable snapshot",
        detail:
          "The prepared local snapshot is now ready. No question or language-model generation was needed to build it.",
      },
    ],
  },
];

export const REQUEST_WALKTHROUGH: WalkthroughStep[] = [
  {
    title: "Understand what the question needs",
    short: "Question",
    work: [
      {
        title: "Read the whole question",
        detail: "Keep every requested part, including who walked and who remained in orbit.",
      },
      {
        title: "Identify the required facts",
        detail:
          "Reviewed fixture labels define what this preset needs. This is not an LLM question analyser.",
      },
    ],
  },
  {
    title: "Check the request and its access scope",
    short: "Access",
    work: [
      {
        title: "Validate the request",
        detail: "Check the application input before consulting the index or a cache.",
      },
      {
        title: "Enforce the scope",
        detail:
          "Application code decides which records may be accessed. Prompt instructions do not grant permission.",
      },
      {
        title: "Forward the checked request",
        detail:
          "Only an accepted request can reach the router. A refusal returns directly to the user.",
      },
    ],
  },
  {
    title: "Choose a route and check scoped caches",
    short: "Route",
    work: [
      {
        title: "Choose the task path",
        detail:
          "A metadata lookup can use application logic. Generation profiles are simulated here.",
      },
      {
        title: "Match the full cache contract",
        detail:
          "Compare question, scope, index version, and configuration. A prompt-prefix hit still needs generation.",
      },
      {
        title: "Follow the cache decision",
        detail:
          "A miss continues to retrieval. A hit carries the reused draft straight to checks, bypassing model generation.",
      },
    ],
  },
  {
    title: "Retrieve passages that match the question",
    short: "Retrieve",
    work: [
      {
        title: "Represent the query",
        detail:
          "Keyword search uses terms; toy semantic search encodes the question in the same seven-feature space as the index.",
      },
      {
        title: "Compare and rank",
        detail:
          "Send this question's search representation to the prepared knowledge index. The model has not been called.",
      },
      {
        title: "Return ranked passages",
        detail:
          "The index returns candidate passage IDs and scores to retrieval. They are evidence candidates, not an answer.",
      },
    ],
  },
  {
    title: "Assemble a bounded evidence context",
    short: "Context",
    work: [
      {
        title: "Filter and remove repeats",
        detail:
          "Apply eligibility, the limited injection heuristic, and deduplication settings to candidate passages.",
      },
      {
        title: "Fit the evidence budget",
        detail: "Keep selected passage text and provenance within the configured token estimate.",
      },
    ],
  },
  {
    title: "Use an optional bounded tool",
    short: "Tool",
    work: [
      {
        title: "Check whether a tool is enabled",
        detail:
          "A fixed RAG workflow does not need a general autonomous agent. No tool is the default.",
      },
      {
        title: "Validate, execute, and bound",
        detail:
          "For an enabled fixture, validate arguments and permissions, allow one read, and check returned data against the budget.",
      },
      {
        title: "Return the bounded tool result",
        detail:
          "Return one source passage to this question's context. A rejected or failed call returns a status notice instead.",
      },
    ],
  },
  {
    title: "Check whether the evidence is sufficient",
    short: "Enough?",
    work: [
      {
        title: "Compare facts with evidence",
        detail:
          "Check every required fact against the selected passages using reviewed fixture annotations.",
      },
      {
        title: "Decide whether to continue",
        detail:
          "If evidence is missing, stop with an evidence gap. A larger model cannot create a missing source.",
      },
    ],
  },
  {
    title: "Generate a draft from the assembled input",
    short: "Draft",
    work: [
      {
        title: "Combine instructions, question, and evidence",
        detail:
          "The retrieved passages augment the model input. They do not retrain model weights.",
      },
      {
        title: "Produce an untrusted draft",
        detail:
          "This lab fills reviewed answer templates with citation IDs. A real system would call its selected language model here.",
      },
    ],
  },
  {
    title: "Verify claims and their citations",
    short: "Verify",
    work: [
      {
        title: "Resolve every citation",
        detail:
          "An invented or missing reference must not pass just because the answer sounds plausible.",
      },
      {
        title: "Check actual support",
        detail:
          "The cited passage must support the claim. This verifier uses exact reviewed templates and annotations.",
      },
      {
        title: "Keep or withhold the draft",
        detail:
          "An approved draft continues to the final permission check. An invalid draft is withheld and the user receives a status notice.",
      },
    ],
  },
  {
    title: "Recheck current permission to release",
    short: "Recheck",
    work: [
      {
        title: "Read current source status",
        detail:
          "A source may have been revoked after retrieval, generation, or an earlier cached approval.",
      },
      {
        title: "Apply the release boundary",
        detail:
          "Application code blocks content that is no longer eligible, even if its claim check passed.",
      },
      {
        title: "Allow or stop release",
        detail:
          "Continue only with current permission. A revoked source returns a refusal, not the factual draft.",
      },
    ],
  },
  {
    title: "Release the checked answer with its evidence",
    short: "Answer",
    work: [
      {
        title: "Collect approved claims",
        detail:
          "Require the applicable verification and eligibility checks to pass before factual content is released.",
      },
      {
        title: "Keep the evidence trail",
        detail:
          "Return the answer with resolvable citations, or preserve the specific reason no answer was released.",
      },
    ],
  },
];

/** One takeaway stays beside the scene while the full output is readable in the adjacent panel. */
export const KNOWLEDGE_TAKEAWAYS = [
  "The source identity stays attached to the text as it enters the system.",
  "A chunk is a bounded passage with its own ID and a path back to the source.",
  "The passage becomes numbers. These bars are its actual seven toy-vector values.",
  "The index links numbers to passages and sources. It is ready before any question is asked.",
];
export const REQUEST_TAKEAWAYS = [
  "The question defines which facts the system needs to find.",
  "Application permissions decide which evidence this request may access.",
  "Routing and cache checks determine which work this request can reuse.",
  "Retrieval finds candidate passages. Similarity alone does not prove an answer.",
  "Only selected passages enter the context. The token budget changes what the model can see.",
  "A tool runs only when its arguments and application permissions allow it.",
  "Missing evidence is a reason to stop before generating a factual answer.",
  "The draft is still untrusted. Its claims must pass the following checks.",
  "Claims must resolve to allowed passages that actually support them.",
  "Source eligibility is checked again before anything reaches the user.",
  "The user receives only the released result, with its evidence or a clear reason for stopping.",
];

/** Concrete prose for this exact request; the next stage never supplies an earlier stage's input. */
export function requestWalkthroughStep(
  stage: number,
  before: EngineState,
  after?: EngineState,
): WalkthroughStep {
  const base = REQUEST_WALKTHROUGH[stage]!;
  const step = { ...base, work: base.work.map((w) => ({ ...w })) };
  const decision = routeDecision(before.ctx.question, before.config);
  const question = getApolloQuestion(before.ctx.question);
  const set = (i: number, title: string, detail: string) => {
    step.work[i] = { title, detail };
  };
  if (stage === 0) {
    set(0, "Carry this question into the system", before.ctx.question);
    set(
      1,
      "Identify what this question asks",
      question.note + " The same question stays visible throughout this run.",
    );
  }
  if (stage === 1) {
    set(
      0,
      "Validate this untrusted user message",
      `${before.ctx.question.length} characters are checked against the allowed length. The limited pattern check looks for instruction-override attempts such as “ignore previous instructions”. Detection is not an authentication or permission system.`,
    );
    set(
      1,
      "Check the application's read scope",
      `This request has scope “${before.config.scope}”. Reading the public fixture corpus requires scope “public”. A model, prompt, or retrieved document cannot grant missing permission.`,
    );
  }
  if (stage === 1 && after?.halted)
    set(2, "Return a refusal before routing", after.results[1]!.output.join(" "));
  if (stage === 2) {
    set(
      0,
      decision.route === "application"
        ? "Choose application code, not a model call"
        : `Select the ${decision.route === "large" ? "large LLM" : "small LLM"} for later`,
      decision.reason + " Selecting a model does not call it. First obtain and check the evidence.",
    );
    set(
      1,
      before.config.answerCache
        ? "Send the request contract to the answer cache"
        : "Do not reuse an answer in this example",
      before.config.answerCache
        ? "Look up this exact question, access scope, index version, prompt version, and relevant settings. A similar question is not enough."
        : "Approved-answer caching is disabled for this example. Stay at the router; no model call has happened.",
    );
    set(
      2,
      after?.ctx.usage.answerHit
        ? "Cache hit: go straight to output checks"
        : before.config.answerCache
          ? "Cache miss: continue to retrieval"
          : "Continue to retrieval before generation",
      after?.ctx.usage.answerHit
        ? "A previous successful local fixture run seeded this approved answer. Reuse its claims and evidence IDs, skip retrieval and both models, and recheck citations and current permissions before release."
        : `There is no reusable approved answer. Send this question to ${decision.route === "application" ? "a known-record lookup" : "retrieval"}. The selected ${decision.route === "application" ? "application path" : decision.route + " model"} waits until context is ready.`,
    );
  }
  if (stage === 3) {
    set(
      0,
      decision.route === "application"
        ? "Send the known record ID to the index"
        : "Send the question from router to retrieval",
      decision.route === "application"
        ? "The crew-manifest request has a known record ID. Use a direct lookup, with no embedding search and no LLM."
        : "The cache decision is complete. Retrieval now receives this same question; neither model has generated anything.",
    );
    set(
      1,
      decision.route === "application"
        ? "Read the allowed crew record"
        : "Search the prepared knowledge index",
      decision.route === "application"
        ? "Read the eligible crew record and retain its source identity."
        : `Use ${before.config.mode} search to compare the question with stored passages. Search returns candidates, not a model answer.`,
    );
    set(
      2,
      "Return this question's ranked passages",
      "Send the candidate IDs and scores back to retrieval, ready for context assembly. Their text and provenance remain linked.",
    );
  }
  if (stage === 5) {
    set(
      0,
      "Propose one source-read call",
      before.ctx.context.length === 0
        ? 'No usable passage survived selection. The question names A11-LA-CAP as its fallback, so this fixed workflow proposes get_source_passage({ evidence_id: "A11-LA-CAP" }) to read the known source behind the spacecraft question.'
        : "This experiment enables one source lookup. It may be redundant if A11-LA-CAP is already in context; the tool does not get to invent a new goal.",
    );
    set(
      1,
      "Validate arguments and read permission",
      "Allow only get_source_passage, require evidence_id to be a string, enforce evidence:read, and allow at most one read. No arbitrary code, write operation, or automatic retry is available.",
    );
    set(
      2,
      after?.halted
        ? "Return the tool failure safely"
        : "Put the source result back into this context",
      after?.halted
        ? after.results[5]!.output.at(-1)!
        : "The result is data, not an instruction. Retain A11-LA-CAP with its provenance, apply the context budget, and check sufficiency before calling the model.",
    );
  }
  if (stage === 6 && after?.halted)
    set(
      1,
      "Return an evidence-gap notice",
      "The indexed sources do not support every requested fact. Stop before generation and tell the same user what is missing. A larger model cannot create a missing source.",
    );
  if (stage === 7) {
    set(
      0,
      decision.route === "application"
        ? "Build the answer in application code"
        : `Send the assembled input to the ${decision.route === "large" ? "large LLM" : "small LLM"}`,
      decision.route === "application"
        ? "Read the reviewed crew fields and source IDs directly. Both LLMs stay idle."
        : `Now, and only now, the selected ${decision.route} profile receives instructions, this question, and ${before.ctx.context.length} evidence passages. The other model is not used.`,
    );
    set(
      1,
      "Produce an untrusted draft",
      "The local fixture fills reviewed answer templates with citation IDs. A real system would call the selected model here. The draft must still pass output checks.",
    );
  }
  if (stage === 8) {
    set(
      0,
      before.ctx.usage.answerHit
        ? "Send the reused answer to checks"
        : "Send the draft to output checks",
      before.ctx.usage.answerHit
        ? "An approved-answer hit saves generation, not validation. Check the reused claims against their supplied evidence."
        : "Move the draft from its actual generator to the check boundary. A fluent answer is still untrusted.",
    );
    if (after?.halted)
      set(
        2,
        "Withhold the bad draft and notify the user",
        after.ctx.checks.find((c) => !c.resolves || !c.supported)?.reason +
          (after.config.fault === "badCitation"
            ? ". UNKNOWN-SPAN does not exist in the supplied evidence, so no factual answer is released."
            : ". The factual draft is withheld and the user receives the reason."),
      );
  }
  if (stage === 9) {
    set(
      0,
      "Ask for current source eligibility",
      "The output check asks the source registry whether every cited passage is still allowed. This is a permission read, not a new retrieval or model call.",
    );
    set(
      1,
      "Return the current source status",
      "Return the latest eligibility and versions to the output-check boundary. An earlier approval or cache hit cannot override a revocation.",
    );
    if (after?.halted)
      set(
        2,
        "Return a withheld-answer notice",
        "Current permission failed. Return the reason to the user and keep the factual draft withheld.",
      );
  }
  return step;
}
