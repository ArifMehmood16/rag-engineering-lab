import { useEffect, useRef } from "react";
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
}: {
  wakeKey: string;
  visible: boolean;
  paused: boolean;
  reduced: boolean;
  fps?: number;
  settleAfter?: number;
  resetKey?: string;
  finishAt?: number;
}) {
  const { invalidate } = useThree();
  const time = useRef(0);
  useEffect(() => {
    time.current = reduced && finishAt !== undefined ? finishAt : 0;
  }, [resetKey, reduced, finishAt]);
  useEffect(() => {
    if (!visible) return;
    invalidate();
    if (paused || reduced || (finishAt !== undefined && time.current >= finishAt)) return;
    let previous = performance.now();
    const deadline = previous + settleAfter;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const now = performance.now();
      time.current += (now - previous) / 1000;
      previous = now;
      if (finishAt !== undefined) time.current = Math.min(finishAt, time.current);
      invalidate();
      if (now < deadline && (finishAt === undefined || time.current < finishAt))
        timer = setTimeout(tick, 1000 / fps);
    };
    timer = setTimeout(tick, 1000 / fps);
    return () => clearTimeout(timer);
  }, [wakeKey, visible, paused, reduced, fps, settleAfter, resetKey, finishAt, invalidate]);
  return time;
}
