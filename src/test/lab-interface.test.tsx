import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
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
afterEach(cleanup);

describe("RAG lab interface", () => {
  it("runs the pipeline and exposes citations without a model or an input form", () => {
    render(<Lab />);
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Run to result" }));
    const report = screen.getByRole("region", { name: "What reached the user?" });
    expect(within(report).getByText("Supported answer")).toBeInTheDocument();
    fireEvent.click(within(report).getByRole("button", { name: "Inspect citation A11-OV-HL8" }));
    expect(screen.getByRole("dialog")).toHaveTextContent("first EVA");
    expect(screen.getByRole("dialog")).toHaveTextContent("NASA");
  });

  it("changing the real context budget produces an evidence gap", () => {
    render(<Lab />);
    fireEvent.click(screen.getByRole("button", { name: "35 tokens" }));
    fireEvent.click(screen.getByRole("button", { name: "Run to result" }));
    const report = screen.getByRole("region", { name: "What reached the user?" });
    expect(within(report).getByText("Evidence gap")).toBeInTheDocument();
    expect(
      within(report).queryByRole("button", { name: /Inspect citation/ }),
    ).not.toBeInTheDocument();
  });

  it("repeats a prompt-cached request while generation still runs", () => {
    render(<Lab />);
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
    render(<Lab />);
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
});
