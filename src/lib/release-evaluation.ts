import { EVALUATION as E } from "@/content/release-evaluation";

export type Slice = "overall" | "single" | "endorsement";
export type Release = "baseline" | "candidate";

export function passCount(slice: Slice, release: Release): [number, number] {
  const key = release === "baseline" ? "baselinePass" : "candidatePass";
  if (slice === "single") return [E.single[key], E.single.total];
  if (slice === "endorsement") return [E.endorsement[key], E.endorsement.total];
  return [E.single[key] + E.endorsement[key], E.single.total + E.endorsement.total];
}

export const pct = ([n, d]: [number, number]) => Math.round((n / d) * 100);

export interface GateResult {
  pass: boolean;
  checks: { label: string; pass: boolean; detail: string }[];
}

export function releaseGate(release: Release): GateResult {
  const [endo] = passCount("endorsement", release);
  const exposures = E.unauthorisedExposures[release];
  const checks = [
    {
      label: `Endorsement cases ≥ ${E.minEndorsementPass}/10`,
      pass: endo >= E.minEndorsementPass,
      detail: `${endo}/10`,
    },
    { label: "Unauthorised exposures = 0", pass: exposures === 0, detail: String(exposures) },
  ];
  return { pass: checks.every((c) => c.pass), checks };
}

export const latencyGainMs = E.p95Ms.baseline - E.p95Ms.candidate;
