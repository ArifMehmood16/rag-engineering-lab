import {
  ANSWER_CASES,
  DRAFT_OPTIONS,
  type AnswerCase,
  type DraftVariant,
} from "@/content/answer-delivery";
import type { Ordering } from "./topk";

export interface TopKSearch {
  k?: number | undefined;
  budget?: number | undefined;
  ordering?: Ordering | undefined;
  case?: AnswerCase | undefined;
  draft?: DraftVariant | undefined;
}

function boundedInteger(value: unknown, min: number, max: number, step: number) {
  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    value < min ||
    value > max ||
    value % step !== 0
  )
    return undefined;
  return value;
}

export function topKSearch(search: Record<string, unknown>): TopKSearch {
  const draft = search["draft"];
  return {
    k: boundedInteger(search["k"], 1, 4, 1),
    budget: boundedInteger(search["budget"], 0, 400, 10),
    ordering: search["ordering"] === "reranked" ? "reranked" : undefined,
    case: ANSWER_CASES.find((c) => c.id === search["case"])?.id,
    draft:
      typeof draft === "string" && Object.hasOwn(DRAFT_OPTIONS, draft)
        ? (draft as DraftVariant)
        : undefined,
  };
}
