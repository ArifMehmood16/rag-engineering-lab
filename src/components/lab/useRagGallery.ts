import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { galleryScrollTarget, gallerySelection, type StoryCard } from "@/lib/rag-gallery";
import type { StoryStream } from "@/lib/rag-scroll-story";

type Focus = { stream: StoryStream; index: number; offset: number; transfer: number };
export function useRagGallery(
  cards: StoryCard[],
  stream: StoryStream,
  visible: boolean,
  reduced: boolean,
) {
  const viewport = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const elements = useRef(new Map<string, HTMLElement>());
  const centers = useRef<number[]>([]);
  const places = useRef<Record<StoryStream, Omit<Focus, "stream">>>({
    knowledge: { index: 0, offset: 0, transfer: 0 },
    request: { index: 0, offset: 0, transfer: 0 },
  });
  const [focus, setFocus] = useState<Focus>({ stream, ...places.current[stream] });
  const measureNow = useRef(() => {});
  const selected = focus.stream === stream ? focus : { stream, ...places.current[stream] };

  useLayoutEffect(() => {
    const list = viewport.current;
    const content = track.current;
    if (!list || !content) return;
    let frame = 0;
    const paintAndMeasure = () => {
      frame = 0;
      if (!visible) return;
      const next = gallerySelection(cards, centers.current, list.scrollTop, list.clientHeight);
      places.current[stream] = next;
      const rounded = { ...next, transfer: Math.round(next.transfer * 500) / 500, stream };
      setFocus((prev) =>
        prev.stream === stream && prev.index === rounded.index && prev.transfer === rounded.transfer
          ? prev
          : rounded,
      );
      const middle = list.scrollTop + list.clientHeight / 2;
      cards.forEach((card, index) => {
        const el = elements.current.get(card.id);
        if (!el) return;
        const distance =
          ((centers.current[index] ?? middle) - middle) / Math.max(1, list.clientHeight * 0.62);
        const depth = Math.min(Math.abs(distance), 1.4);
        el.style.setProperty("--gallery-scale", String(1 - Math.min(depth, 1) * 0.09));
        el.style.setProperty(
          "--gallery-tilt",
          `${reduced ? 0 : Math.max(-11, Math.min(11, distance * -8))}deg`,
        );
        el.style.setProperty("--gallery-depth", `${reduced ? 0 : -depth * 32}px`);
        el.style.setProperty("--gallery-opacity", String(1 - Math.min(depth, 1) * 0.3));
      });
      list.style.setProperty(
        "--gallery-progress",
        String(list.scrollTop / Math.max(1, list.scrollHeight - list.clientHeight)),
      );
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(paintAndMeasure);
    };
    const layout = () => {
      const saved = places.current[stream];
      const first = elements.current.get(cards[0]!.id);
      const last = elements.current.get(cards.at(-1)!.id);
      content.style.paddingTop = `${Math.max(24, (list.clientHeight - (first?.offsetHeight ?? 0)) / 2)}px`;
      content.style.paddingBottom = `${Math.max(24, (list.clientHeight - (last?.offsetHeight ?? 0)) / 2)}px`;
      centers.current = cards.map((card) => {
        const el = elements.current.get(card.id);
        return (el?.offsetTop ?? 0) + (el?.offsetHeight ?? 0) / 2;
      });
      list.scrollTo({
        top: galleryScrollTarget(saved, centers.current, list.clientHeight),
        behavior: "instant",
      });
      paintAndMeasure();
    };
    measureNow.current = paintAndMeasure;
    list.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", layout);
    const observer = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(layout);
    observer?.observe(list);
    observer?.observe(content);
    layout();
    return () => {
      list.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", layout);
      observer?.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [cards, stream, visible, reduced]);

  const goTo = useCallback(
    (index: number, smooth = false) => {
      const list = viewport.current;
      if (!list) return;
      const place = { index, offset: 0, transfer: 0 };
      places.current[stream] = place;
      list.scrollTo({
        top: galleryScrollTarget(place, centers.current, list.clientHeight),
        behavior: smooth && !reduced ? "smooth" : "instant",
      });
      if (!smooth || reduced) measureNow.current();
    },
    [stream, reduced],
  );
  return { viewport, track, elements, selected, goTo };
}
