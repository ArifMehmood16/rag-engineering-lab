import { KNOWLEDGE_WALKTHROUGH, REQUEST_WALKTHROUGH } from "@/content/rag-walkthrough";
import type { EngineState } from "./apollo-engine";
import type { StoryStream } from "./rag-scroll-story";

export interface StoryCard {
  id: string;
  stage: number;
  beat: number;
  kind: "intro" | "input" | "work" | "output";
  title: string;
}
export interface GalleryPlace {
  index: number;
  offset: number;
}

/** Every operation has a real card. The introduction explains the interaction before it starts. */
export function storyCards(
  stream: StoryStream,
  count: number,
  frames?: EngineState[],
): StoryCard[] {
  const steps = stream === "knowledge" ? KNOWLEDGE_WALKTHROUGH : REQUEST_WALKTHROUGH;
  const cards: StoryCard[] = [
    {
      id: `${stream}:intro`,
      stage: 0,
      beat: 0,
      kind: "intro",
      title: "Scroll the cards. Watch the system move.",
    },
  ];
  steps.slice(0, count).forEach((step, stage) => {
    const before = frames?.[stage];
    const skipped =
      stream === "request" && frames?.[stage + 1]?.results[stage]?.status === "skipped";
    if (skipped && !(stage === 5 && !before?.ctx.usage.answerHit)) return;
    if (skipped) {
      cards.push({
        id: `${stream}:${stage}:output`,
        stage,
        beat: step.work.length + 1,
        kind: "output",
        title: "No extra tool call",
      });
      return;
    }
    cards.push({
      id: `${stream}:${stage}:input`,
      stage,
      beat: 0,
      kind: "input",
      title: step.title,
    });
    step.work.forEach((work, i) =>
      cards.push({
        id: `${stream}:${stage}:work:${i}`,
        stage,
        beat: i + 1,
        kind: "work",
        title: work.title,
      }),
    );
    cards.push({
      id: `${stream}:${stage}:output`,
      stage,
      beat: step.work.length + 1,
      kind: "output",
      title: `${step.short} · the result`,
    });
  });
  return cards;
}

/** The centred card owns the scene; moving across its reading area scrubs one operation. */
export function gallerySelection(
  cards: StoryCard[],
  centers: number[],
  top: number,
  height: number,
  preferredIndex?: number,
) {
  const focus = top + height / 2;
  let index = 0;
  for (let i = 1; i < centers.length; i++)
    if (Math.abs(centers[i]! - focus) < Math.abs(centers[index]! - focus)) index = i;
  if (preferredIndex !== undefined) index = preferredIndex;
  index = Math.min(index, cards.length - 1);
  const center = centers[index] ?? focus;
  const left = ((centers[index - 1] ?? center - height) + center) / 2;
  const right = (center + (centers[index + 1] ?? center + height)) / 2;
  const offset = Math.max(
    -1,
    Math.min(1, (focus - center) / Math.max(1, focus < center ? center - left : right - center)),
  );
  const card = cards[index]!;
  const work = (card.id.startsWith("knowledge:") ? KNOWLEDGE_WALKTHROUGH : REQUEST_WALKTHROUGH)[
    card.stage
  ]!.work.length;
  const local = Math.max(0, Math.min(1, (focus - left) / Math.max(1, right - left)));
  const transfer =
    card.kind === "output" ? 1 : card.kind === "work" ? (card.beat - 1 + local) / work : 0;
  return { index, offset, transfer };
}

/** Long worked examples retain focus while their content occupies most of the reading window. */
export function galleryReadingSelection(
  cards: StoryCard[],
  centers: number[],
  bounds: { top: number; height: number }[],
  top: number,
  height: number,
) {
  let selected = gallerySelection(cards, centers, top, height).index;
  const visible = (index: number) => {
    const card = bounds[index];
    return card
      ? Math.max(0, Math.min(top + height, card.top + card.height) - Math.max(top, card.top))
      : 0;
  };
  let most = visible(selected);
  bounds.forEach((_, index) => {
    const area = visible(index);
    if (area > most) {
      selected = index;
      most = area;
    }
  });
  return gallerySelection(cards, centers, top, height, selected);
}

/** Store the place relative to its card so a resized column keeps the same reading moment. */
export function galleryScrollTarget(place: GalleryPlace, centers: number[], height: number) {
  const index = Math.max(0, Math.min(place.index, centers.length - 1));
  const center = centers[index] ?? height / 2;
  const span =
    place.offset < 0
      ? center - (centers[index - 1] ?? center - height)
      : (centers[index + 1] ?? center + height) - center;
  return Math.max(0, center + (Math.max(-1, Math.min(1, place.offset)) * span) / 2 - height / 2);
}
