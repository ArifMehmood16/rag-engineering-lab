# Reviewing the teaching-site split

AI Engineer Prep hosts interview rehearsals, technical follow-ups, mock interviews and case defences. RAG Engineering Lab hosts shareable demonstrations. This change adds Lab pages for the policy, release and permissions examples. The LinkedIn landing page at `/`, the five lesson addresses, `/overview`, `/architecture`, `/roadmap` and `/writing` keep their existing jobs.

## Preview the handoff

Use both review branches together. From the Lab checkout run the first command. From the Prep checkout run the second in another terminal. Each checkout uses its existing Bun lockfile (`bun install --frozen-lockfile` for a fresh checkout).

```sh
bun run dev --host 127.0.0.1 --port 4317 --strictPort
```

```sh
VITE_RAG_LAB_ORIGIN=http://127.0.0.1:4317 bun run dev --host 127.0.0.1 --port 4318 --strictPort
```

The variable selects the Lab origin for links and redirects. It is read by Vite. Set it **when building Prep** to pair hosted previews. Its default is the public Lab origin.

- [Rehearse top-K](http://127.0.0.1:4318/lessons/top-k#try), reveal the reasoning and open the demonstration. The [published workbench bookmark, on local Prep](http://127.0.0.1:4318/labs/top-k?ordering=reranked#answer-delivery) lands directly on the [reranked Lab reply](http://127.0.0.1:4317/demos/top-k?ordering=reranked#answer-delivery).
- [Defend a release](http://127.0.0.1:4318/labs/evaluation#decide) or [inspect its endorsement cases](http://127.0.0.1:4317/demos/release-evaluation?slice=endorsement).
- [Compare the permissions](http://127.0.0.1:4317/showcases/agent-authority) and [read the five design notes](http://127.0.0.1:4317/showcases/agent-authority/solid).

### Browser-check the production builds

Use the local Workers runtime for the generated Cloudflare output. The Lab’s existing Vite preview command looks for `dist/server/server.js`, whereas the build emits `.output/server/index.mjs`. With the two sibling repositories installed, the following commands use Wrangler from Prep’s lockfile.

Run these commands in the Lab checkout.

```sh
bun run build
../canopy-learning-journey/node_modules/.bin/wrangler dev --local --config .output/server/wrangler.json --ip 127.0.0.1 --port 4327
```

Run these commands in the Prep checkout.

```sh
VITE_RAG_LAB_ORIGIN=http://127.0.0.1:4327 bun run build
bun run preview --ip 127.0.0.1 --port 4328
```

The [built Prep bookmark](http://127.0.0.1:4328/labs/top-k?ordering=reranked#answer-delivery) should open the Lab on port 4327. Use the default public origin when building for publication.

## Route and state inventory

**Top-K.** Lab lesson `/lessons/context#lab` links to `/demos/top-k`. The original Prep workbench accepted only `ordering=reranked` in its query. An absent, original or unrecognised order opened the original ranking at K=3 and 220 tokens. The Prep workbench URL now issues a temporary 307 to the corresponding Lab state. Browsers carry the fragment across the HTTP redirect. The in-app redirect includes the fragment explicitly.

The Lab URL records applied controls. K takes integers 1–4. The budget is 0–400 in steps of 10. Ordering is original or reranked. Pending edits take effect on **Apply**. **Reset this lab** restores the packing settings from entry. Both the trace selector and the model-output selector update the URL immediately.

- `case=APR` is the default. `MAR` is a March loss reported in April, `EDGE` is 1 April inclusive, `UNKNOWN` lacks the loss date, `ABSENT` lacks the required endorsement and `DENIED` fails access. The packing panels refer to the 3 April question. The trace applies the selected case to those passages.
- `draft=supported` is the default. The other reviewed examples are `wrongAmount`, `wrongCitation`, `extraPromise`, `contactDetail`, `malformed` and `timeout`. The trace shows a request and draft only when the earlier checks allow them. A delivered citation opens the corresponding supplied excerpt, including the effective-date footnote.
- `/foundations/building-a-grounded-answer#answer-delivery` and `/lessons/rag-architecture#answer-delivery` stay on Prep, with a link to `/demos/top-k?ordering=reranked#answer-delivery`. Those original chapter traces started with the two operative passages. Both pages also retain `#delivery-title`, `#recipient-heading`, `#prompt-heading`, `#draft-heading` and `#checks-heading`. Each stage link opens that stage on the Lab.
- `/glossary/top-k` opens the shortlist example at its original K=2. The Prep study desk now opens the interview exercise or the original-order Lab. The reranked study-desk permalink uses the 307 above. Prep’s case-file citation addresses, including `/cases/insurance#E3-P1`, still serve the case dossier.
- `/lessons/top-k#try` keeps the question, editable attempt and worked reasoning. The Python follow-up remains at `#experiment`. Existing lesson sections, study-path navigation and `/interview?question=03-lead-quality-falls` remain available. Lessons accept `path=Retrieval engineer`, `Document platform engineer` or `Applied AI and agents` where applicable. The question bank uses `?view=bank` and individual questions and mock turns use `?question=<id>`.

**Release evaluation.** Prep keeps `/labs/evaluation`, the decision at `#decide` and the existing scored-answer illustration at `#tool-screen`. The three choices, justification, worked defence and retry are local to the activity. Its previous subgroup selector had no URL parameter. Lab lesson `/lessons/evaluation#lab` links to `/demos/release-evaluation`. The new URL accepts `slice=overall` (default), `single` or `endorsement`. Each group shows the same fixture-wide latency figures.

**Agent Authority Explorer.** Lab lesson `/lessons/tools-agents#lab` links to `/showcases/agent-authority`. Its two runs compare the same order, note and delivery request. `run=enforced` selects application-enforced limits. Broad access is the default. The companion `/showcases/agent-authority/solid` page supports `#S`, `#O`, `#L`, `#I` and `#D`. The [animated story and exports](https://rag-engineering-lab.lovable.app/showcases/agent-authority/story) use the original deterministic scene engine. The [design notes](https://rag-engineering-lab.lovable.app/showcases/agent-authority/solid) include the five original diagrams and pseudocode examples. Both are served by the Lab. The story accepts `?capture` for the recorder view.

## Review evidence

Run `bun run test`, `bunx tsc --noEmit`, `bun run lint` and `bun run build` in each checkout. The Lab ports the original pure packing and checked-answer functions. Their source fixtures came from Prep upstream `f6c9e5c`. Lab upstream was `21df069`.

- Complete original and destination results were compared for 4 candidate limits × 2 orders × 41 budgets. For each of those 328 runs the comparison included all 6 cases × 7 model drafts (13,776 traces). The ordered JSON results produced the same SHA-256 digest, `11ecc3c8627497c6d7b06b519c9752e6a50f262dc1d20ed71779d8effe8e6ca6`.
- At K=3 and 220 tokens both orders retrieve both required passages. Original order spends 200 tokens on H17-P2 and H17-P5 and sends the April question to review. Reranking packs E3-P1 and H17-P2 in 190 tokens. The supported reply quotes £750 with both citations. The published workbench and Lab were browser-compared for both orders and all seven draft outcomes. The six published chapter case replies matched too.
- Overall support goes from 47/50 to 44/50, single-clause support from 38/40 to 39/40, and endorsement support from 9/10 to 5/10. P95 drops from 1,100 ms to 900 ms. Both runs report zero exposures. The candidate fails the minimum 8/10 endorsement gate. Prep accepts a decision and justification before revealing the worked defence.
- The Explorer comparison reproduces the published outcomes for order #1042. Broad access sends private pricing to the address in the note. Under enforced limits the supplier contact receives the delivery update and pricing is excluded. All five SOLID notes address a design pitfall and its corresponding enforcement decision.
- Browser review covers cross-site navigation, direct entry and refresh with fragments, reranking, K=2, zero and tight budgets, invalid settings, the glossary preset, the interview question and bank, a mock turn, the release slices and the enforced permissions state.

Both local Worker builds passed the handoff, direct-load and refresh checks. Prep passed 100 tests and the Lab passed 154 tests. TypeScript and production builds passed in both repositories. Lint reported six existing warnings in Prep and eleven in the Lab, all outside the changed files.

The original Lab homepage, overview, five lessons, architecture, roadmap and writing routes were also checked on direct load and refresh. In desktop Chromium at 1440 × 900 the existing homepage scroll scene intercepts a pointer click on “Compare Keyword and Hybrid” on both the public site and this preview. Keyboard activation opens the comparison on both.

## Publication sequence for a later change

1. Publish the reviewed Lab first. Test the four destination URLs and the three lesson links on the public Lab origin. Open the existing LinkedIn homepage address and exercise its Apollo walkthrough.
2. Publish Prep after the public Lab checks pass. Verify the old reranked URL from a fresh tab and reload it. Follow both chapter handoffs and the release-defence link. The 307 keeps the old workbench address reversible.
3. Publish the Lab story and full notes before retiring the standalone app. Test the figure ZIP, portrait recording and offline HTML player. The original Lovable source revision is `3c93e45dca4199cdb3e4849891b4261ebd27ea31`.
4. Keep the old Lovable hostname as the redirect service. Forward its homepage to Lab `/showcases/agent-authority/story` so the original LinkedIn and Medium links still open the animation. Forward `/solid` to Lab `/showcases/agent-authority/solid`. Preserve the query, including `?capture`, and the fragment. Verify both old addresses in a fresh browser after publishing. The Lab links only to its own story and exports, so there is no return trip to the retired app.

## Further candidates

- The public PDF field inspector and chunk-offset walkthrough fit the Lab context lesson’s document-to-passage material. Prep can retain the question about a missing footnote and ask the candidate to locate the failure.
- The public parser-regression comparison fits the Lab evaluation lesson. Its incident diagnosis and repair defence belong on Prep.
- The approval replay fits the Lab tools and guardrails lessons. The worker-capacity calculator fits the cost and latency lesson. Each has a corresponding decision that can still be rehearsed on Prep.
- PatternPal, StockFlow and Scheduling Classroom continue as independent destinations. This migration concerns the two teaching repositories and the Explorer showcase.
