# Use the RAG engineering agent

[Project overview](../README.md) · [Full reusable prompt](rag-engineering-agent.md)

Use **[rag-engineering-agent.md](rag-engineering-agent.md)** with a coding assistant to design, build, or review your own RAG application. It is a self-contained Markdown task prompt: copy its entire contents into a conversation, or place the file in your target project and explicitly ask the assistant to read it. No plugin, agent framework, model vendor, or additional template is required.

The prompt covers the lab's five areas in a real development workflow:

1. **Context:** source preparation, chunking, embedding compatibility, permitted retrieval, provenance, context selection, and insufficient evidence.
2. **Efficiency:** embedding/retrieval/answer caches versus provider prompt-prefix reuse, invalidation, isolation, routing, and measured cost/latency.
3. **Evaluation:** reviewed datasets, separate retrieval/context/generation/end-to-end checks, regression gates, and optional calibrated judges.
4. **Guardrails:** untrusted inputs/documents/tool results, output release checks, permissions enforced in application code, and sensitive-data handling.
5. **Tools and context:** when a fixed workflow is enough, validated tool execution, bounded agent loops when justified, and context retention/compaction.

It also requires observability, bounded failure handling, versioning, and release/rollback evidence where applicable. Every area is assessed; an agent, multiple models, an LLM judge, or every cache type is not mandatory.

## Choose a mode

With the prompt available at `prompts/rag-engineering-agent.md` in **your target repository**, paste one of these instructions into your coding assistant. If you copied the full prompt directly into chat instead, omit the first sentence.

### Review an existing application

```text
Read prompts/rag-engineering-agent.md and follow it for this task.
Mode: REVIEW.
Target: the current application and repository.
Assess all five areas using the code, configuration, tests, and architecture.
Run the available authorized checks without modifying the application.
Report evidence-backed gaps, justified exclusions, release blockers, and
the smallest useful fixes. Mark anything you cannot verify explicitly.
```

### Build or improve an application

```text
Read prompts/rag-engineering-agent.md and follow it for this task.
Mode: BUILD.
Target: the RAG application in this repository.
Discover its use case and constraints from existing context; ask targeted
questions for essential gaps. Reuse the current stack and build the smallest
grounded document-to-checked-answer slice before optional optimizations.
Implement the relevant fixes, add meaningful checks, and report verification
across all five areas. Use focused commits and do not deploy automatically.
```

For a new project, also state what people should be able to ask, which documents it may use, and any known stack/access constraints. The prompt cannot responsibly invent your product requirements or permissions. You do not need to preselect a vector database, router, cache, or agent framework.

### Work from a design without claiming implementation exists

```text
Read prompts/rag-engineering-agent.md and follow it for this task.
Mode: DESIGN.
Target: the application described in this conversation and its design files.
Define the two data flows, contracts, five-area coverage, trade-offs,
acceptance cases, and phased implementation plan using the proposed stack.
Separate confirmed requirements, assumptions, proposals, and unverified
implementation claims. Do not create or deploy the application yet.
```

**REVIEW is the default** if no mode or explicit build/fix request is given. The optional task brief inside the prompt can supply missing context, but it is not a required form.

## What a useful result should contain

- A project-specific account of the application, with facts separated from assumptions.
- A five-area coverage review with explicit **PASS, PARTIAL, FAIL, MISSING, UNVERIFIED, DEFERRED,** or **NOT APPLICABLE** findings and reasons.
- Prioritized fixes tied to actual files/components, acceptance criteria, dependencies, effort, and trade-offs.
- In Build mode, implemented changes and executed verification rather than just recommendations.
- Separate retrieval, context assembly, fixed-context generation, and end-to-end results; appropriate adversarial and operational cases.
- A scoped readiness decision identifying untested critical boundaries and outstanding blockers.

For example, “prompt caching is enabled” needs provider usage evidence, and “access control passes” needs a case showing a denied source never reaches an unauthorized caller/model/cache path. An answer-cache hit that exposes a revoked source is a failing boundary even if ordinary answer quality is high. A read-only RAG workflow can correctly defer an agent while still needing context management and permission checks.

## Using the file as agent instructions

The filename is deliberately ordinary Markdown. Merely adding it to a repository does not install or start an agent; the assistant must receive or explicitly read its contents. Some tools have their own instruction-file discovery rules.

Do not overwrite your project's `AGENTS.md` or other instruction files with this prompt. Those files contain local conventions and restrictions. If your tool supports linked instructions, reference this file from the appropriate scoped instructions and keep the existing rules; otherwise explicitly include the prompt in the task. The prompt itself defaults to review and follows the user's requested scope.

Use it against **your actual RAG project**. Running it against RAG Engineering Lab will correctly find an educational simulation: toy embeddings, fixture generation, and simulated judge/cache behavior. That does not turn the lab into a production RAG backend.

## Engineering guidance and limits

The five areas organize this project's practical checklist; they are not a universal RAG certification. The prompt requires project-specific acceptance gates and evidence rather than declaring an application production-ready from a checklist or an illustrative score.

Background references were checked on **23 October 2026**:

- [The original RAG paper](https://arxiv.org/abs/2005.11401) provides the retrieval-plus-generation research background.
- [The Ragas evaluation paper](https://arxiv.org/abs/2309.15217) distinguishes retrieval and generation evaluation dimensions. Using those ideas does not require installing Ragas.
- [OWASP's prompt injection guidance](https://genai.owasp.org/llmrisk/llm01-prompt-injection/) describes direct/indirect inputs and layered controls; it does not establish a foolproof detector.
- [NIST AI 600-1](https://doi.org/10.6028/NIST.AI.600-1) is broader generative-AI risk-management guidance, not a RAG-specific certification.
- [Claude's prompt-caching documentation](https://platform.claude.com/docs/en/build-with-claude/prompt-caching) is one concrete provider example of prefix processing reuse. The prompt requires checking the selected provider's current API rather than copying its rules to another provider.

The instructions are original project material under the repository's [Apache 2.0 license](../LICENSE). Referenced publications and documentation retain their own terms. Neither a prompt nor a generated review replaces executed checks and appropriate human review of the application's intended use.
