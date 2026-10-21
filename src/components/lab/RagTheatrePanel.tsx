import type { LearningTheatre } from "@/lib/rag-theatre";

export function RagTheatreResults({
  scene,
  compact = false,
}: {
  scene: LearningTheatre;
  compact?: boolean;
}) {
  return (
    <div
      className={compact ? "theatre-card-results" : "theatre-result-strip"}
      aria-label="Recorded scene results"
    >
      {scene.results.map((r) => (
        <div
          key={r.label}
          data-verdict={r.value === "FAIL" ? "fail" : r.value === "PASS" ? "pass" : "value"}
        >
          <strong>{r.value}</strong>
          <span>{r.label}</span>
        </div>
      ))}
    </div>
  );
}

export function RagTheatreCard({ scene }: { scene: LearningTheatre }) {
  return (
    <div className="theatre-reader">
      <span className="theatre-run-badge">
        {scene.kind === "evaluation"
          ? scene.mode === "judge"
            ? "SIMULATED LLM-AS-JUDGE"
            : scene.mode === "generation"
              ? "Fixed context: IDENTICAL"
              : "OFFLINE FIXTURE REPLAY"
          : scene.mode === "answer"
            ? "Approved-answer cache"
            : scene.mode === "warm"
              ? "REUSED PROCESSING · 1 model call"
              : scene.mode === "cold"
                ? "COLD PREFIX · 1 model call"
                : "SAME QUESTION · THREE PATHS"}
      </span>
      <p>{scene.action}</p>
      <RagTheatreResults scene={scene} compact />
      {scene.mode === "batch" && (
        <div className="theatre-case-key">
          {scene.cases.map((q) => (
            <span key={q.id}>
              <code>{q.id}</code> {q.label} <b>{q.expected}</b>
            </span>
          ))}
        </div>
      )}
      {scene.mode === "judge" && (
        <blockquote>
          “Collins walked on the Moon” contradicts the source: Collins remained in orbit.
        </blockquote>
      )}
      <details>
        <summary>Details & limits</summary>
        <p>{scene.takeaway}</p>
        <p>
          {scene.kind === "prefix"
            ? "The prefix state is schematic, not literal neurons or provider memory. Reuse assumes 160 tokens and compatible prefix/model versions. Work units model only generation; they are not prices or measured latency. Embedding caches reuse vectors; retrieval caches reuse candidate lists."
            : "Three reviewed presets, not a benchmark. The judge verdict uses fixture rules; no LLM runs. A production judge needs a versioned rubric and agreement checks against reviewed labels."}
        </p>
      </details>
    </div>
  );
}

export function RagTheatreOverlay({ scene }: { scene: LearningTheatre }) {
  return (
    <div className="theatre-overlay">
      <header className="theatre-caption">
        <span>
          {scene.kind === "prefix"
            ? "MODEL PROCESSING / VISUAL REPLAY"
            : "OFFLINE EVALUATION / RECORDED FIXTURES"}
        </span>
        <h2>{scene.title}</h2>
        <small>
          {scene.kind === "prefix"
            ? "Looped illustration of recorded requests · no new calls"
            : "Replay of fixture results · separate from live output checks"}
        </small>
      </header>
      <RagTheatreResults scene={scene} />
    </div>
  );
}

/** Readable no-WebGL equivalent of the dedicated 3D stages. */
export function RagTheatreFallback({ scene }: { scene: LearningTheatre }) {
  const prefix = scene.kind === "prefix";
  const arrow = `url(#theatre-arrow-${scene.kind})`;
  const route = (d: string, active = true, color = "#88b8c4") => (
    <path
      d={d}
      fill="none"
      stroke={color}
      strokeWidth="2"
      opacity={active ? 1 : 0.25}
      markerEnd={arrow}
    />
  );
  const node = (x: number, y: number, title: string, detail: string, color = "#88b8c4") => (
    <g>
      <rect x={x - 68} y={y - 27} width="136" height="54" rx="8" fill="#111f2f" stroke={color} />
      <text x={x} y={y - 3} textAnchor="middle">
        {title}
      </text>
      <text x={x} y={y + 16} textAnchor="middle">
        {detail}
      </text>
    </g>
  );
  const llm = (x: number, y: number, idle = false) => (
    <g opacity={idle ? 0.5 : 1}>
      <circle cx={x} cy={y} r="42" fill="#172135" stroke="#b29ac9" />
      <circle cx={x} cy={y} r="30" fill="none" stroke="#7389b4" strokeDasharray="3 5" />
      <text x={x} y={y + 5} textAnchor="middle">
        {idle ? "LLM · idle" : "LLM"}
      </text>
    </g>
  );
  return (
    <div className="theatre-fallback">
      <svg
        viewBox="0 0 760 340"
        role="img"
        aria-label={
          prefix
            ? "Prefix reuse scene: shared prefix, model-side state, LLM, and new generation"
            : "Offline evaluation scene: test cases, retrieval, LLM, and scored outcomes"
        }
      >
        <defs>
          <marker
            id={`theatre-arrow-${scene.kind}`}
            markerWidth="7"
            markerHeight="7"
            refX="6"
            refY="3.5"
            orient="auto"
          >
            <path d="M0 0L7 3.5L0 7" fill="#88b8c4" />
          </marker>
        </defs>
        {prefix ? (
          scene.mode === "compare" ? (
            scene.lanes.map((lane, i) => {
              const y = 65 + i * 105;
              return (
                <g key={lane.mode}>
                  {route(`M155 ${y}H310`)}
                  {route(`M445 ${y}H595`)}
                  {node(85, y, lane.name, `${lane.reused} prefix reused`)}
                  {node(
                    380,
                    y,
                    lane.mode === "answer"
                      ? "ANSWER CACHE"
                      : lane.mode === "warm"
                        ? "REUSE → LLM"
                        : "PREFILL → LLM",
                    lane.mode === "answer" ? "LLM bypassed" : "New generation",
                  )}
                  {node(665, y, `${lane.calls} model calls`, `${lane.work} work units`)}
                </g>
              );
            })
          ) : scene.mode === "answer" ? (
            <>
              {route("M155 140C300 30 515 30 610 125", true, "#a1cba8")}
              {route("M155 185H335", false)}
              {route("M425 185H610", false)}
              {node(85, 155, "ANSWER CACHE", "Approved claims", "#a1cba8")}
              {llm(380, 185, true)}
              {node(680, 155, "REUSED ANSWER", "0 model calls", "#a1cba8")}
              <text x="380" y="50" textAnchor="middle">
                Bypass generation · current release checks still run
              </text>
            </>
          ) : (
            <>
              <rect
                x="220"
                y="45"
                width="340"
                height="250"
                rx="15"
                fill="#111c2b"
                stroke="#9381ae"
              />
              <text x="390" y="72" textAnchor="middle">
                Model-side prefix state · simulated
              </text>
              {route("M150 120H240", scene.mode === "cold", "#bd9f76")}
              {route("M390 145V175", true, "#bd9f76")}
              {route("M150 260C245 260 260 220 340 220")}
              {route("M435 220H610", true, "#b29ac9")}
              {node(85, 120, "SHARED PREFIX", "Policy · schema · examples", "#bd9f76")}
              {node(
                390,
                115,
                scene.mode === "warm" ? "PREFIX REUSED" : "PREFILL",
                scene.mode === "warm" ? "160 tokens · assumed" : "Process fixed segments",
                "#bd9f76",
              )}
              {node(85, 260, "NEW INPUT", "Question + evidence")}
              {llm(390, 220)}
              {node(680, 220, "NEW DRAFT", `${scene.calls} model call`, "#b29ac9")}
            </>
          )
        ) : scene.mode === "judge" ? (
          <>
            {route("M190 90C280 90 270 130 335 150", true, "#d99e97")}
            {route("M190 250C280 250 270 210 335 190", true, "#83c7bb")}
            {node(115, 90, "CLAIM", "Collins walked on Moon", "#d99e97")}
            {node(115, 250, "SOURCE", "Collins stayed in orbit", "#83c7bb")}
            {llm(380, 170)}
            <text x="380" y="90" textAnchor="middle">
              Judge · simulated rubric
            </text>
            {scene.results.map((r, i) => (
              <g key={r.label}>
                {route(
                  `M425 170C480 170 510 ${70 + i * 100} 595 ${70 + i * 100}`,
                  true,
                  r.value === "PASS" ? "#a1cba8" : "#d99e97",
                )}
                {node(
                  665,
                  70 + i * 100,
                  r.value,
                  r.label,
                  r.value === "PASS" ? "#a1cba8" : "#d99e97",
                )}
              </g>
            ))}
          </>
        ) : (
          <>
            {(scene.mode === "batch" ? scene.cases : scene.cases.slice(0, 1)).map((q, i) => (
              <g key={q.id}>
                {node(85, 75 + i * 85, q.id, q.label)}
                {route(`M155 ${75 + i * 85}C200 ${75 + i * 85} 200 145 220 145`)}
              </g>
            ))}
            {route("M355 145H410", scene.calls > 0, "#83c7bb")}
            {route("M500 145H595", scene.calls > 0, "#b29ac9")}
            {node(
              290,
              145,
              "RETRIEVAL",
              scene.mode === "batch"
                ? "Check required facts"
                : `${scene.factsFound}/${scene.factsRequired} facts`,
              "#83c7bb",
            )}
            {llm(455, 145, scene.mode === "retrieval")}
            {node(
              665,
              145,
              scene.mode === "batch" ? "3/3 PASS" : "TEST FAIL",
              scene.mode === "batch"
                ? "Expected outcomes"
                : scene.mode === "retrieval"
                  ? "Answerable case"
                  : `${scene.supported}/${scene.claims} supported`,
              scene.mode === "batch" ? "#a1cba8" : "#d99e97",
            )}
            {(scene.mode === "batch" || scene.mode === "retrieval") && (
              <>
                {route(
                  "M290 175C340 300 600 300 665 180",
                  true,
                  scene.mode === "batch" ? "#83c7bb" : "#d99e97",
                )}
                <text x="460" y="310" textAnchor="middle">
                  {scene.mode === "batch"
                    ? "Q3: expected evidence gap · no generation · PASS"
                    : "0 generation calls · safe stop, failed answerable case"}
                </text>
              </>
            )}
          </>
        )}
      </svg>
    </div>
  );
}
