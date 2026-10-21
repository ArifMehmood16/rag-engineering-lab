# Contributing

[Project overview](README.md) · [Architecture](docs/ARCHITECTURE.md) · [Project rules](AGENTS.md)

## Start locally

Use Bun 1.4.0 with the committed `bun.lock`:

```sh
bun install --frozen-lockfile
bun run dev
```

No API keys or database are required. Keep the minimum-release-age policy in `bunfig.toml`. Use one package manager in a checkout; dependency upgrades are a separate change from content or visual updates.

## Where changes belong

- Lesson prose and fixtures: `src/content/`.
- Deterministic engine, retrieval, caches, permissions, and evaluations: `src/lib/`.
- Lab scenes, readers, and inspectors: `src/components/lab/`.
- Lesson renderers: `src/components/learn/`.
- File-based routes: `src/routes/`.
- Behaviour and regression checks: `src/test/`.

Read `AGENTS.md` before implementation. Keep the two streams independent, follow a single question to its answer or safe stop, and retain provenance with every source-backed claim. Label synthetic evidence, estimated costs, generated fixtures, and simulated model/provider behaviour explicitly.

A learning scene must observe results rather than execute requests while rendering. Evaluations stay outside the live request path. Application code enforces tool permissions and release checks; an LLM instruction is not authorization.

## Verify a change

```sh
bun run test
bunx tsc --noEmit
bun run lint
bun run build
```

Add focused regression coverage when changing engine outcomes, permissions, cache semantics, scenario continuity, or gallery state. For prose or small visual changes, inspect the affected page rather than writing tests that duplicate its markup.

For visual work, inspect desktop and narrow screens, the relevant scroll sequence, pause/reduced motion, and the static fallback. Keep input, operation, and result readable in the same frame. Update [screenshots](docs/screenshots/README.md) when the README images no longer represent the app.

The build retains the Lovable/TanStack server integration and outputs `.output/`. Do not replace it with a generic static Vite deployment configuration.

## Commits and pull requests

Use small, descriptive commits, such as `docs: explain prefix-cache boundaries` or `fix(scene): preserve the active card on resize`. Preserve published history; the connected branch syncs to Lovable.

A pull request should explain the user-visible problem, resulting behaviour, and relevant verification. Include screenshots when the visual change needs them. Describe any simulation boundaries or known limitations that affect the example. Do not include credentials, local-only paths, or generated build output.

## Reporting a problem

Include the stream or learning view, selected example, scroll step, browser/viewport, expected behaviour, and actual result. A screenshot is especially useful for overlapping labels, unreadable text, or broken flow continuity. Report reproducible fixture behaviour rather than treating the demonstration's scores as model benchmarks.

## Attribution and license

Retain source URLs, versions, locators, and excerpt/paraphrase labels. Preserve third-party notices. Contributions to original code and authored learning material are made under the project's [Apache 2.0 license](LICENSE), unless separately agreed.
