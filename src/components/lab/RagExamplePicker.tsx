import * as Popover from "@radix-ui/react-popover";
import { ChevronDown, Check, GitBranch } from "lucide-react";
import { REQUEST_SCENARIOS, type RequestScenario } from "@/content/rag-scenarios";

export function RagExamplePicker({
  scenario,
  onSelect,
}: {
  scenario: RequestScenario | null;
  onSelect: (id: string) => void;
}) {
  return (
    <Popover.Root>
      <Popover.Trigger className="example-trigger" aria-label="Choose question example">
        <GitBranch size={17} />
        <span>
          <small>ONE COMPLETE QUESTION</small>
          <strong>{scenario?.title ?? "Custom experiment"}</strong>
        </span>
        <ChevronDown size={16} />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className="example-menu"
          side="bottom"
          align="end"
          sideOffset={8}
          aria-label="Complete question examples"
        >
          <h3>Choose a complete journey</h3>
          <p>
            Each selection starts an independent request. Only the repeat example starts with an
            approved cached answer.
          </p>
          <div role="group" aria-label="Question examples">
            {REQUEST_SCENARIOS.map((example, i) => (
              <Popover.Close asChild key={example.id}>
                <button
                  type="button"
                  aria-label={example.title}
                  aria-pressed={scenario?.id === example.id}
                  onClick={() => onSelect(example.id)}
                >
                  <span>{String(i + 1).padStart(2, "0")}</span>
                  <span>
                    <strong>{example.title}</strong>
                    <small>{example.purpose}</small>
                  </span>
                  {scenario?.id === example.id && <Check size={15} />}
                </button>
              </Popover.Close>
            ))}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
