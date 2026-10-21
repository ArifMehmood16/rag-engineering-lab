import type { WalkthroughState } from "./rag-walkthrough";
import type { Point3 } from "./rag-scene";
export interface CameraPose {
  position: Point3;
  target: Point3;
}
/** A shot frames a concept, not a new engine state. Model and evidence remain in one continuous world. */
export function cameraPose(tour: WalkthroughState, overview = false): CameraPose {
  if (overview) return { position: [0.3, 2, 18.5], target: [0, 0.6, 0] };
  if (tour.phase === "knowledge")
    return (
      [
        { position: [-1, 1.7, 15.6], target: [-0.6, 0.3, 0] },
        { position: [-2.3, 0.8, 12.8], target: [-1.7, -0.1, 0.1] },
        { position: [-0.5, 1.3, 13.3], target: [-0.6, 0.5, 0] },
        { position: [-1.7, 2.7, 11.8], target: [-1.7, 1.3, -0.4] },
      ] satisfies CameraPose[]
    )[tour.stage]!;
  return (
    [
      { position: [-1.3, 1.2, 16], target: [-0.8, 0.2, 0] },
      { position: [-2, 1.4, 14.8], target: [-1.3, 0.2, 0] },
      { position: [-1.1, 2.4, 15.7], target: [-0.5, 1, 0] },
      { position: [-1.7, 2.8, 13.8], target: [-1.7, 1, -0.3] },
      { position: [0.2, 1.6, 12.8], target: [0.1, 0.7, 0.2] },
      { position: [1, 1, 13.5], target: [0.8, 0.1, 0] },
      { position: [0.4, 1.5, 13], target: [0.2, 0.7, 0] },
      { position: [2.3, 1.6, 10.8], target: [2, 0.7, -0.1] },
      { position: [2.5, 1.3, 13.2], target: [2.3, 0.2, 0] },
      { position: [0.5, 2, 15], target: [0.3, 0.6, 0] },
      { position: [1.8, 1.3, 16], target: [1.4, 0.4, 0] },
    ] satisfies CameraPose[]
  )[tour.stage]!;
}
