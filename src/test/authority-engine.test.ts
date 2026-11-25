import { describe, expect, it } from "vitest";
import {
  DEFAULT_SPEED,
  DURATION,
  JUMPS,
  PACKETS,
  PRESETS,
  presetScene,
  sceneAt,
} from "@/lib/authority/engine.js";

describe("Authority animation timing", () => {
  it("starts at 1× and ends on the success segment", () => {
    expect(DEFAULT_SPEED).toBe(1);
    expect(sceneAt(DURATION).segment).toBe("success");
  });
  it("splits the story into problem, transition and solution runs", () => {
    expect(sceneAt(27.99).run).toBe("problem");
    for (const t of [28, 31, 34.99]) {
      const scene = sceneAt(t);
      expect(scene.run).toBe("transition");
      expect(scene.packets).toHaveLength(0);
      expect(scene.pricingLeaked).toBe(false);
      expect(scene.resetBanner).toContain("Independent replay");
    }
    expect(sceneAt(35).run).toBe("solution");
  });
  it("leaks internal pricing in the broad-access run and holds the outcome", () => {
    expect(sceneAt(21.39).pricingLeaked).toBe(false);
    for (const t of [21.4, 24, 27.99]) {
      const scene = sceneAt(t);
      expect(scene.pricingLeaked).toBe(true);
      expect(scene.outcome).toBe("PROBLEM OUTCOME: Internal pricing leaked.");
      expect(scene.nodes.find((n) => n.id === "recipient")?.sub).toContain("PRICING SENT");
    }
  });
  it("rejects the pricing attachment and recipient override in the enforced run", () => {
    expect(sceneAt(40.99).decisions.find((d) => d.id === "pricing-attachment")?.status).toBe(
      "PENDING",
    );
    const checked = sceneAt(41);
    expect(checked.decisions.find((d) => d.id === "pricing-attachment")?.status).toBe("DENY");
    expect(checked.decisions.find((d) => d.id === "recipient-override")?.status).toBe("DENY");
    expect(checked.nodes.find((n) => n.id === "pricing")?.sub).toBe("NOT READ · rejected");
    // No solution packet ever reaches the pricing store or carries pricing to the recipient.
    expect(PACKETS.filter((p) => p.run === "solution" && p.to === "pricing")).toHaveLength(0);
    expect(PACKETS.filter((p) => p.run === "solution" && p.kind === "data")).toHaveLength(0);
  });
  it("delivers only the application-built message to the selected supplier", () => {
    expect(sceneAt(51.99).delivered).toBe(false);
    const final = sceneAt(60);
    expect(final.delivered).toBe(true);
    expect(final.outcome).toBe("Delivery update sent. Internal pricing excluded.");
    expect(final.decisions.map((d) => d.status)).toEqual([
      "DENY",
      "DENY",
      "FIXED TEMPLATE",
      "DELIVERED",
    ]);
    expect(final.nodes.find((n) => n.id === "user")?.sub).toBe(
      "Delivery update sent. Internal pricing excluded.",
    );
    expect(final.nodes.find((n) => n.id === "recipient")?.label).toBe("Supplier contact");
    // The sender only ever receives the fixed template from the application.
    const senderInputs = PACKETS.filter((p) => p.run === "solution" && p.to === "sender");
    expect(senderInputs).toHaveLength(1);
    expect(senderInputs[0]?.from).toBe("app");
    expect(senderInputs[0]?.kind).toBe("allowed");
  });
  it("seeks deterministically before, at and after each chapter boundary", () => {
    for (const boundary of [6, 14, 23, 28, 35, 49, 55, 60]) {
      for (const t of [boundary - 0.01, boundary, boundary + 0.01]) {
        const direct = sceneAt(t);
        for (let tick = 0; tick < t; tick += 0.25) sceneAt(tick);
        expect(sceneAt(t)).toEqual(direct);
        expect(direct.packets.every((p) => p.run === direct.run)).toBe(true);
      }
    }
    expect(JUMPS.find((j) => j.id === "changes")?.t).toBe(28);
  });
  it("exports exactly three article figures, with a blocked pricing route in the HLD", () => {
    expect(PRESETS.map((p) => p.id)).toEqual([
      "01-three-capabilities",
      "02-how-the-leak-happens",
      "03-separate-jobs",
    ]);
    const { scene } = presetScene("03-separate-jobs");
    expect(scene.w).toBe(2400);
    expect(scene.h).toBe(1350);
    expect(scene.packets).toHaveLength(0);
    const blocked = scene.edges.find((e) => e.state === "cut");
    expect(blocked).toBeTruthy();
    expect(blocked?.label).toContain("pricing not permitted");
    expect(scene.nodes.map((n) => n.id)).toEqual(
      expect.arrayContaining([
        "note",
        "agent",
        "taskctx",
        "store",
        "app",
        "pricing",
        "mail",
        "supplier",
      ]),
    );
  });
});
