import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Clock } from "lucide-react";
import { LESSONS } from "@/content/lessons";
import { CROSS_LESSON_PAGES, WORKED_EXAMPLES } from "@/content/lab-directory";
import { ContextBudgetFigure } from "@/components/learn/ContextBudgetFigure";
import { ContextDrawer } from "@/components/learn/ContextDrawer";
import { btnVariants } from "@/components/learn/ui";

const TITLE = "Lab overview — RAG Engineering Lab";
const DESC =
  "Explore five RAG engineering lessons and worked examples of context budgets, release evaluation and agent permissions.";

export const Route = createFileRoute("/overview")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Overview,
});

function Overview() {
  return (
    <article className="lab-directory">
      <header className="directory-intro">
        <div className="directory-heading">
          <h1>
            Inside a <span>RAG system</span>
          </h1>
          <p>
            Follow a question from retrieval to a checked answer. Try the experiments to see how
            evidence, latency and permissions change the result.
          </p>
          <Link to="/" className={btnVariants({ variant: "primary" })}>
            Open the walkthrough <ArrowRight className="size-4" aria-hidden />
          </Link>
          <a href="#lessons" className="directory-text-link">
            Browse five lessons
          </a>
        </div>
        <ContextBudgetFigure />
      </header>
      <section className="directory-examples" aria-labelledby="more-examples">
        <h2 id="more-examples">More worked examples</h2>
        <ul>
          {WORKED_EXAMPLES.slice(1).map((item) => (
            <li key={item.to}>
              <Link to={item.to}>
                <span className="directory-link-title">
                  {item.title} <ArrowRight size={17} aria-hidden />
                </span>
                <span>{item.summary}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <section id="lessons" aria-labelledby="lessons-title" className="directory-lessons">
        <h2 id="lessons-title">Five lessons</h2>
        <p>
          These lessons use EvidenceLens, a research application in the design phase, as their case
          study.
        </p>
        <ContextDrawer />
        <ol className="directory-list">
          {LESSONS.map((lesson) => (
            <li key={lesson.slug}>
              <Link to="/lessons/$slug" params={{ slug: lesson.slug }}>
                <span className="directory-number">{String(lesson.number).padStart(2, "0")}</span>
                <span>
                  <strong>{lesson.concept}</strong>
                  <span>
                    {lesson.title} — {lesson.summary}
                  </span>
                </span>
                {lesson.status === "planned" ? (
                  <span className="inline-flex items-center gap-2">
                    <Clock size={16} aria-hidden />
                    Planned
                  </span>
                ) : (
                  <ArrowRight size={18} aria-hidden />
                )}
              </Link>
            </li>
          ))}
        </ol>
      </section>
      <section className="directory-resources" aria-labelledby="across-h">
        <h2 id="across-h">Across the lessons</h2>
        <ul>
          {CROSS_LESSON_PAGES.map((item) => (
            <li key={item.to}>
              <Link to={item.to}>
                <span className="directory-link-title">
                  {item.title} <ArrowRight size={16} aria-hidden />
                </span>
                <span>{item.summary}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}
