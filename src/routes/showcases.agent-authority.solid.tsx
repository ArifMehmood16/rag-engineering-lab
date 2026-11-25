import { createFileRoute, Link } from "@tanstack/react-router";
import { demoHead } from "@/lib/demo-head";
import { DemoPage } from "@/components/learn/DemoPage";
import { DESIGN_NOTES, EXPLORER } from "@/content/agent-authority";

const title = "SOLID and authority";
const intro =
  "The supplier note stays untrusted in both runs. Each SOLID principle helps organise the code. Credentials and application policy determine which actions it can take.";
export const Route = createFileRoute("/showcases/agent-authority/solid")({
  head: () => demoHead(title, intro),
  component: Notes,
});
function Notes() {
  return (
    <DemoPage lesson="tools-agents" title={title} intro={intro}>
      <nav
        aria-label="Design principles"
        className="flex flex-wrap gap-x-4 gap-y-2 text-primary underline"
      >
        {DESIGN_NOTES.map((note) => (
          <a key={note.id} href={`#${note.id}`}>
            {note.name}
          </a>
        ))}
      </nav>
      {DESIGN_NOTES.map((note) => (
        <section
          id={note.id}
          key={note.id}
          className="max-w-3xl scroll-mt-20 space-y-3 border-t pt-5"
        >
          <h2 className="text-2xl">{note.name}</h2>
          <p>{note.pitfall}</p>
          <p>{note.design}</p>
        </section>
      ))}
      <nav
        aria-label="Permissions examples"
        className="flex flex-wrap gap-5 text-primary underline underline-offset-4"
      >
        <Link to="/showcases/agent-authority">Compare permissions for order #1042</Link>
        <a href={EXPLORER + "/solid"}>Original design notes and pseudocode</a>
      </nav>
    </DemoPage>
  );
}
