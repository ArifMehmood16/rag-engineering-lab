# The Intelligence Lab

An interactive, read-only learning site for five AI engineering concepts: retrieval and embeddings, caching and routing, evaluations, guardrails, and tools/context management.

The home page shows **how RAG works**. Documents become provenance-preserving passages and numeric vectors in an index. A question retrieves passages, builds a bounded context, reaches a generator, and passes through claim/citation and current-eligibility checks before release. Animation follows that data flow rather than depicting hidden model reasoning.

Apollo 11 is a familiar example corpus, not the subject of the visualisation. EvidenceLens remains a **design-phase case study**, with implementation guidance in the five lessons. This lab does not establish EvidenceLens benchmarks, implementation completion, or clinical validation.

## Run locally

For a checkout with dependencies already installed:

```sh
bun run dev
```

Open the local URL printed by Vite. The application uses React, TypeScript, TanStack Start, Tailwind, and accessible HTML/SVG. No model credentials, database, or paid API are needed.

**Dependency-install limitation:** Vite 8.3.5 is retained by the project owner's decision. Its release is currently too recent for the 24-hour minimum-release-age policy in `bunfig.toml`; that policy has not been bypassed. The existing installation builds and runs, but the Bun lockfile still predates the Vite update. Once the age policy permits it, run `bun install` to reconcile the lockfile before relying on `bun install --frozen-lockfile` for a fresh checkout. The npm lockfile already records the installed Vite update.

```sh
bun run test
bunx tsc --noEmit
bun run build
```

The existing Lovable/TanStack build emits its client and server output under `.output/`. Keep its Vite integration intact.

## Explore the lab

- **Choose either stream:** Build knowledge follows source text → curated chunks → toy vectors → searchable index. Answer a question independently starts from the prepared index. Both are available immediately and remember their own scroll position. Changing a question/configuration starts a fresh replay; exploration counts remain for this visit.
- **Complete one question:** the question-example selector offers ten independent journeys: large LLM, small LLM, approved-answer cache hit, useful source-read tool, denied tool read, direct record lookup, rejected input instruction, access denial, rejected citation, and missing evidence. The question remains visible throughout. Each selection resets request/cache state; only the explicit repeat example seeds an approved answer from a successful fixture run. Skipped stages disappear from that journey, while a disabled tool gets one brief explanation. A refusal returns a notice to the same user and ends the story at its actual stopping point.
- **Scroll the card gallery:** an opening card explains the interaction, and a visible scrollbar and smaller neighbouring cards invite reading down the right column. Each input, individual operation, and output has its own card. The card nearest the middle is larger and controls the scene; cards above and below tilt away with restrained perspective. Input and output cards hold their results for reading, while operation cards scrub the data transfer. Native wheel, touch, arrow-key, and Page Down scrolling work, with optional chapter links. There is no timed advancement or required Next button. Each stream remembers its card and reading position, including after a resize. On smaller screens the gallery sits below the scene; reduced motion removes the tilt and depth.
- **Enter the system:** a full-screen Three.js space sits behind floating glass cards. A perspective camera fits the active operation and its endpoints into the space beside the reader, opens up for inputs, and tightens for outputs; the overview control pulls back to the whole world. Curved paths connect the outer edges of objects, with separate lanes for outward and returning traffic. Paths and directional arrowheads remain visible in every stage. Blue marks requests/documents, teal evidence, violet model/encoding work, amber cache reuse, rose tools, and green checks/return. A compact key explains these colours. Inactive entities and unrelated routes dim while the current participants stay clear; output/input holds never imply live execution. Projected labels yield space to the active annotation and avoid overlapping one another. Restrained lighting keeps the entities readable; only the connection carrying data receives a soft glow and moving signal, which clear at input/output or when execution is skipped/blocked. The route map stays sharp without a screen-wide blur. Packet trails and document transformations show the data flow. Input/work/output annotations are projected onto the same path as the moving data packet and change with the scroll position. Each operation continues the same document journey instead of restarting it.
- **Read the request layout:** the user connects to input checks, then a router. The answer cache sits near the request and the small-model branch beside the router. A larger LLM, context tray, knowledge index, and a keypad-shaped tool dock occupy distinct positions. Routing explains a selection; it does not execute the model. On a cache miss, the same request travels through retrieval → index → retrieved results → context before reaching the selected LLM. The default multi-part, three-fact question selects the large profile; the narrower two-fact question selects the small one. This is an explicit teaching rule, not a trained classifier or evidence of model quality. A compatible approved-answer hit bypasses retrieval, tools, and generation but still passes verification and current-eligibility checks. Output checks feed a curved return path to the original user.
- **Follow one chunk:** numbered passage selectors retain the chosen record across preparation stages. Inspect its actual text, provenance, estimated size, and seven feature values. Desktop shows the system beside an Input / Work / Output reader; narrow screens reserve an upper window into the same world above the reading card. The index is a holographic globe with one document tile per indexed passage. Its spherical arrangement is illustrative, not the embedding space used for search.
- **See this visit's exploration:** the meter counts distinct stage outputs actually viewed, out of four preparation and eleven request stages. Precomputing the deterministic replay does not mark computed stages as explored. Skipping past an output does not count it. Reviewing or repeating a stage does not add another count. Counts live only in React state and start at zero on a fresh lab load; no browser storage, accounts, or learning-completion claims are involved.
- **Read without squinting:** IBM Plex Sans supplies UI headings and reading cards, with 16px card prose, stronger 22–29px headings, 12–13px metadata, and brighter secondary text. Shared text tokens and a 12px minimum for custom lab/inspector labels carry the hierarchy through lessons, navigation, and details. Mobile controls simplify their layout rather than shrinking their text.
- **Review without rerunning:** scrolling backwards restores exact input/output engine snapshots without generating again or warming another cache entry. Future context never appears in an earlier stage's input. A blocked request ends at its actual stopping stage. Replay with warm caches explicitly starts a new simulated request.
- **Retrieval:** compare keyword overlap, transparent toy semantic scoring, reciprocal rank fusion, toy reranking, deduplication, candidate limits, and context budgets.
- **Caching and routing:** repeat a request to observe local vector/retrieval/approved-answer reuse and simulated provider-prefix reuse. Approved answers still pass verification and current-eligibility checks; prompt caching still generates. Model profiles are explicitly simulated.
- **Evaluation:** inject a retrieval miss, unsupported claim, bad/missing citation, false refusal, or provider outage. Ratios are computed from that run with visible denominators; unanswerable questions and infrastructure errors stay separate.
- **Guardrails:** test a document instruction, access denial, or revocation after verification. A deliberately limited injection heuristic is separate from application permissions and fixture-support checks.
- **Tools/context:** the useful-tool example intentionally retrieves too little usable evidence. Its question names a known fallback passage ID, and the fixed application workflow proposes `get_source_passage({ evidence_id: "A11-LA-CAP" })`, validates permission, returns the passage to context, and then generates. The normal complete-evidence example explains why no extra tool is needed. Advanced controls also demonstrate timeout, empty result, and budget handling. The workflow permits one local read and no automatic retries; it is not an autonomous agent.
- **Comparison:** hold the question and corpus fixed, compare default and modified cold runs, and optionally repeat the modified run against its own warm cache.

Scroll within the visible card gallery to inspect inputs, operations, and outputs; selecting a passage or citation is optional deeper inspection. Experiments, full execution reports, comparisons, and further reading live in the Explore details drawer. The page stays within one viewport while the reading column moves past the fixed scene. Opening the drawer or hiding the page pauses the visual world. Pause ambient motion freezes idle activity; deliberate scrolling still updates the story and snaps the camera to its step. Reduced motion similarly removes ambient animation and camera easing; Low effects uses a static illustration without WebGL.

## Interaction design

The owner-provided sibling project `five-parts-ai-engineering` informed the perspective-camera direction, fixed scene layer, curved packet paths, and holographic document globe. This lab retains its own dataset, deterministic engine, independent preparation/request stories, and snapshots. The open neural sphere, firing points, and connection pulses are an illustrative AI entity, not a visualization of internal model reasoning. Ambient space motion continues while reading until paused; it never advances the engine.

- [Mayer and Pilegard: learner-paced segmentation](https://www.cambridge.org/core/books/abs/cambridge-handbook-of-multimedia-learning/principles-for-managing-essential-processing-in-multimedia-learning-segmenting-pretraining-and-modality-principles/DD24C2F48B9B1277CE59F78276110258) supports dividing a complex explanation into meaningful segments that the learner controls.
- [NN/G: visibility of system status](https://www.nngroup.com/articles/visibility-system-status/) informed immediate stage feedback, active-object highlighting, and the visit's exploration meter.
- [W3C: pause, stop, hide](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide) informed the ambient-motion pause control and reduced-motion equivalent. Document transfers are bounded and driven by deliberate scrolling. Neural pulses, camera drift, and globe rotation stop when paused; narrative steps never advance on a timer.

## What executes, and what is simulated

**Runs locally:** keyword scoring, explicit seven-feature vectors and cosine similarity, rank fusion, selection/budgets, versioned in-memory cache lookup, scope/eligibility checks, fixture-based metrics, and bounded local tool results.

**Simulated:** learned embeddings, trained reranking, model routing quality, language-model generation, LLM judges, provider outages, and provider prompt caching. Generation fills reviewed answer templates. Support checks compare these templates and reviewed evidence labels; they are not a general semantic verifier.

Token counts use a declared word-count estimate. Cost comparisons use fictional work units, with the formula shown in the interface. No real provider price, latency, model accuracy, or hidden reasoning is inferred.

The index uses curated passages rather than claiming to parse NASA pages live. Records retain source URLs, version, locators, excerpt/paraphrase status, and synthetic-test labels. Facts were checked against [NASA's mission overview](https://www.nasa.gov/missions/apollo/apollo-11/apollo-11-mission-overview/) and [NASA Science's launch resource](https://science.nasa.gov/resource/apollo-11-launch/).

`src/test/rag-scenarios.test.ts` checks each example's outcome and every animated handoff: the next operation must start where the preceding one ended, and every completed or blocked journey must return to the original user. Scene tests separately keep model execution after retrieval/context and distinguish selection from generation.

## Privacy and content

The learning experience accepts no visitor text and persists no notes, progress, or quiz answers. Controls, exploration counts, and cache state live only in the current lab's memory. Thinking points and copyable observation outlines support reflection without adding accounts or storage.

Lesson content is under `src/content/`; lesson renderers are under `src/components/learn/`. The connected lab has its own components under `src/components/lab/`, pure logic under `src/lib/`, and behavioral tests under `src/test/`. See `AGENTS.md` for project conventions.

## Lovable sync

This project is connected to the [Lovable editor](https://lovable.dev/projects/03c32535-dfe7-4d9d-8711-6602260deed2) and [GitHub repository](https://github.com/ArifMehmood16/ai-engineering-made-practical). Pushing working commits to the connected branch syncs them back to Lovable. Preserve published history; do not force-push or rewrite it.
