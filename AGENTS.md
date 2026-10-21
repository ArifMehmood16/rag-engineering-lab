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
- Offer two independent home-lab streams: Build knowledge and Answer a question. Both are available immediately; answering uses the prepared fixture index. Scrolling scrubs input → individual operations → output through `src/lib/rag-scroll-story.ts`; no Next/Play click is required. Retain each stream's position and exact engine snapshots for review. Hold inputs and outputs over reading intervals, and project the active input/work/output label onto the same curved path as its data packet. Precomputing a replay must not count stages as explored or rerun requests on reverse scroll. The visual world fills the viewport behind readable floating cards. Use eased perspective-camera framing, curved directional paths, object transformations, a holographic passage index, and a semi-hollow neural AI entity. Ambient motion must pause with the motion control, reduced-motion preference, hidden page, and open details drawer. Intentional scrolling still changes the story; paused/reduced-motion camera framing snaps to the selected step. It must never advance the engine or imply access to hidden model reasoning. Keep the explanation and output readable in the same frame.
- Make focused incremental commits with descriptive messages as work becomes reviewable. Preserve published history.
