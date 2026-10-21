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
- The site is static and read-only: no notes, quiz answers, or stored visitor input; lab controls are aria-pressed toggle buttons. The owner explicitly permits a session-only exploration meter: count distinct stage outputs actually viewed, reset on every fresh lab load, and never persist it. Use thinking points instead of input-taking.
- Cross-lesson pages (/architecture, /roadmap, /writing) are separate routes fed from `src/content/`; lesson prev/next comes from the shared `LessonPager` in the lesson route — keeps navigation consistent as lessons change.
- The home route `/` explains the RAG system itself: documents → chunks → vectors → index, then question → retrieval → context → generator → verification → release. Use an accessible HTML reader beside the state-driven 3D scene, with a static fallback, responsive flow, and reduced-motion support. Apollo is example data, not the visual subject. Do not restore decorative orbital animation. The lesson overview lives at `/overview`.
- The lab runs on the step-wise pure engine (`advance` in `src/lib/apollo-engine.ts`) over `src/content/apollo.ts`; diagram, inspector, and trace render from execution state. Generation and support judging use reviewed fixtures and must be labelled simulated. Source-backed records distinguish excerpts/paraphrases, retain real URLs/locators, and label synthetic test records by `kind`.
- Start the home lab with knowledge preparation before questions. Use the guided input → individual operations → output controller in `src/lib/rag-walkthrough.ts`, with exact engine snapshots for review. Default to manual pacing; optional playback pauses at every output. The visual world fills the viewport behind readable floating cards. Use eased perspective-camera framing, curved directional paths, object transformations, a holographic passage index, and a semi-hollow neural AI entity. Ambient motion must pause with the visual control, reduced-motion preference, hidden page, and open details drawer. It must never advance the engine or imply access to hidden model reasoning. Keep the explanation and output readable in the same frame.
- Make focused incremental commits with descriptive messages as work becomes reviewable. Preserve published history.
