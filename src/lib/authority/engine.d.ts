export const DURATION: number;
export const DEFAULT_SPEED: number;
export const PACKETS: {
  t0: number;
  t1: number;
  from: string;
  to: string;
  kind: string;
  run: string;
  label: string;
}[];
export const SEGMENTS: { id: string; label: string; start: number; end: number }[];
export const JUMPS: { id: string; label: string; t: number }[];
export const TONES: Record<string, { stroke: string; fill: string; soft: string; text: string }>;
export const LAYOUTS: Record<
  string,
  {
    w: number;
    h: number;
    boundary: { x1: number; y1: number; x2: number; y2: number };
    pos: Record<string, number[]>;
  }
>;
export const TRANSCRIPT: { label: string; text: string }[];

export interface SceneNode {
  id: string;
  x: number;
  y: number;
  label: string;
  sub?: string;
  tone: string;
  opacity: number;
  ring?: boolean;
  w?: number;
  h?: number;
  large?: boolean;
  shape?: string;
  badge?: string;
}

export interface Scene {
  w: number;
  h: number;
  t: number;
  run: string;
  phase: string;
  outcome: string | null;
  pricingLeaked: boolean;
  delivered: boolean;
  decisions: { id: string; status: string; reason: string }[];
  decisionLines: string[];
  segment: string;
  segmentLabel: string;
  caption: string;
  nodes: SceneNode[];
  edges: {
    from: string;
    to: string;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    state: string;
    tone: string;
    label: string;
  }[];
  packets: {
    x: number;
    y: number;
    run: string;
    from: string;
    to: string;
    kind: string;
    label: string;
    arrived: boolean;
  }[];
  labels: {
    x: number;
    y: number;
    text: string;
    tone: string;
    anchored?: boolean;
    width?: number;
    size?: number;
  }[];
  boundary: { x1: number; y1: number; x2: number; y2: number } | null;
  boundaryLabel?: string;
  resetBanner: string | null;
  figure?: boolean;
}

type FigureScene = Pick<
  Scene,
  "w" | "h" | "t" | "nodes" | "edges" | "packets" | "labels" | "boundary" | "boundaryLabel"
> & { figure: true };
export function sceneAt(t: number, layoutKey?: string): Scene;
export function renderSvg(
  scene: Scene | FigureScene,
  opts?: { title?: string; caption?: string; provenance?: string; ariaLabel?: string },
): string;

export const PRESETS: {
  id: string;
  title: string;
  caption: string;
  alt: string;
  provenance: string;
}[];
export function presetScene(id: string): { scene: FigureScene; meta: (typeof PRESETS)[number] };
