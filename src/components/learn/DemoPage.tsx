import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { getLesson } from "@/content/lessons";

export function DemoPage({
  lesson,
  title,
  intro,
  children,
}: {
  lesson: string;
  title: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <article className="demo-reader mx-auto max-w-5xl space-y-8 px-5 py-10 lg:px-10">
      <header className="demo-heading">
        <Link to="/lessons/$slug" params={{ slug: lesson }} className="demo-parent">
          <ArrowLeft size={15} aria-hidden /> {getLesson(lesson)?.title}
        </Link>
        <h1 className="text-4xl font-semibold sm:text-5xl">{title}</h1>
        <p className="max-w-prose leading-relaxed">{intro}</p>
      </header>
      {children}
    </article>
  );
}
