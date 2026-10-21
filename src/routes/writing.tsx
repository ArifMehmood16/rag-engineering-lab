import { createFileRoute, Link } from "@tanstack/react-router";
import { ALL_TAKEAWAYS } from "@/content/writing";
import { getLesson } from "@/content/lessons";
import { Takeaways } from "@/components/learn/Takeaways";

const TITLE = "Writing exercises and post outlines — RAG Learning";
const DESC =
  "Reflection prompts and six-part post outlines for each of the five concepts, copyable as Markdown.";

export const Route = createFileRoute("/writing")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Writing,
});

function Writing() {
  return (
    <article className="mx-auto max-w-4xl px-5 py-10 lg:px-10">
      <p className="eyebrow">Across all lessons</p>
      <h1 className="mt-2 text-4xl font-medium sm:text-5xl">Writing exercises</h1>
      <p className="prose-body mt-4 max-w-2xl text-muted-foreground">
        Five reflection prompts and a six-part outline per concept. Copy any outline as Markdown and
        write it up in your own editor. Write from what you learned and designed — not from
        implementation stories or results that don’t exist yet. Nothing is posted anywhere.
      </p>
      <div className="mt-10 space-y-14">
        {ALL_TAKEAWAYS.map(({ slug, data }) => {
          const l = getLesson(slug)!;
          return (
            <section
              key={slug}
              aria-labelledby={`w-${slug}`}
              className="border-t border-border pt-8"
            >
              <p className="eyebrow">
                <Link to="/lessons/$slug" params={{ slug }} className="hover:underline">
                  Lesson 0{l.number} · {l.concept}
                </Link>
              </p>
              <h2 id={`w-${slug}`} className="sr-only">
                {data.topic}
              </h2>
              <div className="mt-3">
                <Takeaways data={data} />
              </div>
            </section>
          );
        })}
      </div>
    </article>
  );
}
