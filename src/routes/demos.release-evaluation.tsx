import { createFileRoute } from "@tanstack/react-router";
import { demoHead } from "@/lib/demo-head";
import { DemoPage } from "@/components/learn/DemoPage";
import { EVALUATION, RELEASE_DEMO, RELEASE_SLICES } from "@/content/release-evaluation";
import { latencyGainMs, passCount, pct, releaseGate, type Slice } from "@/lib/release-evaluation";
import { btnVariants } from "@/components/learn/ui";

export const Route = createFileRoute("/demos/release-evaluation")({
  validateSearch: (search: Record<string, unknown>): { slice?: Slice | undefined } => ({
    slice:
      search["slice"] === "single" || search["slice"] === "endorsement"
        ? search["slice"]
        : undefined,
  }),
  head: () => demoHead(RELEASE_DEMO.title, RELEASE_DEMO.description),
  component: ReleaseExperiment,
});

function ReleaseExperiment() {
  const { slice = "overall" } = Route.useSearch();
  const navigate = Route.useNavigate();
  const baseline = passCount(slice, "baseline");
  const candidate = passCount(slice, "candidate");
  const delta = pct(candidate) - pct(baseline);
  const gate = releaseGate("candidate");
  return (
    <DemoPage lesson="evaluation" title={RELEASE_DEMO.title} intro={RELEASE_DEMO.intro}>
      <section aria-labelledby="slice-heading" className="space-y-4">
        <h2 id="slice-heading" className="text-2xl">
          Supported answers by group
        </h2>
        <div role="group" aria-label="Question group" className="flex flex-wrap gap-2">
          {(Object.keys(RELEASE_SLICES) as Slice[]).map((key) => (
            <button
              key={key}
              type="button"
              aria-pressed={key === slice}
              className={btnVariants({ variant: key === slice ? "primary" : "outline" })}
              onClick={() =>
                void navigate({
                  search: key === "overall" ? {} : { slice: key },
                  resetScroll: false,
                })
              }
            >
              {RELEASE_SLICES[key]}
            </button>
          ))}
        </div>
        <table className="w-full max-w-2xl text-left tabular-nums">
          <caption className="sr-only">
            {RELEASE_SLICES[slice]} results. Latency is measured across the full fixture.
          </caption>
          <thead className="border-b">
            <tr>
              <th>Release</th>
              <th>Supported</th>
              <th>Rate</th>
              <th>Overall p95</th>
            </tr>
          </thead>
          <tbody>
            {(["baseline", "candidate"] as const).map((release) => {
              const count = passCount(slice, release);
              return (
                <tr key={release} className="border-b">
                  <th scope="row" className="py-3 capitalize">
                    {release}
                  </th>
                  <td>{count.join("/")}</td>
                  <td>{pct(count)}%</td>
                  <td>{EVALUATION.p95Ms[release].toLocaleString("en-GB")} ms</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p role="status">
          Support changes by {delta > 0 ? "+" : ""}
          {delta} percentage points in this group. Overall p95 latency improves by {latencyGainMs}{" "}
          ms.
        </p>
      </section>
      <section
        id="release-gate"
        className="max-w-2xl space-y-3 rounded-md border-l-4 border-accent bg-accent-soft p-5"
      >
        <h2 className="text-2xl">Release gate · {gate.pass ? "Pass" : "Hold"}</h2>
        <ul className="space-y-1">
          {gate.checks.map((check) => (
            <li key={check.label}>
              <strong>{check.pass ? "Pass" : "Fail"}</strong> · {check.label} · observed{" "}
              {check.detail}
            </li>
          ))}
        </ul>
        <p>
          These teaching counts identify the failing group. Estimating population impact would
          require more cases and per-question results.
        </p>
      </section>
    </DemoPage>
  );
}
