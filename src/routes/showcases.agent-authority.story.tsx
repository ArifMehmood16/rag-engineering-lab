import { Button } from "@/components/ui/button";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  DEFAULT_SPEED,
  DURATION,
  JUMPS,
  PRESETS,
  TRANSCRIPT,
  renderSvg,
  sceneAt,
} from "@/lib/authority/engine.js";
import {
  detectVideoMime,
  downloadAllPresetsZip,
  downloadFramePng,
  downloadFrameSequenceZip,
  downloadFrameSvg,
  downloadPresetJpg,
  downloadPresetSvg,
  downloadStandaloneHtml,
  recordVideo,
  type VideoFormat,
} from "@/lib/authority/exporter";

const MEDIUM_URL =
  "https://arifmehmood9516.medium.com/the-lethal-trifecta-how-single-responsibility-helps-ai-6f91553d08f0";

export const Route = createFileRoute("/showcases/agent-authority/story")({
  head: () => ({
    meta: [
      { title: "One AI Agent, Too Much Power: The Lethal Trifecta — AI Is Still Software, Part 1" },
      {
        name: "description",
        content:
          "One order, one supplier note, one injected instruction. Two independent runs show how broad access leaks internal pricing — and how application-enforced limits send the legitimate delivery update instead.",
      },
      { property: "og:title", content: "One AI Agent, Too Much Power: The Lethal Trifecta" },
      {
        property: "og:description",
        content:
          "The lethal trifecta as an authority problem: broad access leaks internal pricing; application-owned orders, recipients and permitted fields send the legitimate delivery update.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Explorer,
});

const LEGEND = [
  { color: "bg-info", label: "input / proposal" },
  { color: "bg-destructive", label: "injected / forbidden / leak" },
  { color: "bg-accent", label: "private data" },
  { color: "bg-primary", label: "permitted / sent" },
];

function Explorer() {
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(DEFAULT_SPEED);
  const [videoSpeed, setVideoSpeed] = useState(1);
  const [status, setStatus] = useState("");
  const [capture, setCapture] = useState(false);
  const cancelVideo = useRef(false);
  const [recording, setRecording] = useState(false);

  useEffect(() => {
    setCapture(new URLSearchParams(window.location.search).has("capture"));
  }, []);

  // Deterministic playback loop: state is a pure function of t.
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      setT((prev) => {
        const next = prev + dt * speed;
        if (next >= DURATION) {
          setPlaying(false);
          return DURATION;
        }
        return next;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, speed]);

  const seek = (s: number) => {
    setT(Math.max(0, Math.min(DURATION, s)));
    setPlaying(false);
  };

  // Deterministic capture API for external recorders.
  useEffect(() => {
    (window as unknown as Record<string, unknown>)["authorityExplorer"] = {
      seek,
      play: () => setPlaying(true),
      pause: () => setPlaying(false),
    };
    return () => {
      delete (window as unknown as Record<string, unknown>)["authorityExplorer"];
      cancelVideo.current = true;
    };
  }, []);

  const scene = useMemo(() => sceneAt(t, "landscape"), [t]);
  const svg = useMemo(
    () =>
      renderSvg(scene, {
        ariaLabel: "Agent authority execution graph, segment: " + scene.segmentLabel,
      }),
    [scene],
  );

  const run = async (label: string, fn: () => Promise<void> | void) => {
    setStatus(label + "…");
    try {
      await fn();
      setStatus(label + " — downloaded.");
    } catch (err) {
      setStatus(label + " failed: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  const onRecordVideo = (format: VideoFormat) =>
    run("Recording " + format + " video (" + DURATION / videoSpeed + " seconds)", async () => {
      cancelVideo.current = false;
      setRecording(true);
      const mime = detectVideoMime();
      if (!mime) {
        setStatus(
          "This browser cannot record video — exporting a deterministic frame sequence instead…",
        );
        await downloadFrameSequenceZip(
          format,
          (f) => setStatus("Frame sequence " + Math.round(f * 100) + "%"),
          videoSpeed,
        );
        setStatus(
          "Frame sequence downloaded (encode to MP4 with ffmpeg; see README.txt in the ZIP).",
        );
        return;
      }
      const result = await recordVideo(
        format,
        (f) => setStatus("Recording " + format + " video — " + Math.round(f * 100) + "%"),
        () => cancelVideo.current,
        videoSpeed,
      );
      if (!result) throw new Error("Recorder unavailable");
      const url = URL.createObjectURL(result.blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "lethal-trifecta-" + format + "." + result.ext;
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      setStatus(
        "Downloaded " +
          result.width +
          "×" +
          result.height +
          " " +
          result.ext.toUpperCase() +
          (result.ext === "webm" ? " (honest WebM — this browser cannot encode MP4)" : "") +
          ".",
      );
    }).finally(() => setRecording(false));

  if (capture) {
    // Capture mode: no controls or app chrome, just graph + caption + provenance.
    return (
      <article className="fixed inset-0 z-50 overflow-auto bg-background px-6 py-8">
        <div dangerouslySetInnerHTML={{ __html: svg }} />
        <p className="mt-4 text-lg">{scene.caption}</p>
        <p className="mt-2 font-mono text-xs text-muted-foreground">
          AI Is Still Software · Part 1 · Arif Mehmood · hypothetical scenario, fixture values
        </p>
      </article>
    );
  }

  return (
    <article className="mx-auto max-w-[1440px] px-4 py-6 md:px-8">
      <header className="flex flex-wrap items-center justify-between gap-3 font-mono text-sm uppercase tracking-[0.2em] text-muted-foreground">
        <a
          href="https://github.com/ArifMehmood16"
          className="flex items-center gap-3"
          aria-label="Arif Mehmood on GitHub"
        >
          <span>AI Is Still Software · Part 1 · Arif Mehmood</span>
        </a>
        <span className="flex flex-wrap items-center gap-4 normal-case tracking-normal">
          <a
            href={MEDIUM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md border border-primary bg-primary px-3 py-1.5 font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Read the Medium article →
          </a>
          <Link to="/showcases/agent-authority" className="text-info underline underline-offset-4">
            Compare permissions
          </Link>
          <Link
            to="/showcases/agent-authority/solid"
            className="text-info underline underline-offset-4"
          >
            Design notes: SOLID and authority →
          </Link>
        </span>
      </header>

      <h1 className="mt-5 max-w-5xl text-3xl leading-[1.05] md:text-4xl">
        One AI Agent, Too Much Power: The Lethal Trifecta
      </h1>
      <p className="mt-3 max-w-4xl text-lg text-muted-foreground">
        One order, one supplier note, one injected instruction. Two independent runs: broad access,
        then application-enforced limits.
      </p>

      <div
        className="authority-graph mt-3 overflow-x-auto rounded-lg border bg-card [&_svg]:block [&_svg]:h-auto [&_svg]:w-full"
        dangerouslySetInnerHTML={{ __html: svg }}
      />

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          onClick={() => setPlaying((v) => !v)}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          {playing ? "Pause" : "Play"}
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setT(0);
            setPlaying(true);
          }}
          className="rounded-md border px-4 py-2 text-sm transition-colors hover:bg-card"
        >
          Replay
        </Button>
        {JUMPS.map((j) => (
          <Button
            variant="outline"
            key={j.id}
            onClick={() => seek(j.t)}
            className="rounded-md border px-4 py-2 text-sm transition-colors hover:bg-card"
          >
            {j.label}
          </Button>
        ))}
        <Button
          variant="outline"
          onClick={() => seek(t - 5)}
          className="rounded-md border px-3 py-2 text-sm hover:bg-card"
          aria-label="Back 5 seconds"
        >
          −5s
        </Button>
        <Button
          variant="outline"
          onClick={() => seek(t + 5)}
          className="rounded-md border px-3 py-2 text-sm hover:bg-card"
          aria-label="Forward 5 seconds"
        >
          +5s
        </Button>
        <input
          type="range"
          min={0}
          max={DURATION}
          step={0.1}
          value={t}
          onChange={(e) => seek(parseFloat(e.target.value))}
          className="min-w-40 flex-1"
          aria-label="Seek"
        />
        <span className="font-mono text-xs text-muted-foreground">
          {t.toFixed(1)}s / {DURATION}s
        </span>
        <select
          value={speed}
          onChange={(e) => setSpeed(parseFloat(e.target.value))}
          className="rounded-md border bg-card px-2 py-2 text-sm"
          aria-label="Playback speed"
        >
          <option value={0.25}>0.25×</option>
          <option value={0.5}>0.5×</option>
          <option value={1}>1×</option>
          <option value={2}>2×</option>
        </select>
      </div>

      <ol
        className="mt-3 grid grid-cols-3 gap-2 border-t pt-3 font-mono text-xs"
        aria-label="Story chapters"
      >
        <li>0–28s · Problem</li>
        <li>28–35s · What changes</li>
        <li>35–60s · Proposed solution</li>
      </ol>
      <p className="mt-3 max-w-6xl text-base leading-relaxed" aria-live="polite">
        {scene.caption}
      </p>
      <ul
        className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground"
        aria-label="Legend"
      >
        {LEGEND.map((l) => (
          <li key={l.label} className="flex items-center gap-1.5">
            <span className={"inline-block size-3 rounded-full " + l.color} />
            {l.label}
          </li>
        ))}
      </ul>

      <section className="mt-14 border-t pt-8">
        <h2 className="text-2xl">Exports</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Everything below is rendered by the same deterministic scene model as the graph above.
        </p>

        <div className="mt-5 grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border bg-card p-5">
            <h3 className="font-semibold">Article figures (3 JPGs · 2400×1350)</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Dedicated 16:9 figures for the Medium article.
            </p>
            <ul className="mt-2 space-y-2 text-sm">
              {PRESETS.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center gap-2">
                  <span className="min-w-44 font-mono text-xs">{p.id}</span>
                  <Button
                    variant="outline"
                    onClick={() => run(p.id + " JPG", () => downloadPresetJpg(p.id))}
                    className="rounded border px-2 py-1 text-xs hover:bg-background"
                  >
                    JPG
                  </Button>
                </li>
              ))}
            </ul>
            <Button
              variant="outline"
              onClick={() => run("Figures ZIP", () => downloadAllPresetsZip())}
              className="mt-3 rounded-md border px-3 py-1.5 text-sm hover:bg-background"
            >
              Download all three as ZIP (JPG + captions)
            </Button>
          </div>

          <div className="rounded-xl border bg-card p-5">
            <h3 className="font-semibold">LinkedIn video</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Silent full-story recording. MP4 when available; otherwise honestly labelled WebM.
              Viewing speed does not change export duration.
            </p>
            <label className="mt-3 block text-sm">
              Video duration{" "}
              <select
                aria-label="Video duration"
                className="ml-2 rounded-md border bg-card px-2 py-2"
                value={videoSpeed}
                onChange={(e) => setVideoSpeed(Number(e.target.value))}
              >
                <option value={1}>1× story · 60 seconds</option>
                <option value={0.5}>Slower · 120 seconds</option>
              </select>
            </label>
            <p className="mt-2 font-mono text-xs text-muted-foreground">
              Wall-clock chapters: problem 0–{28 / videoSpeed}s · changes {28 / videoSpeed}–
              {35 / videoSpeed}s · solution {35 / videoSpeed}–{DURATION / videoSpeed}s
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                variant="outline"
                disabled={recording}
                onClick={() => onRecordVideo("portrait")}
                className="rounded-md border px-3 py-1.5 text-sm hover:bg-background"
              >
                Portrait · 1080×1350
              </Button>
              <Button
                variant="outline"
                disabled={recording}
                onClick={() => onRecordVideo("landscape")}
                className="rounded-md border px-3 py-1.5 text-sm hover:bg-background"
              >
                Landscape · 1920×1080
              </Button>
              <Button
                variant="outline"
                onClick={() => (cancelVideo.current = true)}
                className="rounded-md border px-3 py-1.5 text-sm hover:bg-background"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>

        <details className="mt-6 rounded-xl border bg-card p-5">
          <summary className="cursor-pointer font-semibold">Advanced exports</summary>
          <div className="mt-4 grid gap-6 md:grid-cols-3">
            <div>
              <h3 className="text-sm font-semibold">Current frame</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                The graph exactly as shown now, without controls.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={() => run("PNG frame", () => downloadFramePng(t))}
                  className="rounded-md border px-3 py-1.5 text-sm hover:bg-background"
                >
                  PNG · 1600×1000
                </Button>
                <Button
                  variant="outline"
                  onClick={() => run("SVG frame", () => downloadFrameSvg(t))}
                  className="rounded-md border px-3 py-1.5 text-sm hover:bg-background"
                >
                  Editable SVG
                </Button>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold">Figure sources (SVG)</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Editable vector versions of the three article figures.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {PRESETS.map((p) => (
                  <Button
                    key={p.id}
                    variant="outline"
                    onClick={() => run(p.id + " SVG", () => downloadPresetSvg(p.id))}
                    className="rounded border px-2 py-1 text-xs hover:bg-background"
                  >
                    {p.id}.svg
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold">Standalone HTML</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                One self-contained file: opens from disk, keeps playback, seeking and labels. No
                network requests.
              </p>
              <Button
                variant="outline"
                onClick={() => run("Standalone HTML", () => downloadStandaloneHtml())}
                className="mt-3 rounded-md border px-3 py-1.5 text-sm hover:bg-background"
              >
                agent-authority-explorer.html
              </Button>
            </div>
          </div>
        </details>

        <p
          className="mt-4 font-mono text-xs text-muted-foreground"
          role="status"
          aria-live="polite"
        >
          {status || "Ready."}
        </p>
      </section>

      <section className="mt-14 border-t pt-8">
        <details>
          <summary className="cursor-pointer font-semibold">Text version of the story</summary>
          <ol className="mt-4 max-w-3xl space-y-3 text-sm leading-relaxed text-muted-foreground">
            {TRANSCRIPT.map((s) => (
              <li key={s.label}>
                <b className="text-foreground">{s.label}.</b> {s.text}
              </li>
            ))}
          </ol>
          <p className="mt-4 max-w-3xl text-sm text-muted-foreground">
            In the proposed design the application — not the AI — owns the selected order, resolves
            the supplier contact from trusted records, and builds a fixed email template from
            approved delivery fields. The AI has no direct private-file or email route, and the note
            cannot change the selected order. This is a hypothetical scenario with a proposed
            architecture, not a measured security result.
          </p>
        </details>
        <p className="mt-5 font-mono text-sm text-muted-foreground">
          Companion to the Medium article{" "}
          <a
            href={MEDIUM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-info underline underline-offset-4"
          >
            “The Lethal Trifecta: How Single Responsibility Helps AI”
          </a>
          . References: Simon Willison (lethal trifecta) · Robert C. Martin (SRP) · OWASP LLM06:2025
          (excessive agency). Hypothetical scenario with illustrative fixture values.
        </p>
      </section>
    </article>
  );
}
