import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { expect, it } from "vitest";
import { Route as demo } from "@/routes/demos.top-k";

it("checks only the applied context and exposes citations only for a supported reply", async () => {
  const root = createRootRoute();
  const workbench = createRoute({
    getParentRoute: () => root,
    path: "/demos/top-k",
    validateSearch: demo.options.validateSearch!,
    component: demo.options.component!,
  });
  const router = createRouter({
    routeTree: root.addChildren([workbench]),
    history: createMemoryHistory({ initialEntries: ["/demos/top-k"] }),
  });
  await router.load();
  render(<RouterProvider router={router} />);
  const reply = screen.getByRole("region", { name: "What the handler sees" });
  fireEvent.click(screen.getByRole("radio", { name: "reranked" }));
  expect(reply).not.toHaveTextContent("£");
  expect(screen.getByTestId("m-Tokens used")).toHaveTextContent("200 / 220");
  fireEvent.click(screen.getByRole("button", { name: "Apply" }));
  await waitFor(() => expect(reply).toHaveTextContent("£750"));
  expect(router.state.location.search.ordering).toBe("reranked");
  expect(screen.getByTestId("m-Tokens used")).toHaveTextContent("190 / 220");
  expect(within(reply).getByRole("link", { name: /E3-P1/ })).toHaveAttribute("href", "#E3-P1");
  expect(document.getElementById("E3-P1")).toHaveTextContent("1 April 2026 inclusive");
  fireEvent.change(screen.getByLabelText("Model output to test"), {
    target: { value: "extraPromise" },
  });
  await waitFor(() => expect(reply).toHaveTextContent("Needs verification"));
  expect(screen.getByRole("region", { name: "Model draft" })).toHaveTextContent(
    "Your claim is approved",
  );
  expect(reply).not.toHaveTextContent(/£|approved/);
  expect(within(reply).queryByRole("link")).toBeNull();
});
