import { createFileRoute, Link } from "@tanstack/react-router";
import { demoHead } from "@/lib/demo-head";
import { DemoPage } from "@/components/learn/DemoPage";
import { btnVariants } from "@/components/learn/ui";
import { AUTHORITY_INTRO, AUTHORITY_RUNS, AUTHORITY_TITLE } from "@/content/agent-authority";

type Run = keyof typeof AUTHORITY_RUNS;
export const Route = createFileRoute("/showcases/agent-authority/")({
  validateSearch: (search: Record<string, unknown>): { run?: Run | undefined } => ({
    run: search["run"] === "enforced" ? "enforced" : undefined,
  }),
  head: () => demoHead(AUTHORITY_TITLE, AUTHORITY_INTRO),
  component: Authority,
});

function Authority() {
  const { run = "broad" } = Route.useSearch();
  const navigate = Route.useNavigate();
  const result = AUTHORITY_RUNS[run];
  return (
    <DemoPage lesson="tools-agents" title={AUTHORITY_TITLE} intro={AUTHORITY_INTRO}>
      <section aria-labelledby="permissions" className="max-w-3xl space-y-4">
        <h2 id="permissions" className="text-2xl">
          Who decides what the email tool can send?
        </h2>
        <div role="group" aria-label="Simulated permissions" className="flex flex-wrap gap-2">
          {(Object.keys(AUTHORITY_RUNS) as Run[]).map((key) => (
            <button
              key={key}
              type="button"
              aria-pressed={key === run}
              className={btnVariants({ variant: key === run ? "primary" : "outline" })}
              onClick={() =>
                void navigate({ search: key === "broad" ? {} : { run: key }, resetScroll: false })
              }
            >
              {AUTHORITY_RUNS[key].label}
            </button>
          ))}
        </div>
        <dl className="divide-y border-y">
          {result.rows.map(([label, text]) => (
            <div key={label} className="grid gap-1 py-3 sm:grid-cols-[7rem_1fr]">
              <dt className="font-semibold">{label}</dt>
              <dd>{text}</dd>
            </div>
          ))}
        </dl>
        <div role="status" className="space-y-2 rounded-md border bg-card p-5">
          <h3 className="text-xl">{result.outcome}</h3>
          <p>{result.explanation}</p>
        </div>
        <p className="text-muted-foreground">
          Hypothetical order and illustrative outcomes. Both runs start with the same user request
          and supplier note.
        </p>
      </section>
      <nav
        aria-label="Explore the design"
        className="flex flex-wrap gap-5 text-primary underline underline-offset-4"
      >
        <Link to="/showcases/agent-authority/solid">Read the SOLID design notes</Link>
        <Link to="/showcases/agent-authority/story">Animated story and exports</Link>
      </nav>
    </DemoPage>
  );
}
