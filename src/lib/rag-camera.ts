import type { WalkthroughState } from "./rag-walkthrough";
import { requestModel } from "./rag-scene";
import type { Point3 } from "./rag-scene";
export interface CameraPose {
  position: Point3;
  target: Point3;
}
/** A shot frames a concept, not a new engine state. Model and evidence remain in one continuous world. */
export function cameraPose(tour: WalkthroughState, overview = false): CameraPose {
  if (overview)
    return tour.phase === "request"
      ? { position: [-1.4, -0.1, 23.5], target: [-1.4, -0.5, 0] }
      : { position: [0.3, 2, 18.5], target: [0, 0.6, 0] };
  if (tour.phase === "knowledge")
    return (
      [
        { position: [-1, 1.7, 15.6], target: [-0.6, 0.3, 0] },
        { position: [-2.3, 0.8, 12.8], target: [-1.7, -0.1, 0.1] },
        { position: [-0.5, 1.3, 13.3], target: [-0.6, 0.5, 0] },
        { position: [-1.7, 2.7, 11.8], target: [-1.7, 1.3, -0.4] },
      ] satisfies CameraPose[]
    )[tour.stage]!;
  if (tour.stage === 7 && requestModel(tour) === "model")
    return { position: [2.1, 1.1, 12.4], target: [1.9, 0.7, 0] };
  return (
    [
      { position: [-1.4, -0.1, 23.5], target: [-1.4, -0.5, 0] },
      { position: [-4.7, 0.1, 17.5], target: [-4.7, -0.3, 0] },
      { position: [-3.7, 0.7, 17.2], target: [-3.7, -0.1, 0] },
      { position: [-2.1, 3.1, 15.8], target: [-1.6, 2.7, -0.3] },
      { position: [-0.5, 2, 16.8], target: [-0.5, 1.5, 0.1] },
      { position: [1.8, 2, 16.5], target: [1.8, 1.2, 0.1] },
      { position: [-0.3, 2.1, 15.8], target: [-0.3, 1.5, 0] },
      { position: [-1.9, -0.1, 16.5], target: [-1.9, -0.5, 0] },
      { position: [0.8, 0.2, 20], target: [0.6, -0.4, 0] },
      { position: [0.8, 2.1, 20.8], target: [0.8, 1.4, 0] },
      { position: [-1.4, -0.1, 23.5], target: [-1.4, -0.5, 0] },
    ] satisfies CameraPose[]
  )[tour.stage]!;
}
