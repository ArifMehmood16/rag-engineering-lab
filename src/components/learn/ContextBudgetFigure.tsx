import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { passageById } from "@/content/insurance";
import { LAB_DEFAULT, runTopK } from "@/lib/topk";

const orders = [
  { label: "Original ranking", run: runTopK(LAB_DEFAULT) },
  { label: "Reranked", run: runTopK({ ...LAB_DEFAULT, ordering: "reranked" }) },
];

export function ContextBudgetFigure() {
  return (
    <figure className="budget-sheet">
      <figcaption>
        <h2>What fits in the context?</h2>
        <p>
          Same {LAB_DEFAULT.k} candidates · {LAB_DEFAULT.budget}-token budget
        </p>
      </figcaption>
      {orders.map(({ label, run }) => (
        <div className="budget-run" key={label}>
          <div className="budget-run-heading">
            <strong>{label}</strong>
            <span>{run.tokensUsed} tokens used</span>
          </div>
          <ol className="budget-track" aria-label={label + " packed passages"}>
            {run.packed.map((id) => {
              const passage = passageById(id);
              return (
                <li
                  key={id}
                  data-passage={id}
                  style={{ width: (100 * passage.tokens) / run.input.budget + "%" }}
                >
                  <span>{id}</span>
                  <span className="sr-only">
                    , {passage.label}, {passage.tokens} tokens
                  </span>
                </li>
              );
            })}
          </ol>
          <p>
            {run.decision.kind === "cite"
              ? `Checked answer · £${run.decision.amount} excess`
              : "Sent for review · missing April amendment (E3-P1)"}
          </p>
        </div>
      ))}
      <Link to="/demos/top-k" search={{ ordering: "reranked" }}>
        Try the top-K example <ArrowRight size={16} aria-hidden />
      </Link>
    </figure>
  );
}
