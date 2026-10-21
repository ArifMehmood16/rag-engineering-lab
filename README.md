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

- **Run / pause / step:** follow a request through each application stage, or run directly to its result. Playback speed affects the presentation, not measured performance.
- **Knowledge preparation:** inspect documents, curated chunks, seven-dimensional toy vectors, and their ID-to-source index. Replay the preparation sequence independently of a request.
- **Retrieval:** compare keyword overlap, transparent toy semantic scoring, reciprocal rank fusion, toy reranking, deduplication, candidate limits, and context budgets.
- **Caching and routing:** repeat a request to observe local vector/retrieval/approved-answer reuse and simulated provider-prefix reuse. Approved answers still pass verification and current-eligibility checks; prompt caching still generates. Model profiles are explicitly simulated.
- **Evaluation:** inject a retrieval miss, unsupported claim, bad/missing citation, false refusal, or provider outage. Ratios are computed from that run with visible denominators; unanswerable questions and infrastructure errors stay separate.
- **Guardrails:** test a document instruction, access denial, or revocation after verification. A deliberately limited injection heuristic is separate from application permissions and fixture-support checks.
- **Tools/context:** run a bounded local read-only tool scenario with argument validation, permission denial, timeout, empty result, and budget handling. The workflow permits one call and no automatic retries; it is not an autonomous agent.
- **Comparison:** hold the question and corpus fixed, compare default and modified cold runs, and optionally repeat the modified run against its own warm cache.

Click stages and citations to inspect their actual inputs, outputs, source metadata, and limitations. Focus mode hides surrounding controls; narrow layouts use a linear flow and collapsible configuration. Reduced-motion/low-effects modes preserve the same information, and hidden pages stop playback timers.

## What executes, and what is simulated

**Runs locally:** keyword scoring, explicit seven-feature vectors and cosine similarity, rank fusion, selection/budgets, versioned in-memory cache lookup, scope/eligibility checks, fixture-based metrics, and bounded local tool results.

**Simulated:** learned embeddings, trained reranking, model routing quality, language-model generation, LLM judges, provider outages, and provider prompt caching. Generation fills reviewed answer templates. Support checks compare these templates and reviewed evidence labels; they are not a general semantic verifier.

Token counts use a declared word-count estimate. Cost comparisons use fictional work units, with the formula shown in the interface. No real provider price, latency, model accuracy, or hidden reasoning is inferred.

The index uses curated passages rather than claiming to parse NASA pages live. Records retain source URLs, version, locators, excerpt/paraphrase status, and synthetic-test labels. Facts were checked against [NASA's mission overview](https://www.nasa.gov/missions/apollo/apollo-11/apollo-11-mission-overview/) and [NASA Science's launch resource](https://science.nasa.gov/resource/apollo-11-launch/).

## Privacy and content

The learning experience accepts no visitor text and stores no notes, progress, or quiz answers. Controls and cache state live only in the current page's memory. Thinking points and copyable observation outlines support reflection without adding accounts or storage.

Lesson content is under `src/content/`; lesson renderers are under `src/components/learn/`. The connected lab has its own components under `src/components/lab/`, pure logic under `src/lib/`, and behavioral tests under `src/test/`. See `AGENTS.md` for project conventions.

## Lovable sync

This project is connected to the [Lovable editor](https://lovable.dev/projects/03c32535-dfe7-4d9d-8711-6602260deed2) and [GitHub repository](https://github.com/ArifMehmood16/ai-engineering-made-practical). Pushing working commits to the connected branch syncs them back to Lovable. Preserve published history; do not force-push or rewrite it.
