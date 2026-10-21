import type React from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Clock } from "lucide-react";
import { getLesson } from "@/content/lessons";
import { LessonPager } from "@/components/learn/LessonPager";
import { LessonContext } from "@/components/learn/LessonContext";
import { LessonCost } from "@/components/learn/LessonCost";
import { LessonEval } from "@/components/learn/LessonEval";
import { LessonGuard } from "@/components/learn/LessonGuard";
import { LessonAgents } from "@/components/learn/LessonAgents";
import { Badge, btnVariants } from "@/components/learn/ui";

export const Route = createFileRoute("/lessons/$slug")({
  loader: ({ params }) => {
    const lesson = getLesson(params.slug);
    if (!lesson) throw notFound();
    return { slug: lesson.slug };
  },
  head: ({ loaderData }) => {
    const l = loaderData ? getLesson(loaderData.slug) : undefined;
    const title = l ? `Lesson ${l.number}: ${l.concept} — AI Engineering, Made Practical` : "Lesson unavailable — AI Engineering, Made Practical";
    const description = l ? l.summary : "This lesson could not be found.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary" },
        ...(l ? [] : [{ name: "robots", content: "noindex" }]),
      ],
    };
  },
  component: LessonPage,
});

function LessonPage() {
  const { slug } = Route.useLoaderData();
  const lesson = getLesson(slug)!;
  const BODIES: Record<string, () => React.ReactElement> = { context: LessonContext, "cost-latency": LessonCost, evaluation: LessonEval, guardrails: LessonGuard, "tools-agents": LessonAgents };
  const Body = BODIES[lesson.slug];
  if (Body) return (<><Body /><LessonPager slug={lesson.slug} /></>);

  return (
    <article className="mx-auto max-w-3xl px-5 py-14 lg:px-10">
      <p className="eyebrow">
        Lesson 0{lesson.number} · {lesson.concept}
      </p>
      <h1 className="mt-2 text-4xl font-medium">{lesson.title}</h1>
      <div className="mt-4">
        <Badge tone="planned">
          <Clock className="size-3" aria-hidden /> Planned — not yet written
        </Badge>
      </div>
      <p className="prose-body mt-6 text-muted-foreground">{lesson.summary}</p>
      <div className="mt-8 rounded-lg border border-dashed border-border bg-card p-5">
        <h2 className="font-sans text-sm font-semibold">Planned for the next increment</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
          {lesson.nextUp?.map((n) => <li key={n}>{n}</li>)}
        </ul>
        <p className="mt-4 text-sm text-muted-foreground">
          This lesson has no content yet. It will follow the same nine-part structure as Lesson 1.
        </p>
      </div>
      <Link to="/lessons/$slug" params={{ slug: "context" }} className={`${btnVariants({ variant: "primary" })} mt-8`}>
        Go to Lesson 1
      </Link>
    </article>
  );
}
