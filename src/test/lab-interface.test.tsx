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
    expect(current()).toHaveTextContent("Scroll the cards.");
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
    expect(current()).toHaveTextContent("Scroll the cards.");
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
    expect(currentRegion("Step output")).toHaveTextContent("Stopped here");
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
});
