import { ChevronDown, List } from "lucide-react";
import { LESSON_SECTIONS } from "@/content/lessons";

export function LessonContents() {
  return (
    <details className="lesson-contents">
      <summary>
        <List size={17} aria-hidden /> On this page <ChevronDown size={16} aria-hidden />
      </summary>
      <nav aria-label="Lesson sections">
        <ol>
          {LESSON_SECTIONS.map(([id, label], i) => (
            <li key={id}>
              <a href={`#${id}`}>
                <span>{i + 1}.</span> {label}
              </a>
            </li>
          ))}
        </ol>
      </nav>
    </details>
  );
}
