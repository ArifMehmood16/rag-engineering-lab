// Trust-boundary lab logic. Synthetic: no model, tool, or real permission system is involved.

export type ControlId =
  | "input"
  | "evidenceBoundary"
  | "toolAllowList"
  | "schema"
  | "statusRules"
  | "citationResolution"
  | "claimVerification"
  | "authorization"
  | "eligibility"
  | "logging";

export type ControlResult = "caught" | "contained" | "passed" | "n/a";

export interface Control {
  id: ControlId;
  name: string;
  layer: 1 | 2 | 3 | 4;
  checks: string;
  limitation: string;
}

export const CONTROLS: Control[] = [
  {
    id: "input",
    name: "Authentication, request limits, input shape",
    layer: 1,
    checks: "Who is asking, how often, and whether the request is well-formed.",
    limitation: "Cannot tell a malicious question from a curious one by wording alone.",
  },
  {
    id: "evidenceBoundary",
    name: "Untrusted-evidence boundary",
    layer: 2,
    checks:
      "Retrieved text and tool output enter as delimited, bounded data — never as instructions.",
    limitation: "Reduces, but cannot eliminate, the chance a model follows embedded text.",
  },
  {
    id: "toolAllowList",
    name: "Tool allow-list",
    layer: 2,
    checks: "Only read-only, declared tools exist; nothing privileged can be called.",
    limitation: "Only limits actions; it says nothing about whether an answer is true.",
  },
  {
    id: "schema",
    name: "Schema validation",
    layer: 3,
    checks: "The output has the required structure and no extra fields.",
    limitation: "Checks structure only. Valid JSON can contain false statements.",
  },
  {
    id: "statusRules",
    name: "Status/claim rules",
    layer: 3,
    checks:
      "Combinations make sense, e.g. “supported” needs claims; “evidence_gap” lists what is missing.",
    limitation: "Checks consistency, not support.",
  },
  {
    id: "citationResolution",
    name: "Citation resolution",
    layer: 3,
    checks: "Every evidence ID resolves to a server-held record supplied to this request.",
    limitation: "Confirms identity, not that the passage supports the claim.",
  },
  {
    id: "claimVerification",
    name: "Claim verification",
    layer: 3,
    checks: "Numbers, units, and qualifiers in each claim match the cited span.",
    limitation: "Can miss subtle paraphrase errors; it is itself imperfect and must be evaluated.",
  },
  {
    id: "authorization",
    name: "Application authorization",
    layer: 4,
    checks:
      "The caller’s scope allows every cited source and every proposed operation — enforced in code.",
    limitation: "Only as correct as the policy it enforces.",
  },
  {
    id: "eligibility",
    name: "Current eligibility recheck",
    layer: 4,
    checks: "At release, every cited source is still admitted and not excluded or revoked.",
    limitation: "A narrow race remains between check and display; keep it short and logged.",
  },
  {
    id: "logging",
    name: "Log hygiene",
    layer: 4,
    checks: "Logs keep IDs and decisions, not secrets or unnecessary content.",
    limitation: "Prevents leaks through logs only; doesn’t stop the issue itself.",
  },
];

export const LAYERS = {
  1: "Input and acquisition controls",
  2: "Trust boundaries around retrieved documents and tool outputs",
  3: "Output validation and claim verification",
  4: "Application-enforced permissions and action controls",
} as const;

export interface Scenario {
  id: string;
  title: string;
  userInput: string;
  evidence: string;
  response: string;
  action: string;
  /** Results that differ from "passed". Unlisted controls pass. */
  results: Partial<Record<ControlId, { result: ControlResult; note: string }>>;
  /** Whether a simple pattern-matching detector would flag this case. */
  detectorFlags: boolean | null;
  release: string;
}

export interface Evaluated {
  rows: { control: Control; result: ControlResult; note: string }[];
  stoppedBy: ControlId[];
  detector: { shown: boolean; flagged: boolean | null; note: string };
  release: string;
}

export function evaluateScenario(s: Scenario, detectorOn: boolean): Evaluated {
  const rows = CONTROLS.map((control) => {
    const r = s.results[control.id];
    return {
      control,
      result: r?.result ?? "passed",
      note: r?.note ?? "No issue for this control in this case.",
    };
  });
  const stoppedBy = rows
    .filter((r) => r.result === "caught" || r.result === "contained")
    .map((r) => r.control.id);
  const detector = !detectorOn
    ? { shown: false, flagged: null, note: "" }
    : s.detectorFlags === null
      ? {
          shown: true,
          flagged: null,
          note: "Not applicable: no instruction-like text is involved.",
        }
      : s.detectorFlags
        ? {
            shown: true,
            flagged: true,
            note: "Flagged a known phrase. Useful as a signal, but the controls above are what actually prevent harm.",
          }
        : {
            shown: true,
            flagged: false,
            note: "Missed: the instruction doesn’t match the detector’s known phrasings. The outcome is unchanged because the controls above don’t depend on detection.",
          };
  return { rows, stoppedBy, detector, release: s.release };
}
