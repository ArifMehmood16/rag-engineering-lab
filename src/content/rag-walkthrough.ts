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
          "Score the stored passages, combine rankings when configured, and retain the candidate IDs. Similarity is not proof.",
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
