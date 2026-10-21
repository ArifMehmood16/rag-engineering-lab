import { cva, type VariantProps } from "class-variance-authority";
import { useState, type ReactNode } from "react";
import { Check, Copy, FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";
import { copyText } from "@/lib/storage";

export const badgeVariants = cva(
  "inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 font-mono text-[0.75rem] uppercase tracking-wider",
  {
    variants: {
      tone: {
        planned: "border-accent/50 bg-accent-soft text-accent-foreground",
        synthetic: "border-info/30 bg-info-soft text-info",
        proposed: "border-primary/30 bg-primary-soft text-primary",
        done: "border-primary bg-primary text-primary-foreground",
        neutral: "border-border bg-muted text-muted-foreground",
        warn: "border-destructive/30 bg-destructive-soft text-destructive",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export function Badge({
  tone,
  children,
  className,
}: VariantProps<typeof badgeVariants> & { children: ReactNode; className?: string }) {
  return <span className={cn(badgeVariants({ tone }), className)}>{children}</span>;
}

export const btnVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:bg-primary/90",
        outline: "border border-input bg-card hover:bg-muted",
        ghost: "hover:bg-muted",
        danger: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
      },
      size: { sm: "h-8 px-3", md: "h-10 px-4" },
    },
    defaultVariants: { variant: "outline", size: "md" },
  },
);

export function Section({
  id,
  step,
  title,
  children,
}: {
  id: string;
  step: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-h`}
      className="scroll-mt-24 border-t border-border pt-10"
    >
      <p className="eyebrow">{step}</p>
      <h2 id={`${id}-h`} className="mt-1 text-3xl font-medium">
        {title}
      </h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function SyntheticNotice({ children }: { children?: ReactNode }) {
  return (
    <p className="flex items-start gap-2 rounded-md border border-info/30 bg-info-soft px-3 py-2 text-sm text-info">
      <FlaskConical className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span>
        {children ??
          "Synthetic learning simulation. No live embedding model or EvidenceLens retrieval service is running."}{" "}
        <strong>Learning fixture. Not a measured project result.</strong>
      </span>
    </p>
  );
}

export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [state, setState] = useState<"idle" | "ok" | "fail">("idle");
  return (
    <button
      type="button"
      className={btnVariants({ size: "sm", variant: "outline" })}
      onClick={async () => {
        setState((await copyText(text)) ? "ok" : "fail");
        setTimeout(() => setState("idle"), 2200);
      }}
    >
      {state === "ok" ? (
        <Check className="size-4" aria-hidden />
      ) : (
        <Copy className="size-4" aria-hidden />
      )}
      <span aria-live="polite">
        {state === "ok"
          ? "Copied"
          : state === "fail"
            ? "Clipboard unavailable — select and copy manually"
            : label}
      </span>
    </button>
  );
}

export function CodeBlock({
  code,
  label,
  language = "python",
}: {
  code: string;
  label: string;
  language?: string;
}) {
  return (
    <figure className="overflow-hidden rounded-lg border border-border">
      <figcaption className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted px-3 py-2">
        <span className="flex items-center gap-2 text-sm">
          <Badge tone="proposed">{language}</Badge>
          {label}
        </span>
        <CopyButton text={code} label="Copy code" />
      </figcaption>
      <p className="border-b border-border bg-accent-soft px-3 py-1.5 text-xs font-medium">
        Proposed implementation sketch. Not existing EvidenceLens code.
      </p>
      <pre
        className="overflow-x-auto bg-code p-4 font-mono text-[0.82rem] leading-relaxed text-code-foreground"
        tabIndex={0}
      >
        <code>{code}</code>
      </pre>
    </figure>
  );
}

export function Callout({
  title,
  tone = "neutral",
  children,
}: {
  title: string;
  tone?: "neutral" | "accent" | "primary";
  children: ReactNode;
}) {
  const tones = {
    neutral: "border-border bg-card",
    accent: "border-accent/50 bg-accent-soft",
    primary: "border-primary/30 bg-primary-soft",
  };
  return (
    <div className={cn("rounded-lg border p-4", tones[tone])}>
      <p className="font-semibold">{title}</p>
      <div className="mt-1 text-sm leading-relaxed">{children}</div>
    </div>
  );
}

/** On/off control for lab demonstrations. A button with aria-pressed, not a form checkbox. */
export function ToggleChip({
  label,
  desc,
  pressed,
  onChange,
  disabled,
}: {
  label: string;
  desc?: string;
  pressed: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      disabled={disabled}
      onClick={() => onChange(!pressed)}
      className={cn(
        "flex w-full items-start justify-between gap-3 rounded-md border p-3 text-left text-sm transition-colors disabled:opacity-50",
        pressed ? "border-primary bg-primary-soft" : "border-border bg-card hover:bg-muted",
      )}
    >
      <span>
        <span className="block font-semibold">{label}</span>
        {desc && <span className="block text-xs text-muted-foreground">{desc}</span>}
      </span>
      <span
        className={cn(
          "shrink-0 rounded-full px-2 py-0.5 font-mono text-[0.75rem] uppercase",
          pressed ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
        )}
      >
        {pressed ? "On" : "Off"}
      </span>
    </button>
  );
}
