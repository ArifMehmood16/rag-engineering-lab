import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { LESSONS } from "@/content/lessons";
import { btnVariants } from "./ui";

/** Previous / next navigation shared by every lesson. */
export function LessonPager({ slug }: { slug: string }) {
  const i = LESSONS.findIndex((l) => l.slug === slug);
  const prev = LESSONS[i - 1];
  const next = LESSONS[i + 1];
  return (
    <nav
      aria-label="Lesson navigation"
      className="mx-auto mb-14 flex max-w-4xl flex-col gap-3 px-5 sm:flex-row sm:items-center sm:justify-between lg:px-10"
    >
      {prev ? (
        <Link
          to="/lessons/$slug"
          params={{ slug: prev.slug }}
          className={btnVariants({ variant: "outline" })}
        >
          <ArrowLeft className="size-4" aria-hidden /> Lesson {prev.number}: {prev.concept}
        </Link>
      ) : (
        <Link to="/overview" className={btnVariants({ variant: "outline" })}>
          <ArrowLeft className="size-4" aria-hidden /> Overview
        </Link>
      )}
      <span className="text-center font-mono text-xs text-muted-foreground">
        Lesson {i + 1} of {LESSONS.length}
      </span>
      {next ? (
        <Link
          to="/lessons/$slug"
          params={{ slug: next.slug }}
          className={btnVariants({ variant: "primary" })}
        >
          Lesson {next.number}: {next.concept} <ArrowRight className="size-4" aria-hidden />
        </Link>
      ) : (
        <Link to="/architecture" className={btnVariants({ variant: "primary" })}>
          See the architecture map <ArrowRight className="size-4" aria-hidden />
        </Link>
      )}
    </nav>
  );
}
