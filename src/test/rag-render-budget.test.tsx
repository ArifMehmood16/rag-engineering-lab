import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, renderHook } from "@testing-library/react";
import { useSceneFrames } from "@/components/lab/useSceneFrames";
import { theatreProgress } from "@/lib/rag-motion";

const { invalidate } = vi.hoisted(() => ({ invalidate: vi.fn() }));
vi.mock("@react-three/fiber", () => ({ useThree: () => ({ invalidate }) }));
const base = { wakeKey: "knowledge:0", visible: true, paused: false, reduced: false };

describe("the scene's reading-time render budget", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "performance"] });
    invalidate.mockClear();
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("settles automatically, with no scheduled frames during reading; a new step wakes it", () => {
    const { rerender } = renderHook((props) => useSceneFrames(props), { initialProps: base });
    act(() => vi.advanceTimersByTime(3000));
    expect(invalidate.mock.calls.length).toBeGreaterThan(60);
    expect(invalidate.mock.calls.length).toBeLessThan(80);
    expect(vi.getTimerCount()).toBe(0);
    const calls = invalidate.mock.calls.length;
    act(() => vi.advanceTimersByTime(30000));
    expect(invalidate).toHaveBeenCalledTimes(calls);
    rerender({ ...base, wakeKey: "knowledge:1" });
    expect(vi.getTimerCount()).toBe(1);
  });

  it.each(["paused", "reduced"] as const)(
    "freezes on %s and still draws the selected snapshot",
    (flag) => {
      const { result, rerender } = renderHook((props) => useSceneFrames(props), {
        initialProps: base,
      });
      act(() => vi.advanceTimersByTime(500));
      rerender({ ...base, [flag]: true });
      const frozen = result.current.current;
      const calls = invalidate.mock.calls.length;
      expect(vi.getTimerCount()).toBe(0);
      act(() => vi.advanceTimersByTime(10000));
      expect(result.current.current).toBe(frozen);
      expect(invalidate).toHaveBeenCalledTimes(calls);
      rerender({ ...base, [flag]: true, wakeKey: "knowledge:2" });
      expect(invalidate).toHaveBeenCalledTimes(calls + 1);
    },
  );

  it("cancels hidden/unmounted work and does not advance its visual clock in the background", () => {
    const { result, rerender, unmount } = renderHook((props) => useSceneFrames(props), {
      initialProps: base,
    });
    act(() => vi.advanceTimersByTime(500));
    rerender({ ...base, visible: false });
    const frozen = result.current.current;
    act(() => vi.advanceTimersByTime(60000));
    expect(result.current.current).toBe(frozen);
    expect(vi.getTimerCount()).toBe(0);
    rerender(base);
    act(() => vi.advanceTimersByTime(100));
    expect(result.current.current - frozen).toBeLessThan(0.15);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("finishes a recorded example once, resumes from pause, and resets only on replay/mode", () => {
    const initial = { ...base, settleAfter: 16000, finishAt: 16, resetKey: "cold:0" };
    const { result, rerender } = renderHook((props) => useSceneFrames(props), {
      initialProps: initial,
    });
    act(() => vi.advanceTimersByTime(5000));
    rerender({ ...initial, paused: true });
    const frozen = result.current.current;
    act(() => vi.advanceTimersByTime(5000));
    expect(result.current.current).toBe(frozen);
    rerender(initial);
    act(() => vi.advanceTimersByTime(17000));
    expect(result.current.current).toBe(16);
    expect(vi.getTimerCount()).toBe(0);
    rerender({ ...initial, resetKey: "warm:0" });
    expect(result.current.current).toBe(0);
    expect(vi.getTimerCount()).toBe(1);
  });

  it("keeps only the ambient clock running at 12 FPS after the transition settles", () => {
    const ambientTime = { current: 0 };
    const { result, unmount } = renderHook(() => useSceneFrames({ ...base, ambientTime }));
    act(() => vi.advanceTimersByTime(3000));
    const transition = result.current.current;
    const ambient = ambientTime.current;
    const calls = invalidate.mock.calls.length;
    act(() => vi.advanceTimersByTime(10000));
    expect(result.current.current).toBe(transition);
    expect(ambientTime.current - ambient).toBeCloseTo(10, 0);
    expect(invalidate.mock.calls.length - calls).toBeGreaterThanOrEqual(119);
    expect(invalidate.mock.calls.length - calls).toBeLessThanOrEqual(121);
    expect(vi.getTimerCount()).toBe(1);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it.each(["paused", "reduced", "hidden"] as const)("stops both clocks when %s", (flag) => {
    const ambientTime = { current: 0 };
    const initial = { ...base, ambientTime };
    const { result, rerender } = renderHook((props) => useSceneFrames(props), { initialProps: initial });
    act(() => vi.advanceTimersByTime(4000));
    rerender({ ...initial, paused: flag === "paused", reduced: flag === "reduced", visible: flag !== "hidden" });
    const ambient = ambientTime.current;
    const transition = result.current.current;
    const calls = invalidate.mock.calls.length;
    act(() => vi.advanceTimersByTime(30000));
    expect(ambientTime.current).toBe(ambient);
    expect(result.current.current).toBe(transition);
    expect(invalidate).toHaveBeenCalledTimes(calls);
    expect(vi.getTimerCount()).toBe(0);
    rerender(initial);
    act(() => vi.advanceTimersByTime(100));
    expect(ambientTime.current - ambient).toBeLessThan(0.15);
    expect(ambientTime.current).toBeGreaterThan(ambient);
  });
});

it("lets every evaluation case finish its own path without wrapping to the input", () => {
  for (const offset of [0, 0.25, 0.5]) {
    expect(theatreProgress(0, offset)).toBe(0);
    expect(theatreProgress(5, offset)).toBeGreaterThanOrEqual(0);
    expect(theatreProgress(16, offset)).toBe(1);
    expect(theatreProgress(60, offset)).toBe(1);
  }
});
