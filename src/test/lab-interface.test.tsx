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
beforeEach(() => {
  vi.useFakeTimers();
  Object.defineProperty(window, "innerHeight", { configurable: true, writable: true, value: 768 });
  Object.defineProperty(window, "scrollY", { configurable: true, writable: true, value: 0 });
  vi.spyOn(window, "scrollTo").mockImplementation((options: number | ScrollToOptions) => {
    if (typeof options === "object")
      Object.defineProperty(window, "scrollY", { value: options.top ?? 0 });
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
function scrollTo(stage: number, progress: number) {
  act(() => {
    Object.defineProperty(window, "scrollY", {
      value: (stage + progress) * 2.4 * window.innerHeight,
    });
    fireEvent.scroll(window);
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

describe("RAG scroll lab", () => {
  it("keeps tools in a drawer and starts either stream without a prerequisite", () => {
    render(<Lab />);
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Next sub-step" })).not.toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Step input" })).toHaveTextContent(
      "No question has been asked",
    );
    answerStream();
    expect(screen.getByRole("region", { name: "Step input" })).toHaveTextContent(
      "Who walked on the Moon",
    );
    expect(progress()).toHaveAttribute("aria-valuenow", "0");
    openSettings();
    expect(screen.getByRole("button", { name: "35 tokens" })).toBeInTheDocument();
    closeDetails();
    expect(screen.queryByRole("button", { name: "35 tokens" })).not.toBeInTheDocument();
  });
  it("scrolls through operations and output, with annotations on the data path", () => {
    render(<Lab />);
    scrollTo(1, 0.2);
    expect(screen.getByRole("region", { name: "Step work" })).toHaveTextContent(
      "Choose a useful boundary",
    );
    expect(screen.getByLabelText("Flow annotation")).toHaveTextContent("TRANSFORMING");
    scrollTo(1, 0.4);
    expect(screen.getByLabelText("Flow annotation")).toHaveTextContent("Measure the passage");
    scrollTo(1, 0.8);
    expect(screen.getByRole("region", { name: "Step output" })).toHaveTextContent(
      "10 curated chunks",
    );
    expect(screen.getByLabelText("Flow annotation")).toHaveTextContent("10 bounded chunks");
    fireEvent.click(screen.getByRole("button", { name: "Passage 2: A11-OV-HL1" }));
    expect(screen.getByRole("region", { name: "Step output" })).toHaveTextContent("Cape Kennedy");
    scrollTo(2, 0);
    expect(screen.getByRole("region", { name: "Step input" })).toHaveTextContent("A11-OV-HL1");
  });
  it("preserves the place in each independent stream and never advances on a timer", () => {
    render(<Lab />);
    scrollTo(2, 0.8);
    answerStream();
    expect(
      screen.getByRole("heading", { name: "Understand what the question needs" }),
    ).toBeInTheDocument();
    scrollTo(3, 0.8);
    fireEvent.click(screen.getByRole("button", { name: /Build knowledge Documents/ }));
    expect(
      screen.getByRole("heading", { name: "Encode each chunk as a numeric vector" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Step output" })).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(120000));
    expect(
      screen.getByRole("heading", { name: "Encode each chunk as a numeric vector" }),
    ).toBeInTheDocument();
    answerStream();
    expect(
      screen.getByRole("heading", { name: "Retrieve passages that match the question" }),
    ).toBeInTheDocument();
  });
  it("keeps the same story moment when the viewport height changes", () => {
    render(<Lab />);
    scrollTo(2, 0.8);
    act(() => {
      Object.defineProperty(window, "innerHeight", { value: 1024 });
      fireEvent.resize(window);
      vi.runOnlyPendingTimers();
    });
    expect(
      screen.getByRole("heading", { name: "Encode each chunk as a numeric vector" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Step output" })).toBeInTheDocument();
    expect(progress()).toHaveAttribute("aria-valuenow", "1");
  });
  it("counts only viewed outputs, deduplicates reverse scroll, and resets on a new load", () => {
    render(<Lab />);
    expect(progress()).toHaveAttribute("aria-valuenow", "0");
    scrollTo(1, 0.8);
    expect(progress()).toHaveAttribute("aria-valuenow", "1");
    scrollTo(1, 0.1);
    scrollTo(1, 0.8);
    expect(progress()).toHaveAttribute("aria-valuenow", "1");
    answerStream();
    scrollTo(10, 0.8);
    expect(progress()).toHaveAttribute("aria-valuenow", "2");
    cleanup();
    render(<Lab />);
    expect(progress()).toHaveAttribute("aria-valuenow", "0");
  });
  it("releases a grounded answer and exposes citations without future data in earlier steps", () => {
    render(<Lab />);
    answerStream();
    scrollTo(3, 0);
    expect(screen.getByRole("region", { name: "Step input" })).toHaveTextContent(
      "Return IDs and scores, not an answer",
    );
    scrollTo(10, 0.8);
    expect(screen.getByRole("region", { name: "Step output" })).toHaveTextContent(
      "Checked answer released",
    );
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
    scrollTo(6, 0.8);
    expect(screen.getByRole("region", { name: "Step output" })).toHaveTextContent("Stopped here");
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
    scrollTo(10, 0.8);
    fireEvent.click(screen.getByRole("button", { name: "Replay with warm caches" }));
    scrollTo(10, 0.8);
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
    scrollTo(8, 0.8);
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
