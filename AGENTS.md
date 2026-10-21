<!-- LOVABLE:BEGIN -->

> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

<!-- LOVABLE:END -->

## Project rules

- Lesson prose, quizzes, and synthetic fixtures live in `src/content/`; components in `src/components/learn/` only render them — keeps content revisable without touching UI.
- Lab logic is pure and deterministic in `src/lib/` with tests in `src/test/` — demonstrations must be reproducible, no model calls.
- Static/read-only: no stored input, notes, or quiz answers; use thinking points and aria-pressed lab toggles. Session exploration counts only distinct viewed outputs/final concept results, resets per load, and never persists.
- Cross-lesson pages (/architecture, /roadmap, /writing) are separate routes fed from `src/content/`; lesson prev/next comes from the shared `LessonPager` in the lesson route — keeps navigation consistent as lessons change.
- `/` teaches documents → chunks → vectors → index and question → retrieval → context → generator → verification → release. Accessible HTML reader accompanies state-driven 3D with responsive/static/reduced-motion equivalents. Apollo is data, not the visual subject; no decorative orbital scene. Lessons are at `/overview`.
- The lab runs on the step-wise pure engine (`advance` in `src/lib/apollo-engine.ts`) over `src/content/apollo.ts`; diagram, inspector, and trace render from execution state. Generation and support judging use reviewed fixtures and must be labelled simulated. Source-backed records distinguish excerpts/paraphrases, retain real URLs/locators, and label synthetic test records by `kind`.
- Both streams are immediately available; answering uses a prepared index. Native right/below-scene gallery scrolling selects intro → input → operations → output through `rag-gallery` and exact `rag-scroll-story` snapshots. Preserve independent positions on resize/review; never rerun or count precomputed/reversed requests. Hold reading intervals; align packets and input/work/output labels. Reduced motion removes tilt/depth. Keep the full route map visible, dim inactive entities, and glow only the current transfer. Share semantic lanes, exterior ports, strokes, packets, labels, and camera bounds. Fit active operations beside/above the reader without label/navigation collisions; overview shows the complete map. Use full-viewport 3D, restrained lighting, eased perspective framing, holographic index, and semi-hollow AI. Pause/reduced motion/hidden tab/drawer freezes ambient clocks; deliberate scroll still selects snapshots and snaps framing. No hidden reasoning or engine advancement from visuals.
- Make focused incremental commits with descriptive messages as work becomes reviewable. Preserve published history.
- Follow one visible question through checked answer or safe stop. Scenario runs are isolated; only explicit warm examples seed configured caches. Routing selects a future generator, never a model call before retrieval/context; large/small selection is illustrative. Filter skipped stages, explain unused tools, and return blocked notices without facts. Preserve all-example handoff tests. Tools are one validated application-controlled read of the question's known passage ID, not an autonomous/LLM-selected call.
- Five learning views stay discoverable; isolated deterministic examples never mutate request/caches and closing restores exact position. Offline evaluation observes completed runs, not live operations. Prefix reuse still requires generation; approved-answer bypass is distinct. Concept exploration counts only viewed final results, deduplicated/reset per load, separate from viewed stages and no mastery claim. Long cards open at headings with native scrolling.

- Caching/Evals use recorded `rag-theatre` worlds, not relabelled request maps. Distinguish cold prefill, warm prefix + generation, and answer bypass. Each eval case completes its own path; expected gaps can pass, answerable misses fail. Judges show source/claim and separate verdicts. Replays never execute/change caches/count/focus; pause/reduced/hidden/drawer freezes clocks. Keep same-frame results, expandable caveats, and per-mode static fallbacks. Exclude Three modules from TanStack DOM source-tag injection.

- Use `readability.css` and IBM Plex Sans: 16px prose, semibold headings, 12px minimum metadata/labels, contrasting secondary text. Simplify controls before shrinking text.

- Request spine uses paired service corridors and bounded rounded bends, not another spline through shared samples. Strokes/arrows/packets/annotations/static SVG/camera bounds agree. Stable screen-size arrows, 3D depth, and clearance/corner tests preserve readable geometry.

- Demand-render finite transitions, Balanced by default, and one-shot concepts with replay. Only main LLM/index continue on a separate 12-FPS ambient clock sharing the cancellable scheduler; transfers/camera still settle. No perpetual per-frame invalidation/drift. Cache samplers; skip hidden packets and unchanged camera/label projections. Measure labels on size/content changes, never per-frame layout reads. Preserve story/heading/stream/render-budget tests. Browser measurements include viewport/foreground state; unit tests and old idle results are not current CPU/GPU benchmarks.
