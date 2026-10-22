import { routeDecision } from "./apollo-engine";
import {
  atOutput,
  stageInput,
  stageOutput,
  walkthroughStep,
  type WalkthroughState,
} from "./rag-walkthrough";

export type SceneNode =
  | "source"
  | "chunks"
  | "vectors"
  | "index"
  | "question"
  | "input"
  | "small"
  | "router"
  | "cache"
  | "retrieve"
  | "context"
  | "tool"
  | "model"
  | "check"
  | "answer";
export type Point3 = [number, number, number];
export interface SceneTransfer {
  from: SceneNode;
  to: SceneNode;
  kind:
    | "document"
    | "split"
    | "encode"
    | "vector"
    | "query"
    | "evidence"
    | "draft"
    | "answer"
    | "notice";
}

// World coordinates, shared by objects, connections and the travelling data.
export const PREPARATION_POSITIONS: Partial<Record<SceneNode, Point3>> = {
  source: [-6.4, -0.5, 0.6],
  chunks: [-3.4, -0.5, 0.6],
  vectors: [-0.5, -0.5, 0.5],
  index: [3.2, 0.3, -0.6],
  model: [7.6, 0.8, -0.5],
};
// An aligned request spine, upper service row, and lower small-model branch.
// Each component pair shares one reserved corridor for both traffic directions.
export const REQUEST_POSITIONS: Partial<Record<SceneNode, Point3>> = {
  question: [-9.6, 0, 0.4],
  input: [-7.4, 0, 0.4],
  router: [-5.2, 0, 0.4],
  retrieve: [-2.8, 0, 0.4],
  context: [0.1, 0, 0.4],
  model: [3.8, 0, 0],
  check: [7.7, 0, 0.4],
  cache: [-8.2, 2.3, 0],
  index: [-2.8, 3.7, -1.2],
  tool: [3.8, 3.7, -0.2],
  small: [-4.5, -2.5, 0.4],
  answer: [-9.6, 0, 0.4],
};

export const REQUEST_CONNECTIONS: [SceneNode, SceneNode][] = [
  ["question", "input"],
  ["input", "router"],
  ["router", "cache"],
  ["cache", "router"],
  ["router", "retrieve"],
  ["router", "index"],
  ["retrieve", "index"],
  ["index", "retrieve"],
  ["retrieve", "context"],
  ["context", "small"],
  ["context", "model"],
  ["context", "tool"],
  ["tool", "context"],
  ["context", "check"],
  ["model", "check"],
  ["small", "check"],
  ["cache", "check"],
  ["check", "index"],
  ["index", "check"],
  ["check", "question"],
];
export const FAILURE_CONNECTIONS: [SceneNode, SceneNode][] = [
  ["input", "question"],
  ["context", "question"],
  ["tool", "question"],
  ["model", "question"],
  ["small", "question"],
];
export const REQUEST_NODE_NAMES: Partial<Record<SceneNode, string>> = {
  question: "You",
  input: "Input checks",
  router: "Router",
  cache: "Answer cache",
  small: "Small LLM",
  retrieve: "Retrieve",
  index: "Knowledge index",
  context: "Context tray",
  model: "LLM",
  tool: "Tools",
  check: "Output checks",
};

/** Shared bends keep lines, arrowheads, data packets, labels and focus on one route. */
const PATH_BENDS: Partial<Record<string, Point3[]>> = {
  // The main spine stays level, rather than adding an arc to each short link.
  "question:input": [[-8.5, 0, 0.4]],
  "input:router": [[-6.3, 0, 0.4]],
  "router:retrieve": [[-4, 0, 0.4]],
  "retrieve:context": [[-1.3, 0, 0.4]],
  "context:model": [[1.4, 0, 0.2]],
  "model:check": [[6.5, 0, 0.4]],
  // Paired service lanes occupy compact, separate corridors.
  "router:cache": [
    [-5.2, 2.3, 0.4],
    [-7.2, 2.3, 0],
  ],
  "cache:router": [
    [-8.2, 1.2, 0.4],
    [-5.2, 1.2, 0.4],
  ],
  "router:index": [
    [-5.8, 0.8, 0.4],
    [-5.8, 3.7, -0.2],
  ],
  "retrieve:index": [
    [-3.2, 0.8, 0.4],
    [-3.2, 1.6, -0.5],
  ],
  "index:retrieve": [
    [-2.4, 1.6, -0.5],
    [-2.4, 0.8, 0.4],
  ],
  "context:tool": [
    [0.1, 3.7, 0.3],
    [2.7, 3.7, 0],
  ],
  "tool:context": [
    [2.7, 2.8, 0.4],
    [0.8, 2.8, 0.4],
    [0.8, 0.9, 0.4],
  ],
  // Source eligibility checks are tucked behind the upper service row.
  "check:index": [
    [8.6, 0, 0.4],
    [8.6, 5.4, -0.5],
    [-0.5, 5.4, -0.5],
    [-0.5, 3.7, -1.2],
  ],
  "index:check": [
    [-0.1, 3.7, -1.2],
    [-0.1, 4.8, -0.7],
    [8, 4.8, -0.7],
    [8, 0.9, 0.4],
  ],
  // A single outer cache-bypass rail, clear of retrieval and tool work.
  "cache:check": [
    [-8.2, 6.4, -0.2],
    [9.4, 6.4, -0.2],
    [9.4, 0.9, 0.3],
    [7.7, 0.9, 0.4],
  ],
  // Lower lanes separate model choice, application lookup, and released answers.
  "context:small": [
    [0.1, -2.5, 0.4],
    [-3, -2.5, 0.4],
  ],
  "small:check": [
    [-4.5, -3.8, 0.4],
    [7.7, -3.8, 0.4],
  ],
  "context:check": [
    [0.1, -3, 0.5],
    [6.7, -3, 0.5],
    [6.7, 0, 0.4],
  ],
  "check:question": [
    [8.6, 0, 0.4],
    [8.6, -5, 0.4],
    [-9.6, -5, 0.4],
  ],
  // Only a relevant stopping notice is added to the normal map.
  "input:question": [
    [-7.4, -1.5, 0.6],
    [-9.6, -1.5, 0.6],
  ],
  "context:question": [
    [0.1, -4.4, 0.6],
    [-9.6, -4.4, 0.6],
  ],
  "tool:question": [
    [10.2, 3.7, 0.6],
    [10.2, -5.6, 0.6],
    [-10.4, -5.6, 0.6],
    [-10.4, 0, 0.4],
  ],
  "model:question": [
    [3.8, -4.4, 0.6],
    [-9.6, -4.4, 0.6],
  ],
  "small:question": [
    [-4.5, -4.4, 0.6],
    [-9.6, -4.4, 0.6],
  ],
};
const STRAIGHT_PATH: Point3[] = [];
/** Keep execution legs directed, but render one physical connection per pair. */
export function sharedConnections(connections: [SceneNode, SceneNode][]) {
  const seen = new Set<string>();
  return connections.filter(([from, to]) => {
    const key = [from, to].sort().join(":");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function canonicalConnection(from: SceneNode, to: SceneNode) {
  return [...REQUEST_CONNECTIONS, ...FAILURE_CONNECTIONS].find(
    ([a, b]) => (a === from && b === to) || (a === to && b === from),
  );
}
export const flowWaypoints = (from: SceneNode, to: SceneNode) =>
  PATH_BENDS[`${from}:${to}`] ?? STRAIGHT_PATH;

export const NODE_RADIUS: Partial<Record<SceneNode, number>> = {
  source: 0.7,
  chunks: 0.75,
  vectors: 0.7,
  index: 1.65,
  model: 2.15,
  question: 0.65,
  input: 0.55,
  router: 0.35,
  cache: 0.65,
  small: 1,
  retrieve: 0.45,
  context: 0.65,
  tool: 0.65,
  check: 0.55,
};

/** Connect the outside of each object, rather than drawing through its centre. */
export function flowRoute(
  positions: Partial<Record<SceneNode, Point3>>,
  from: SceneNode,
  to: SceneNode,
): { from: Point3; to: Point3; via: Point3[] } {
  const canonical = canonicalConnection(from, to);
  if (canonical && canonical[0] !== from) {
    const route = flowRoute(positions, to, from);
    return { from: route.to, to: route.from, via: [...route.via].reverse() };
  }
  const start = positions[from];
  const end = positions[to];
  if (!start || !end) throw new Error(`Missing scene position: ${from} → ${to}`);
  if (from === to) return { from: start, to: end, via: STRAIGHT_PATH };
  const via = flowWaypoints(from, to);
  const port = (center: Point3, toward: Point3, radius: number): Point3 => {
    const length = Math.hypot(...toward.map((v, i) => v - center[i]!));
    return center.map(
      (v, i) => v + ((toward[i]! - v) / Math.max(0.001, length)) * Math.min(radius, length * 0.98),
    ) as Point3;
  };
  return {
    from: port(start, via[0] ?? end, NODE_RADIUS[from] ?? 0.5),
    to: port(end, via.at(-1) ?? start, NODE_RADIUS[to] ?? 0.5),
    via,
  };
}

export const FLOW_STYLES = {
  input: { color: "#79baff", label: "Request" },
  evidence: { color: "#69d6ca", label: "Evidence" },
  generation: { color: "#c4a0ef", label: "Model" },
  cache: { color: "#e7ba7b", label: "Cache" },
  tool: { color: "#eea1b9", label: "Tool" },
  release: { color: "#94d8a3", label: "Checks & return" },
  notice: { color: "#e9a0a0", label: "Withheld notice" },
} as const;
export function flowStyle(from: SceneNode, to: SceneNode) {
  return FLOW_STYLES[
    from === "cache" || to === "cache"
      ? "cache"
      : from === "tool" || to === "tool"
        ? "tool"
        : from === "check" || (to === "check" && from !== "model" && from !== "small")
          ? "release"
          : from === "model" ||
              from === "small" ||
              to === "model" ||
              to === "small" ||
              to === "vectors"
            ? "generation"
            : from === "index" || from === "retrieve" || from === "vectors" || to === "index"
              ? "evidence"
              : "input"
  ];
}

export function nodeEmphasis(
  _plan: ReturnType<typeof scenePlan>,
  _node: SceneNode,
  _overview = false,
) {
  // Stage activity selects annotations, never dims a fully visible entity.
  return 1;
}

/** Normal light for complete bounds; fade only where an entity crosses the scene edge. */
export function viewportEmphasis(
  bounds: { left: number; right: number; top: number; bottom: number },
  region: { x: number; y: number; width: number; height: number },
) {
  const clearance = Math.min(
    bounds.left - (region.x - region.width / 2),
    region.x + region.width / 2 - bounds.right,
    bounds.top - (region.y - region.height / 2),
    region.y + region.height / 2 - bounds.bottom,
  );
  if (clearance >= 0) return 1;
  const extent = Math.max(1, Math.min(bounds.right - bounds.left, bounds.bottom - bounds.top));
  const visible = Math.max(0, Math.min(1, 1 + clearance / extent));
  return 0.2 + 0.8 * visible * visible * (3 - 2 * visible);
}

export function requestModel(tour: WalkthroughState): "model" | "small" | "context" {
  const input = stageInput(tour);
  const route =
    tour.stage > 2 ? input.ctx.route : routeDecision(input.ctx.question, input.config).route;
  return route === "application" ? "context" : route === "large" ? "model" : "small";
}
const preparation: SceneTransfer[] = [
  { from: "source", to: "source", kind: "document" },
  { from: "source", to: "chunks", kind: "split" },
  { from: "chunks", to: "vectors", kind: "encode" },
  { from: "vectors", to: "index", kind: "vector" },
];
export function scenePlan(tour: WalkthroughState) {
  const prep = tour.phase === "knowledge";
  const input = stageInput(tour);
  const after = stageOutput(tour);
  const result = after?.results[tour.stage];
  const generator = prep ? "model" : requestModel(tour);
  const applicationLookup = !prep && generator === "context";
  const cached = input.ctx.usage.answerHit || Boolean(after?.ctx.usage.answerHit);
  const skipped =
    !prep &&
    (result?.status === "skipped" ||
      (tour.stage === 5 && input.config.tool === "off") ||
      (tour.stage >= 3 && tour.stage <= 7 && cached));
  const blocked = !prep && result?.status === "blocked";
  const leg = (from: SceneNode, to: SceneNode, kind: SceneTransfer["kind"]): SceneTransfer => ({
    from,
    to,
    kind,
  });
  const hold = (node: SceneNode, kind: SceneTransfer["kind"] = "query") => leg(node, node, kind);
  const notice = (from: SceneNode) => leg(from, "question", "notice");
  const draftSource = cached ? "cache" : generator;
  const paths: SceneTransfer[][] = [
    [leg("question", "input", "query"), hold("input")],
    [hold("input"), hold("input"), blocked ? notice("input") : leg("input", "router", "query")],
    [
      hold("router"),
      input.config.answerCache ? leg("router", "cache", "query") : hold("router"),
      input.config.answerCache
        ? cached
          ? hold("cache", "draft")
          : leg("cache", "router", "query")
        : hold("router"),
    ],
    applicationLookup
      ? [
          leg("router", "index", "query"),
          leg("index", "retrieve", "evidence"),
          hold("retrieve", "evidence"),
        ]
      : [
          leg("router", "retrieve", "query"),
          leg("retrieve", "index", "query"),
          leg("index", "retrieve", "evidence"),
        ],
    [leg("retrieve", "context", "evidence"), hold("context", "evidence")],
    input.config.tool === "off"
      ? [hold("context"), hold("context"), hold("context")]
      : [
          leg("context", "tool", "query"),
          hold("tool"),
          blocked ? notice("tool") : leg("tool", "context", "evidence"),
        ],
    [hold("context", "evidence"), blocked ? notice("context") : hold("context", "evidence")],
    [
      applicationLookup ? hold("context", "evidence") : leg("context", generator, "evidence"),
      blocked ? notice(generator) : hold(generator, "draft"),
    ],
    [
      leg(draftSource, "check", "draft"),
      hold("check", "draft"),
      blocked ? notice("check") : hold("check", "draft"),
    ],
    [
      leg("check", "index", "query"),
      leg("index", "check", "evidence"),
      blocked ? notice("check") : hold("check", "answer"),
    ],
    [leg("check", "question", "answer"), hold("question", "answer")],
  ];
  const operations = paths[tour.stage]!;
  const index = Math.max(0, Math.min(operations.length - 1, tour.beat - 1));
  const transfer = prep ? preparation[tour.stage]! : operations[index]!;
  return {
    positions: prep ? PREPARATION_POSITIONS : REQUEST_POSITIONS,
    transfer,
    active: prep
      ? tour.beat === 0
        ? transfer.from
        : transfer.to
      : skipped
        ? cached
          ? ("cache" as const)
          : ("context" as const)
        : tour.beat === 0
          ? transfer.from
          : transfer.to,
    moving:
      tour.beat > 0 && !atOutput(tour) && !skipped && (!blocked || transfer.kind === "notice"),
    skipped,
    blocked,
    applicationLookup,
    generator,
    cached,
  };
}

/** Normal routes remain visible; an applicable failure notice adds only its own return lane. */
export function sceneConnections(plan: ReturnType<typeof scenePlan>) {
  const { from, to } = plan.transfer;
  return sharedConnections(
    from !== to && !REQUEST_CONNECTIONS.some(([a, b]) => a === from && b === to)
      ? [...REQUEST_CONNECTIONS, [from, to] as [SceneNode, SceneNode]]
      : REQUEST_CONNECTIONS,
  );
}

/** Each request operation is one complete handoff; knowledge transformations stay continuous. */
export function transferProgress(tour: WalkthroughState, progress: number) {
  if (tour.phase === "knowledge") return progress;
  if (tour.beat === 0) return 0;
  if (atOutput(tour)) return 1;
  return Math.max(0, Math.min(1, progress * walkthroughStep(tour).work.length - (tour.beat - 1)));
}

/** Each operation continues the same transformation; scrolling can review it in reverse. */
export function sceneProgressRange(tour: WalkthroughState): [number, number] {
  if (tour.beat === 0) return [0, 0];
  if (atOutput(tour)) return [1, 1];
  const count = walkthroughStep(tour).work.length;
  return [(tour.beat - 1) / count, tour.beat / count];
}

/** Smooth, bounded travel with a small lift into the foreground. No hidden engine mutation. */
export function createFlowSampler(
  from: Point3,
  to: Point3,
  via: Point3[] = [],
): (progress: number) => Point3 {
  if (via.length) {
    // Trim each bend, then round it with a bounded quadratic. Unlike a
    // Catmull-Rom spline, this cannot bow outside its allocated routing lane.
    const points = [from, ...via, to];
    const samples: Point3[] = [from];
    const mix = (a: Point3, b: Point3, u: number) => a.map((v, i) => v + (b[i]! - v) * u) as Point3;
    const distance = (a: Point3, b: Point3) => Math.hypot(...a.map((v, i) => v - b[i]!));
    for (let i = 1; i < points.length - 1; i++) {
      const a = points[i - 1]!,
        b = points[i]!,
        c = points[i + 1]!;
      const before = distance(a, b),
        after = distance(b, c);
      if (before < 0.001 || after < 0.001) continue;
      const trim = Math.min(0.48, before * 0.4, after * 0.4);
      const entry = mix(b, a, trim / before),
        exit = mix(b, c, trim / after);
      samples.push(entry);
      for (let n = 1; n <= 8; n++) {
        const u = n / 8;
        samples.push(mix(mix(entry, b, u), mix(b, exit, u), u));
      }
    }
    samples.push(to);
    const lengths = samples.slice(1).map((p, i) => distance(samples[i]!, p));
    const total = lengths.reduce((sum, n) => sum + n, 0);
    return (progress) => {
      const t = Math.max(0, Math.min(1, progress));
      if (t === 0) return from;
      if (t === 1) return to;
      let remaining = t * total;
      for (let i = 0; i < lengths.length; i++) {
        const length = lengths[i]!;
        if (remaining <= length && length > 0)
          return mix(samples[i]!, samples[i + 1]!, remaining / length);
        remaining -= length;
      }
      return to;
    };
  }

  return (progress) => {
    const t = Math.max(0, Math.min(1, progress));
    // A clean, shallow arc proportional to the span: no S-bend, constant direction.
    const span = Math.hypot(to[0] - from[0], to[1] - from[1]);
    const lift = Math.sin(Math.PI * t) * Math.min(0.45, span * 0.08);
    return [
      from[0] + (to[0] - from[0]) * t,
      from[1] + (to[1] - from[1]) * t + lift,
      from[2] + (to[2] - from[2]) * t + lift * 0.6,
    ];
  };
}

/** Convenience for occasional snapshots; animated routes retain a sampler instead. */
export function travelPoint(
  from: Point3,
  to: Point3,
  progress: number,
  via: Point3[] = [],
): Point3 {
  return createFlowSampler(from, to, via)(progress);
}
