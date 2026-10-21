# Attributions

[Project overview](../README.md) · [License](../LICENSE) · [Notice](../NOTICE)

## Original project material

RAG Engineering Lab — Copyright 2026 Arif Mehmood.

Original project code and authored learning material use Apache License 2.0. The site is branded **RAG Learning · AI Learning Lab**. Third-party code, source excerpts, fonts, and referenced material retain their original terms; the project license does not replace them.

## Example corpus

The curated Apollo 11 passages reference:

- [NASA: Apollo 11 Mission Overview](https://www.nasa.gov/missions/apollo/apollo-11/apollo-11-mission-overview/).
- [NASA Science: Apollo 11 Launch](https://science.nasa.gov/resource/apollo-11-launch/).

[`src/content/apollo.ts`](../src/content/apollo.ts) retains the original URLs, locators, versions, publisher, and excerpt/paraphrase status. Adversarial examples and fault cases are separately authored synthetic fixtures, not attributed NASA statements. The app illustrates prepared source material rather than live NASA ingestion. No affiliation or endorsement is implied.

EvidenceLens is a design-phase case study used to discuss implementation decisions, not a claim of deployed RAG performance or validation.

## Software and visual assets

The application uses React, TanStack, Three.js, React Three Fiber, Drei, Tailwind, Lucide icons, Radix components, and other packages declared in `package.json`. These dependencies retain their own licenses and copyright notices in their packages. This page is a source/asset guide, not a complete dependency-license inventory.

The 3D entities, flow geometry, prefix/evaluation scenes, and app mark are rendered from repository code or SVG assets. The screenshots in `docs/screenshots/` are captures of the running app, not generated concept art.

The app loads Syne, IBM Plex Sans, IBM Plex Mono, and Newsreader through Google Fonts. Font files are not redistributed in this repository; consult each font family's license when bundling or modifying them.

The owner-supplied sibling prototype `five-parts-ai-engineering` informed the camera, curved flow, and knowledge-index direction. This repository retains its own deterministic examples and recorded replay state. The [lab guide](LAB_GUIDE.md#interaction-design) preserves the educational and accessibility references behind the interaction design.
