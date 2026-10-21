import { useEffect, useRef, type RefObject } from "react";
import { useThree } from "@react-three/fiber";

/** Brief demand-rendered transitions. Reading an unchanged card schedules no frames. */
export function useSceneFrames({
  wakeKey,
  visible,
  paused,
  reduced,
  fps = 30,
  settleAfter = 2500,
  resetKey,
  finishAt,
  ambientTime,
  ambientFps = 12,
}: {
  wakeKey: string;
  visible: boolean;
  paused: boolean;
  reduced: boolean;
  fps?: number;
  settleAfter?: number;
  resetKey?: string;
  finishAt?: number;
  ambientTime?: RefObject<number>;
  ambientFps?: number;
}) {
  const { invalidate } = useThree();
  const time = useRef(0);
  useEffect(() => {
    time.current = reduced && finishAt !== undefined ? finishAt : 0;
  }, [resetKey, reduced, finishAt]);
  useEffect(() => {
    if (!visible) return;
    invalidate();
    if (paused || reduced) return;
    const finished = () => finishAt !== undefined && time.current >= finishAt;
    if (finished() && !ambientTime) return;
    let previous = performance.now();
    const deadline = previous + settleAfter;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const now = performance.now();
      const transitioning = previous < deadline && !finished();
      if (transitioning) time.current += (Math.min(now, deadline) - previous) / 1000;
      if (ambientTime) ambientTime.current += (now - previous) / 1000;
      previous = now;
      if (finishAt !== undefined) time.current = Math.min(finishAt, time.current);
      invalidate();
      const keepTransitioning = now < deadline && !finished();
      if (keepTransitioning || ambientTime)
        timer = setTimeout(tick, 1000 / (keepTransitioning ? fps : ambientFps));
    };
    timer = setTimeout(tick, 1000 / (finished() ? ambientFps : fps));
    return () => clearTimeout(timer);
  }, [
    wakeKey,
    visible,
    paused,
    reduced,
    fps,
    settleAfter,
    resetKey,
    finishAt,
    ambientTime,
    ambientFps,
    invalidate,
  ]);
  return time;
}
