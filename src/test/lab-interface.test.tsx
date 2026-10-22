import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

vi.mock("@tanstack/react-router", async (original) => ({
  ...(await original<typeof import("@tanstack/react-router")>()),
  Link: ({
    children,
    to,
    params,
    ...props
  }: {
    children: ReactNode;
    to: string;
    params?: { slug?: string };
  }) => (
    <a href={to.replace("$slug", params?.slug ?? "")} {...props}>
      {children}
    </a>
  ),
}));
import { Lab } from "@/routes/index";
let galleryHeight = 500;
beforeEach(() => {
  vi.useFakeTimers();
  galleryHeight = 500;
  vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockImplementation(function (
    this: HTMLElement,
  ) {
    return this.classList.contains("story-gallery") ? galleryHeight : 0;
  });
  vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockImplementation(function (
    this: HTMLElement,
  ) {
    return this.classList.contains("gallery-card") ? 300 : 0;
  });
  vi.spyOn(HTMLElement.prototype, "offsetTop", "get").mockImplementation(function (
    this: HTMLElement,
  ) {
    if (!this.classList.contains("gallery-card")) return 0;
    const siblings = [...this.parentElement!.children];
    return parseFloat(this.parentElement!.style.paddingTop) + siblings.indexOf(this) * 324;
  });
  Object.defineProperty(HTMLElement.prototype, "scrollTo", {
    configurable: true,
    value(this: HTMLElement, options: ScrollToOptions) {
      this.scrollTop = options.top ?? 0;
    },
  });
  vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) =>
    window.setTimeout(() => callback(0), 0),
  );
  vi.spyOn(window, "cancelAnimationFrame").mockImplementation(clearTimeout);
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.useRealTimers();
});
const current = () => screen.getByRole("article", { name: "Current story step" });
const currentRegion = (name: string) => within(current()).getByRole("region", { name });
function focusCard(stage: number, kind: "input" | "work" | "output", beat?: number) {
  const list = screen.getByRole("region", { name: "Scrollable learning cards" });
  const card = list.querySelector<HTMLElement>(
    `[data-card-stage="${stage}"][data-card-kind="${kind}"]${beat ? `[data-card-beat="${beat}"]` : ""}`,
  )!;
  act(() => {
    list.scrollTop = card.offsetTop + card.offsetHeight / 2 - list.clientHeight / 2;
    fireEvent.scroll(list);
    vi.runOnlyPendingTimers();
  });
}
function answerStream() {
  fireEvent.click(screen.getByRole("button", { name: /Answer a question Prepared index/ }));
}
function openSettings() {
  fireEvent.click(screen.getByRole("button", { name: "Explore details" }));
}
function closeDetails() {
  fireEvent.click(screen.getByLabelText("Return to animation"));
}
function inspectRun() {
  fireEvent.click(screen.getByRole("button", { name: "Inspect run" }));
}
const progress = () => screen.getByRole("progressbar", { name: "Stages explored this visit" });
const conceptsProgress = () =>
  screen.getByRole("progressbar", { name: "Concepts explored this visit" });
function focusLearning(index: number) {
  const list = screen.getByRole("region", { name: "Scrollable concept examples" });
  const card = list.querySelector<HTMLElement>(`[data-learning-card="${index}"]`)!;
  act(() => {
    list.scrollTop = card.offsetTop + card.offsetHeight / 2 - list.clientHeight / 2;
    fireEvent.scroll(list);
    vi.runOnlyPendingTimers();
  });
}

describe("five visible concept views", () => {
  it("offers named concepts and returns to the exact independent stream positions", () => {
    render(<Lab />);
    const nav = screen.getByRole("navigation", { name: "Five AI engineering learnings" });
    expect(within(nav).getAllByRole("button")).toHaveLength(5);
    expect(conceptsProgress()).toHaveAttribute("aria-valuenow", "0");
    focusCard(2, "output");
    fireEvent.click(screen.getByLabelText("Learn RAG & embeddings"));
    expect(screen.getByLabelText("Current concept example")).toHaveTextContent(
      "0 exact-word overlap",
    );
    fireEvent.click(screen.getByLabelText("Learn Caching & routing"));
    expect(screen.getByRole("img", { name: /^Prefix reuse scene:/ })).toBeInTheDocument();
    expect(screen.getByLabelText("Current concept example")).toHaveTextContent(
      "process the prefix",
    );
    expect(conceptsProgress()).toHaveAttribute("aria-valuenow", "0");
    fireEvent.click(screen.getByLabelText("Learn Caching & routing"));
    expect(screen.getByLabelText("Flow annotation")).toHaveTextContent(
      "Request 1 · process the prefix",
    );
    fireEvent.click(screen.getByRole("button", { name: "Back to flow" }));
    expect(current()).toHaveTextContent("Embeddings · the result");
    answerStream();
    focusCard(3, "output");
    fireEvent.click(screen.getByLabelText("Learn Evaluations & judges"));
    expect(screen.getByLabelText("Current concept example")).toHaveTextContent(
      "reviewed test cases",
    );
    fireEvent.click(screen.getByRole("button", { name: "Back to flow" }));
    expect(current()).toHaveTextContent("Retrieve · the result");
    fireEvent.click(screen.getByRole("button", { name: /Build knowledge Documents/ }));
    expect(current()).toHaveTextContent("Embeddings · the result");
  });
  it("shows prefix processing separately from new generation and answer reuse", () => {
    render(<Lab />);
    fireEvent.click(screen.getByLabelText("Learn Caching & routing"));
    focusLearning(1);
    const prefix = screen.getByLabelText("Current concept example");
    expect(prefix).toHaveTextContent("REUSED PROCESSING");
    expect(prefix).toHaveTextContent("1 model call");
    expect(prefix).toHaveTextContent("160");
    expect(prefix).not.toHaveTextContent("Orbit feature");
    focusLearning(2);
    expect(screen.getByLabelText("Current concept example")).toHaveTextContent(
      "Approved-answer cache",
    );
    expect(screen.getByRole("img", { name: /^Prefix reuse scene:/ })).toHaveTextContent(
      "LLM · idle",
    );
    expect(progress()).toHaveAttribute("aria-valuenow", "0");
    focusLearning(3);
    expect(conceptsProgress()).toHaveAttribute("aria-valuenow", "1");
    focusLearning(0);
    focusLearning(3);
    expect(conceptsProgress()).toHaveAttribute("aria-valuenow", "1");
    cleanup();
    render(<Lab />);
    expect(conceptsProgress()).toHaveAttribute("aria-valuenow", "0");
  });
  it("teaches offline retrieval, generation, and judge evaluation without advancing the user's run", () => {
    render(<Lab />);
    fireEvent.click(screen.getByLabelText("Learn Evaluations & judges"));
    expect(screen.getByLabelText("Current concept example")).toHaveTextContent(
      "Three reviewed presets",
    );
    expect(screen.getByText("OFFLINE EVALUATION / RECORDED FIXTURES")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /^Offline evaluation scene:/ })).toBeInTheDocument();
    expect(screen.getByLabelText("Current concept example")).toHaveTextContent(
      "Q3 bypasses generation",
    );
    focusLearning(1);
    expect(screen.getByRole("img", { name: /^Offline evaluation scene:/ })).toHaveTextContent(
      "2/3 facts",
    );
    expect(screen.getByRole("img", { name: /^Offline evaluation scene:/ })).toHaveTextContent(
      "LLM · idle",
    );
    focusLearning(2);
    expect(screen.getByLabelText("Current concept example")).toHaveTextContent(
      "Fixed context: IDENTICAL",
    );
    focusLearning(3);
    expect(screen.getByLabelText("Current concept example")).toHaveTextContent(
      "SIMULATED LLM-AS-JUDGE",
    );
    expect(progress()).toHaveAttribute("aria-valuenow", "0");
    fireEvent.click(screen.getByRole("button", { name: "Back to flow" }));
    expect(current()).toHaveTextContent("Scroll the cards");
  });
  it("separates schema and support checks and explains the tool-call authority", () => {
    render(<Lab />);
    fireEvent.click(screen.getByLabelText("Learn Guardrails & permissions"));
    focusLearning(2);
    expect(screen.getByLabelText("Current concept example")).toHaveTextContent(
      "SCHEMA PASS · SUPPORT FAIL",
    );
    fireEvent.click(screen.getByLabelText("Learn Tools & context"));
    focusLearning(1);
    expect(screen.getByLabelText("Current concept example")).toHaveTextContent(
      "Application code proposes this known-ID lookup",
    );
    focusLearning(3);
    expect(screen.getByLabelText("Current concept example")).toHaveTextContent("35 token budget");
  });
});

describe("RAG card gallery", () => {
  it("keeps the request topology understandable without WebGL", () => {
    render(<Lab />);
    answerStream();
    const diagram = screen.getByRole("img", { name: /^Question flow: user, input checks/ });
    for (const label of [
      "You",
      "Input checks",
      "Router",
      "Answer cache",
      "Small LLM",
      "LLM",
      "Tools",
      "Output checks",
    ])
      expect(within(diagram).getByText(label, { exact: true })).toBeInTheDocument();
  });
  it("keeps tools in a drawer and starts either stream without a prerequisite", () => {
    render(<Lab />);
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Next sub-step" })).not.toBeInTheDocument();
    expect(current()).toHaveTextContent("Scroll the cards.");
    expect(screen.getByRole("region", { name: "Scrollable learning cards" })).toHaveAttribute(
      "tabindex",
      "0",
    );
    focusCard(0, "input");
    expect(currentRegion("Step input")).toHaveTextContent("No question has been asked");
    answerStream();
    expect(current()).toHaveTextContent("One complete path.");
    focusCard(0, "input");
    expect(currentRegion("Step input")).toHaveTextContent("Who walked on the Moon");
    expect(progress()).toHaveAttribute("aria-valuenow", "0");
    openSettings();
    expect(screen.getByRole("button", { name: "35 tokens" })).toBeInTheDocument();
    closeDetails();
    expect(screen.queryByRole("button", { name: "35 tokens" })).not.toBeInTheDocument();
  });
  it("scrolls through operations and output, with annotations on the data path", () => {
    render(<Lab />);
    focusCard(1, "work", 1);
    expect(current()).toHaveTextContent("Choose a useful boundary");
    expect(screen.getByLabelText("Flow annotation")).toHaveTextContent("TRANSFORMING");
    focusCard(1, "work", 2);
    expect(screen.getByLabelText("Flow annotation")).toHaveTextContent("Measure the passage");
    focusCard(1, "output");
    expect(currentRegion("Step output")).toHaveTextContent("10 curated chunks");
    expect(screen.getByLabelText("Flow annotation")).toHaveTextContent("10 bounded chunks");
    fireEvent.click(within(current()).getByRole("button", { name: "Passage 2: A11-OV-HL1" }));
    expect(currentRegion("Step output")).toHaveTextContent("Cape Kennedy");
    focusCard(2, "input");
    expect(currentRegion("Step input")).toHaveTextContent("A11-OV-HL1");
  });
  it("preserves the place in each independent stream and never advances on a timer", () => {
    render(<Lab />);
    focusCard(2, "output");
    answerStream();
    expect(current()).toHaveTextContent("One complete path.");
    focusCard(3, "output");
    fireEvent.click(screen.getByRole("button", { name: /Build knowledge Documents/ }));
    expect(current()).toHaveTextContent("Embeddings · the result");
    expect(currentRegion("Step output")).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(120000));
    expect(current()).toHaveTextContent("Embeddings · the result");
    answerStream();
    expect(current()).toHaveTextContent("Retrieve · the result");
  });
  it("keeps the same story moment when the viewport height changes", () => {
    render(<Lab />);
    focusCard(2, "output");
    act(() => {
      galleryHeight = 700;
      fireEvent.resize(window);
      vi.runOnlyPendingTimers();
    });
    expect(current()).toHaveTextContent("Embeddings · the result");
    expect(currentRegion("Step output")).toBeInTheDocument();
    expect(progress()).toHaveAttribute("aria-valuenow", "1");
  });
  it("counts only viewed outputs, deduplicates reverse scroll, and resets on a new load", () => {
    render(<Lab />);
    expect(progress()).toHaveAttribute("aria-valuenow", "0");
    focusCard(1, "output");
    expect(progress()).toHaveAttribute("aria-valuenow", "1");
    focusCard(1, "input");
    focusCard(1, "output");
    expect(progress()).toHaveAttribute("aria-valuenow", "1");
    answerStream();
    focusCard(10, "output");
    expect(progress()).toHaveAttribute("aria-valuenow", "2");
    cleanup();
    render(<Lab />);
    expect(progress()).toHaveAttribute("aria-valuenow", "0");
  });
  it("releases a grounded answer and exposes citations without future data in earlier steps", () => {
    render(<Lab />);
    answerStream();
    focusCard(3, "input");
    expect(currentRegion("Step input")).toHaveTextContent("Return IDs and scores, not an answer");
    focusCard(10, "output");
    expect(currentRegion("Step output")).toHaveTextContent("Checked answer released");
    inspectRun();
    const report = screen.getByRole("region", { name: "What reached the user?" });
    expect(report).toHaveTextContent("Supported answer");
    fireEvent.click(within(report).getByRole("button", { name: "Inspect citation A11-OV-HL8" }));
    expect(screen.getByRole("dialog")).toHaveTextContent("NASA");
  });
  it("ends at an actual evidence gap when the context budget is too small", () => {
    render(<Lab />);
    answerStream();
    openSettings();
    fireEvent.click(screen.getByRole("button", { name: "35 tokens" }));
    closeDetails();
    focusCard(6, "output");
    expect(currentRegion("Step output")).toHaveTextContent("NO FACTUAL ANSWER RELEASED");
    expect(screen.queryByRole("link", { name: "Jump to Draft" })).not.toBeInTheDocument();
    inspectRun();
    expect(screen.getByRole("region", { name: "What reached the user?" })).toHaveTextContent(
      "Evidence gap",
    );
  });
  it("replays with warm prefix caches without skipping generation", () => {
    render(<Lab />);
    answerStream();
    openSettings();
    fireEvent.click(screen.getByRole("button", { name: /02 Spend less work/ }));
    fireEvent.click(screen.getByRole("button", { name: /Approved-answer cache/ }));
    fireEvent.click(screen.getByRole("button", { name: /Prompt-prefix cache/ }));
    closeDetails();
    focusCard(10, "output");
    fireEvent.click(screen.getByRole("button", { name: "Replay with warm caches" }));
    focusCard(10, "output");
    inspectRun();
    fireEvent.click(screen.getByRole("button", { name: /08 Draft generation done/ }));
    expect(
      screen.getByRole("complementary", { name: "Selected stage inspector" }),
    ).toHaveTextContent("hit; generation still ran");
  });
  it("stops a bad draft and preserves its controlled baseline comparison", () => {
    render(<Lab />);
    answerStream();
    openSettings();
    fireEvent.click(screen.getByRole("button", { name: /04 Control the boundary/ }));
    fireEvent.click(screen.getByRole("button", { name: "Invent a citation ID" }));
    closeDetails();
    focusCard(8, "output");
    inspectRun();
    const report = screen.getByRole("region", { name: "What reached the user?" });
    expect(report).toHaveTextContent("Withheld by a check");
    expect(
      within(report).queryByRole("button", { name: /Inspect citation/ }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Compare with the baseline/ }));
    expect(screen.getByRole("heading", { name: "Baseline · cold" })).toBeInTheDocument();
  });
  it("explains the default model reservation, then actually uses the large LLM after retrieval", () => {
    render(<Lab />);
    answerStream();
    focusCard(2, "work", 1);
    expect(current()).toHaveTextContent("Select the large LLM for later");
    expect(current()).toHaveTextContent("multi-part question");
    focusCard(3, "work", 1);
    expect(current()).toHaveTextContent("Send the question from router to retrieval");
    focusCard(7, "output");
    expect(currentRegion("Step output")).toHaveTextContent("LLM (large profile)");
    focusCard(10, "output");
    expect(currentRegion("Step output")).toHaveTextContent("Checked answer released");
  });
  it("switches to an independent cache-hit example and shows only its actual path", () => {
    render(<Lab />);
    answerStream();
    fireEvent.click(screen.getByRole("button", { name: "Choose question example" }));
    fireEvent.click(screen.getByRole("button", { name: "Repeat question · cache hit" }));
    expect(current()).toHaveTextContent("seeded");
    expect(screen.queryByRole("link", { name: "Jump to Retrieve" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Jump to Draft" })).not.toBeInTheDocument();
    focusCard(2, "output");
    expect(currentRegion("Step output")).toHaveTextContent("Reuse the answer → output checks");
    expect(currentRegion("Step output")).toHaveTextContent("both LLMs are bypassed");
    focusCard(10, "output");
    expect(currentRegion("Step output")).toHaveTextContent("Checked answer released");
    fireEvent.click(screen.getByRole("button", { name: "Choose question example" }));
    fireEvent.click(screen.getByRole("button", { name: "Full answer · large LLM" }));
    focusCard(2, "output");
    expect(currentRegion("Step output")).toHaveTextContent("cache miss");
  });
  it("shows concrete tool arguments and a safe user-facing output-check refusal", () => {
    render(<Lab />);
    answerStream();
    fireEvent.click(screen.getByRole("button", { name: "Choose question example" }));
    fireEvent.click(screen.getByRole("button", { name: "Missing passage · use a tool" }));
    focusCard(5, "work", 1);
    expect(current()).toHaveTextContent('evidence_id: "A11-LA-CAP"');
    expect(current()).toHaveTextContent("question names A11-LA-CAP");
    focusCard(10, "output");
    expect(currentRegion("Step output")).toHaveTextContent("Checked answer released");
    fireEvent.click(screen.getByRole("button", { name: "Choose question example" }));
    fireEvent.click(screen.getByRole("button", { name: "Output check · stop a bad citation" }));
    focusCard(8, "output");
    expect(currentRegion("Step output")).toHaveTextContent("RETURNED TO YOU");
    expect(currentRegion("Step output")).toHaveTextContent("UNKNOWN-SPAN");
    expect(screen.queryByRole("link", { name: "Jump to Answer" })).not.toBeInTheDocument();
  });
  it("keeps the author footer on the lab page with working profile links", () => {
    render(<Lab />);
    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveTextContent("© 2026 Arif Mehmood");
    expect(footer).toHaveTextContent("RAG Learning · AI Learning Lab");
    const links = within(footer).getAllByRole("link");
    expect(links.map((l) => l.getAttribute("href"))).toEqual([
      "https://www.linkedin.com/in/aarif9516/",
      "https://github.com/ArifMehmood16",
    ]);
    links.forEach((l) => expect(l).toHaveAttribute("target", "_blank"));
  });
});

