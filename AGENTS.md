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
- The site is static and read-only: no notes, progress, quiz answers, or stored visitor input; lab controls are aria-pressed toggle buttons — the user wants thinking points instead of input-taking.
- Cross-lesson pages (/architecture, /roadmap, /writing) are separate routes fed from `src/content/`; lesson prev/next comes from the shared `LessonPager` in the lesson route — keeps navigation consistent as lessons change.
- The home route `/` is THE INTELLIGENCE LAB (ORBIT, full-bleed, no sidebar); ORBIT 3D is React Three Fiber, lazy-loaded behind ClientOnly with a static SVG fallback for low-effects mode; the lesson overview lives at /overview — one WebGL stack keeps the bundle and behaviour coherent.
- The lab experiment runs on a step-wise pure engine (`advance(state)` in `src/lib/apollo-engine.ts`) over fixtures in `src/content/apollo.ts`; ORBIT, inspector, and timeline render only from that engine state — keeps the animation honest and runs reproducible. Source-backed records hold verbatim excerpts with real URLs and section locators; synthetic records are labelled by `kind`.
