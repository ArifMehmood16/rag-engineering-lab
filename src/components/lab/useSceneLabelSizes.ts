import { useLayoutEffect, useRef, type RefObject } from "react";
import { useThree } from "@react-three/fiber";
import type { SceneNode } from "@/lib/rag-scene";

/** Measure on content/size changes, never between per-frame position writes. */
export function useSceneLabelSizes(
  labels?: RefObject<Map<SceneNode, HTMLDivElement>>,
  annotation?: RefObject<HTMLDivElement | null>,
) {
  const sizes = useRef(new Map<HTMLElement, { width: number; height: number }>());
  const { invalidate } = useThree();
  useLayoutEffect(() => {
    const elements = [
      ...(labels?.current.values() ?? []),
      ...(annotation?.current ? [annotation.current] : []),
    ];
    const measure = () => {
      for (const el of elements)
        sizes.current.set(el, { width: el.offsetWidth, height: el.offsetHeight });
      invalidate();
    };
    measure();
    const observer = new ResizeObserver(measure);
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  });
  return sizes;
}
