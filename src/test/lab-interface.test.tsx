import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
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
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

function renderPreparedLab() {
  render(<Lab />);
  fireEvent.click(screen.getByRole("button", { name: "Use prepared index" }));
}

describe("RAG lab interface", () => {
  it("runs the pipeline and exposes citations without a model or an input form", () => {
    renderPreparedLab();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Run to result" }));
    const report = screen.getByRole("region", { name: "What reached the user?" });
    expect(within(report).getByText("Supported answer")).toBeInTheDocument();
    fireEvent.click(within(report).getByRole("button", { name: "Inspect citation A11-OV-HL8" }));
    expect(screen.getByRole("dialog")).toHaveTextContent("first EVA");
    expect(screen.getByRole("dialog")).toHaveTextContent("NASA");
  });

  it("changing the real context budget produces an evidence gap", () => {
    renderPreparedLab();
    fireEvent.click(screen.getByRole("button", { name: "35 tokens" }));
    fireEvent.click(screen.getByRole("button", { name: "Run to result" }));
    const report = screen.getByRole("region", { name: "What reached the user?" });
    expect(within(report).getByText("Evidence gap")).toBeInTheDocument();
    expect(
      within(report).queryByRole("button", { name: /Inspect citation/ }),
    ).not.toBeInTheDocument();
  });

  it("repeats a prompt-cached request while generation still runs", () => {
    renderPreparedLab();
    fireEvent.click(screen.getByRole("button", { name: /02 Spend less work/ }));
    fireEvent.click(screen.getByRole("button", { name: /Prompt-prefix cache/ }));
    fireEvent.click(screen.getByRole("button", { name: "Run to result" }));
    fireEvent.click(screen.getByRole("button", { name: "Repeat instantly" }));
    fireEvent.click(screen.getByRole("button", { name: /08 Draft generation done/ }));
    const inspector = screen.getByRole("complementary", { name: "Selected stage inspector" });
    expect(inspector).toHaveTextContent("hit; generation still ran");
    expect(screen.getByRole("region", { name: "What reached the user?" })).toHaveTextContent(
      "Supported answer",
    );
  });

  it("keeps bad drafts out of the released answer and exposes a controlled comparison", () => {
    renderPreparedLab();
    fireEvent.click(screen.getByRole("button", { name: /04 Control the boundary/ }));
    fireEvent.click(screen.getByRole("button", { name: "Invent a citation ID" }));
    fireEvent.click(screen.getByRole("button", { name: "Run to result" }));
    const report = screen.getByRole("region", { name: "What reached the user?" });
    expect(report).toHaveTextContent("Withheld by a check");
    expect(
      within(report).queryByRole("button", { name: /Inspect citation/ }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Compare with the baseline/ }));
    expect(screen.getByRole("heading", { name: "Baseline · cold" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Your configuration · cold" })).toBeInTheDocument();
  });

  it("starts before any question and exposes each preparation operation and chunk output", () => {
    render(<Lab />);
    expect(screen.getByRole("button", { name: "02 Answer a question" })).toBeDisabled();
    expect(screen.getByRole("region", { name: "Step input" })).toHaveTextContent(
      "No question has been asked",
    );
    expect(screen.getByRole("region", { name: "Step output" })).toHaveTextContent(
      "Output appears after the work",
    );
    for (let stage = 0; stage < 4; stage++) {
      for (let beat = 0; beat < 4; beat++)
        fireEvent.click(screen.getByRole("button", { name: /^(Next sub-step|Show output)$/ }));
      expect(screen.getByRole("status")).toHaveTextContent("Paused at output");
      if (stage === 1) {
        fireEvent.click(screen.getByRole("button", { name: "Passage 2: A11-OV-HL1" }));
        expect(screen.getByRole("region", { name: "Step output" })).toHaveTextContent(
          "Cape Kennedy",
        );
      }
      if (stage === 2)
        expect(screen.getByRole("region", { name: "Step input" })).toHaveTextContent("A11-OV-HL1");
      fireEvent.click(
        screen.getByRole("button", { name: stage === 3 ? "Ask the first question" : "Next stage" }),
      );
    }
    expect(screen.getByRole("button", { name: "02 Answer a question" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("region", { name: "Step input" })).toHaveTextContent(
      "Who walked on the Moon",
    );
  });

  it("plays readable substeps and pauses indefinitely on output", () => {
    vi.useFakeTimers();
    render(<Lab />);
    fireEvent.click(screen.getByRole("button", { name: "Play this step" }));
    act(() => vi.advanceTimersByTime(5999));
    expect(screen.getByRole("region", { name: "Step input" })).toHaveAttribute(
      "data-attention",
      "true",
    );
    act(() => vi.advanceTimersByTime(1));
    expect(screen.getByRole("region", { name: "Step work" })).toHaveAttribute(
      "data-attention",
      "true",
    );
    for (let beat = 0; beat < 3; beat++) act(() => vi.advanceTimersByTime(6000));
    expect(screen.getByRole("status")).toHaveTextContent("Paused at output");
    act(() => vi.advanceTimersByTime(120000));
    expect(
      screen.getByRole("heading", { name: "Read and identify the source material" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Step output" })).toHaveAttribute(
      "data-attention",
      "true",
    );
    expect(screen.getByRole("button", { name: "Next stage" })).toBeEnabled();
  });
});
