import { useId, type CSSProperties } from "react";
import type { EvidenceRecord } from "@/content/apollo";
import { buildKnowledgeIndex } from "@/lib/knowledge-index";
import {
  atOutput,
  stageInput,
  stageOutput,
  walkthroughStep,
  type WalkthroughState,
} from "@/lib/rag-walkthrough";
import { cn } from "@/lib/utils";

/** A sharp vector stage: every object and moving connection represents application data. */
function SystemDrawing({
  tour,
  record,
  records,
  prefix,
}: {
  tour: WalkthroughState;
  record: EvidenceRecord;
  records: EvidenceRecord[];
  prefix: string;
}) {
  const prep = tour.phase === "knowledge";
  const index = buildKnowledgeIndex(records);
  const vector = index.chunks.find((c) => c.id === record.id)?.vector ?? [];
  const after = stageOutput(tour);
  const group = prep
    ? ["sources", "chunks", "vectors", "index"][tour.stage]
    : [
        "question",
        "question",
        "route",
        "retrieve",
        "context",
        "tool",
        "context",
        "model",
        "verify",
        "verify",
        "answer",
      ][tour.stage];
  const placement = (name: string) => {
    if (prep) return undefined;
    const centers: Record<string, number> = {
      sources: 111,
      chunks: 343,
      vectors: 590,
      index: 847,
      question: 92,
      route: 205,
      retrieve: 295,
      context: 515,
      model: 707,
      verify: 891,
      tool: 620,
      cache: 412,
      answer: 691,
    };
    const knowledge = ["sources", "chunks", "vectors", "index"].includes(name);
    const scale = knowledge ? 0.6 : name === "model" ? 1 : 0.85;
    return `translate(${centers[name]! * (1 - scale)} ${(knowledge ? 60 : 230) - scale * (knowledge ? 154 : 365)}) scale(${scale})`;
  };
  const working = tour.beat > 0;
  const active = (name: string) =>
    group === name ||
    (!prep &&
      tour.stage === 2 &&
      name === "cache" &&
      (stageInput(tour).config.answerCache ||
        stageInput(tour).config.promptCache ||
        stageInput(tour).config.retrievalCache));
  const nodeClass = (name: string) =>
    cn("system-object", active(name) && "system-object-active", !prep && "system-request-object");
  const edge = (d: string, show: boolean) => (
    <g key={d} className={cn("system-path", show && working && "system-path-active")}>
      <path d={d} markerEnd={`url(#${prefix}-arrow)`} />
      <path d={d} pathLength="1" className="system-data-packet" />
    </g>
  );
  const paper = (x: number, y: number, n: number) => (
    <g
      key={n}
      transform={`translate(${x} ${y}) rotate(${n % 2 ? 5 : -5})`}
      className="system-paper"
    >
      <path
        d="M0 0H55L70 15V84H0Z"
        fill={`url(#${prefix}-paper)`}
        stroke="#74b9d4"
        strokeWidth="1.6"
      />
      <path d="M55 0V15H70" fill="#1a3c50" stroke="#74b9d4" />
      {[25, 35, 45, 55, 65].map((yy, i) => (
        <path
          key={yy}
          d={`M11 ${yy}H${i % 2 ? 49 : 57}`}
          stroke="#8cd4df"
          strokeOpacity={0.4 + i * 0.09}
          strokeWidth="2"
        />
      ))}
    </g>
  );
  return (
    <>
      <defs>
        <marker
          id={`${prefix}-arrow`}
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="4"
          markerHeight="4"
          orient="auto"
        >
          <path d="M0 0L10 5L0 10Z" fill="#80bdcf" />
        </marker>
        <linearGradient id={`${prefix}-paper`} x2="1" y2="1">
          <stop stopColor="#23465d" />
          <stop offset="1" stopColor="#0c1729" />
        </linearGradient>
        <linearGradient id={`${prefix}-core`} x2="1" y2="1">
          <stop stopColor="#ad80ef" stopOpacity=".55" />
          <stop offset=".55" stopColor="#3c3b9c" stopOpacity=".55" />
          <stop offset="1" stopColor="#13233b" />
        </linearGradient>
        <linearGradient id={`${prefix}-mint`} x2="0" y2="1">
          <stop stopColor="#a1f5e5" />
          <stop offset="1" stopColor="#286b81" />
        </linearGradient>
        <radialGradient id={`${prefix}-halo`}>
          <stop stopColor="#7be5e4" stopOpacity=".22" />
          <stop offset="1" stopColor="#7be5e4" stopOpacity="0" />
        </radialGradient>
        <filter id={`${prefix}-light`} x="-70%" y="-70%" width="240%" height="240%">
          <feGaussianBlur stdDeviation="5" />
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g className="system-ground" stroke="#537e9b" strokeOpacity=".12" fill="none">
        {Array.from({ length: 11 }, (_, n) => (
          <path key={`v${n}`} d={`M${-400 + n * 180} 590L500 30`} />
        ))}
        {[70, 100, 142, 197, 270, 365, 480, 590].map((y) => (
          <path key={y} d={`M-70 ${y}H1100`} />
        ))}
      </g>
      <g className="system-stars" fill="#a4d2df">
        {Array.from({ length: 40 }, (_, n) => (
          <circle
            key={n}
            cx={(n * 193 + 47) % 1000}
            cy={(n * 113 + 19) % 570}
            r={n % 7 === 0 ? 1.4 : 0.65}
            opacity={0.13 + (n % 4) * 0.08}
          />
        ))}
      </g>
      <text x="42" y="40" className="system-zone-label">
        KNOWLEDGE / BEFORE THE QUESTION
      </text>
      <g key={`${tour.phase}-${tour.stage}-${tour.beat}`} className="system-flow-effects">
        {edge("M165 154C215 154 243 154 285 154", prep && tour.stage === 1)}
        {edge("M390 154H510", prep && tour.stage === 2)}
        {edge("M662 154H790", prep && tour.stage === 3)}
        {!prep && (
          <>
            {edge("M847 104V157H295V196", !prep && tour.stage === 3)}
            {edge("M126 230H264", !prep && tour.stage <= 3)}
            {edge("M327 230H474", !prep && tour.stage === 4)}
            {edge("M557 230H655", !prep && tour.stage === 7)}
            {edge("M756 230H859", !prep && [8, 9].includes(tour.stage))}
            {edge("M891 277V328H950", !prep && tour.stage === 10)}
            {edge("M515 196V165H620V156", !prep && tour.stage === 5)}
            {edge("M205 214V154H390", !prep && tour.stage === 2)}
          </>
        )}
      </g>
      <g className={nodeClass("sources")} transform={placement("sources")}>
        <ellipse cx="120" cy="223" rx="83" ry="18" fill={`url(#${prefix}-halo)`} />
        <g className="system-source-pages">
          {paper(83, 91, 0)}
          {paper(59, 70, 1)}
        </g>
        {active("sources") && working && (
          <path
            key={tour.beat}
            className="system-scan"
            d="M42 95H145"
            stroke="#adfff2"
            strokeWidth="2"
            filter={`url(#${prefix}-light)`}
          />
        )}
        <text x="111" y="252" className="system-object-title">
          Source pages
        </text>
        <text x="111" y="275" className="system-object-subtitle">
          2 identities + version
        </text>
      </g>
      <g className={nodeClass("chunks")} transform={placement("chunks")}>
        <ellipse cx="342" cy="224" rx="92" ry="20" fill={`url(#${prefix}-halo)`} />
        <g
          className={cn("system-chunk-cloud", active("chunks") && working && "system-chunks-split")}
        >
          {index.chunks.map((chunk, n) => (
            <g
              key={chunk.id}
              className={cn("system-chunk-tile", chunk.id === record.id && "system-selected-tile")}
              style={
                {
                  "--tile-dx": `${((n % 3) - 1) * 9}px`,
                  "--tile-dy": `${(Math.floor(n / 4) - 1) * 8}px`,
                } as CSSProperties
              }
              transform={`translate(${277 + (n % 4) * 32} ${86 + Math.floor(n / 4) * 33}) skewY(-8)`}
            >
              <rect
                width="57"
                height="34"
                rx="3"
                fill="#10263b"
                stroke={chunk.id === record.id ? "#a5f5e9" : "#4e8ba6"}
                strokeWidth={chunk.id === record.id ? 2 : 1}
              />
              <path d="M7 9H46M7 16H41M7 23H29" stroke="#80cad8" strokeWidth="1.4" opacity=".7" />
            </g>
          ))}
        </g>
        <text x="343" y="252" className="system-object-title">
          Bounded chunks
        </text>
        <text x="343" y="275" className="system-object-subtitle">
          {index.chunks.length} passages / provenance intact
        </text>
      </g>
      <g className={nodeClass("vectors")} transform={placement("vectors")}>
        <ellipse cx="589" cy="223" rx="95" ry="22" fill={`url(#${prefix}-halo)`} />
        <path d="M515 187L576 219L667 178L607 146Z" fill="#0d2034" stroke="#436a8d" />
        {[0, 1, 2, 3].map((n) => (
          <path
            key={n}
            d={`M${530 + n * 20} ${195 + n * 2}L${616 + n * 12} ${156 + n * 5}`}
            stroke="#456d8e"
            strokeOpacity=".5"
          />
        ))}
        {vector.map((v, n) => (
          <g key={n} transform={`translate(${525 + n * 18} ${165 - n * 2})`}>
            <path
              d={`M0 0V${-v * 88}L10 ${-6 - v * 88}V-6Z`}
              fill={`url(#${prefix}-mint)`}
              opacity={0.45 + v * 0.55}
            />
            <path d={`M10 ${-6 - v * 88}L15 ${-3 - v * 88}V-3L10-6Z`} fill="#367b94" />
            <path
              d={`M0 ${-v * 88}L10 ${-6 - v * 88}L15 ${-3 - v * 88}L5 ${3 - v * 88}Z`}
              fill="#a4e7e6"
              opacity=".8"
            />
          </g>
        ))}
        <text x="590" y="252" className="system-object-title">
          Numeric meaning
        </text>
        <text x="590" y="275" className="system-object-subtitle">
          7 actual toy feature values
        </text>
      </g>
      <g className={nodeClass("index")} transform={placement("index")}>
        <ellipse cx="847" cy="229" rx="100" ry="27" fill={`url(#${prefix}-halo)`} />
        <path
          d="M790 102V198C790 225 904 225 904 198V102"
          fill="#112c40"
          stroke="#6cbad1"
          strokeWidth="1.7"
        />
        {[104, 132, 163, 196].map((y, n) => (
          <ellipse
            key={y}
            cx="847"
            cy={y}
            rx="57"
            ry="17"
            fill={n === 0 ? "#244963" : "none"}
            stroke="#72c0d2"
            strokeOpacity={0.9 - n * 0.13}
            strokeWidth="1.6"
          />
        ))}
        {[0, 1, 2, 3, 4].map((n) => (
          <g key={n}>
            <circle cx={809 + n * 18} cy={149 + Math.sin(n) * 7} r="2.6" fill="#b1eee8" />
            <path d={`M${806 + n * 18} 176V188`} stroke="#79c6cf" strokeWidth="2" />
          </g>
        ))}
        <path
          d="M817 86L847 72L877 86L847 100Z"
          fill="#66b9d1"
          fillOpacity=".18"
          stroke="#a5e8eb"
        />
        <text x="846" y="252" className="system-object-title">
          Knowledge index
        </text>
        <text x="846" y="275" className="system-object-subtitle">
          vector ↔ passage ↔ source
        </text>
      </g>
      <g className={cn("system-query-world", prep && "system-query-dormant")}>
        <text x="42" y="310" className="system-zone-label">
          REQUEST / RETRIEVE → AUGMENT → GENERATE → CHECK
        </text>
        <g className={nodeClass("question")} transform={placement("question")}>
          <circle cx="92" cy="369" r="40" fill="#122d40" stroke="#5aabbc" />
          <path
            d="M70 353H113V379H94L80 390V379H70Z"
            fill="#25495c"
            stroke="#b6e8ef"
            strokeWidth="1.8"
          />
          <path d="M80 361H103M80 369H97" stroke="#a2d7e4" strokeWidth="2" />
          <text x="92" y="440" className="system-object-title">
            Question + scope
          </text>
        </g>
        <g className={nodeClass("route")} transform={placement("route")}>
          <path
            d="M205 348L225 368L205 388L185 368Z"
            fill="#29314c"
            stroke="#9d9cdd"
            strokeWidth="1.6"
          />
          <text x="225" y="414" className="system-object-subtitle">
            route
          </text>
        </g>
        <g className={nodeClass("retrieve")} transform={placement("retrieve")}>
          <circle cx="295" cy="363" r="37" fill="#102637" stroke="#71c9d5" strokeWidth="1.5" />
          <circle cx="290" cy="359" r="19" fill="#16404e" stroke="#b8f5ed" strokeWidth="2" />
          <path d="M303 372L319 390" stroke="#b8f5ed" strokeWidth="4" strokeLinecap="round" />
          <path d="M280 359H300M290 349V369" stroke="#8ac7d6" strokeWidth="1" />
          <text x="295" y="440" className="system-object-title">
            Retrieve evidence
          </text>
        </g>
        <g className={nodeClass("context")} transform={placement("context")}>
          <path d="M464 359L515 338L563 360V397L515 419L464 395Z" fill="#172b45" stroke="#7aa8d0" />
          <path d="M464 359L515 382L563 360M515 382V419" fill="none" stroke="#7aa8d0" />
          <g transform="translate(478 325) rotate(-7)">
            {[0, 1, 2].map((n) => (
              <g key={n} transform={`translate(${n * 18} ${n * 3})`}>
                <rect width="26" height="46" rx="2" fill="#244658" stroke="#9ac7d4" />
                <path d="M5 12H21M5 20H20M5 28H17" stroke="#a5dce5" strokeWidth="1.5" />
              </g>
            ))}
          </g>
          <text x="515" y="456" className="system-object-title">
            Context tray
          </text>
          <text x="515" y="478" className="system-object-subtitle">
            {after?.ctx.context.length ?? stageInput(tour).ctx.context.length} selected passages
          </text>
        </g>
        <g className={nodeClass("model")} transform={placement("model")}>
          <ellipse
            cx="707"
            cy="413"
            rx="66"
            ry="24"
            fill="#644d9c"
            fillOpacity=".18"
            stroke="#7568ad"
            strokeOpacity=".4"
          />
          <path
            d="M707 304L756 336V389L707 420L658 389V336Z"
            fill={`url(#${prefix}-core)`}
            stroke="#b7a0f0"
            strokeWidth="1.8"
          />
          <path
            d="M707 304L707 364L658 389M707 364L756 389M658 336L756 389M756 336L658 389M658 336L707 420L756 336M707 304L658 389H756Z"
            fill="none"
            stroke="#b6b5f6"
            strokeOpacity=".75"
            strokeWidth="1.2"
          />
          <path
            d="M688 351L707 340L727 352V376L707 388L688 376Z"
            fill="#a689eb"
            fillOpacity=".65"
            stroke="#dfd1ff"
            strokeWidth="1.6"
          />
          <circle cx="707" cy="364" r="5" fill="#f0e9ff" filter={`url(#${prefix}-light)`} />
          <text x="707" y="456" className="system-object-title">
            Language model
          </text>
          <text x="707" y="478" className="system-object-subtitle">
            fixture generator / not retrained
          </text>
        </g>
        <g className={nodeClass("verify")} transform={placement("verify")}>
          <path
            d="M891 324L929 337V373C929 398 891 420 891 420S853 398 853 373V337Z"
            fill={after?.halted && group === "verify" ? "#442536" : "#173a3d"}
            stroke={after?.halted && group === "verify" ? "#ee9fae" : "#90dcd3"}
            strokeWidth="2"
          />
          <path
            d={
              after?.halted && group === "verify"
                ? "M878 353L904 383M904 353L878 383"
                : "M874 369L886 381L910 353"
            }
            fill="none"
            stroke={after?.halted && group === "verify" ? "#ffbdc5" : "#b4f5df"}
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <text x="891" y="456" className="system-object-title">
            Verify + authorize
          </text>
        </g>
        <g className={nodeClass("tool")} transform={placement("tool")}>
          <path d="M590 256H651V279H590Z" fill="#172c2d" stroke="#79baad" />
          <text x="620" y="272" textAnchor="middle" fontSize="12" fill="#a4dfc5">
            READ TOOL
          </text>
        </g>
        <g className={nodeClass("cache")} transform={placement("cache")}>
          <path d="M386 261L412 246L437 261V288H386Z" fill="#362b1c" stroke="#b19d62" />
          <path d="M396 269H427M396 278H420" stroke="#d8c483" strokeWidth="2" />
          <text x="412" y="318" className="system-object-subtitle">
            cache
          </text>
        </g>
        <g
          className={cn(nodeClass("answer"), "system-answer-object")}
          transform={placement("answer")}
        >
          <path d="M653 487H728V539H653Z" fill="#143335" stroke="#82c9c2" />
          <path d="M665 501H715M665 512H712M665 523H698" stroke="#b4e4d9" strokeWidth="2" />
          <text x="691" y="566" className="system-object-subtitle">
            released answer + citations
          </text>
        </g>
      </g>
    </>
  );
}

export function RagStageScene({
  tour,
  record,
  records,
  reduced,
}: {
  tour: WalkthroughState;
  record: EvidenceRecord;
  records: EvidenceRecord[];
  reduced: boolean;
}) {
  const prefix = useId().replace(/:/g, "");
  const output = atOutput(tour);
  const after = stageOutput(tour);
  const prep = tour.phase === "knowledge";
  const mobileViews = prep
    ? ["15 48 180 195", "240 50 205 195", "485 45 210 195", "745 50 210 195"]
    : [
        "30 178 290 150",
        "30 178 290 150",
        "170 108 295 200",
        "235 180 190 155",
        "440 170 170 160",
        "535 112 220 125",
        "440 170 170 160",
        "620 150 180 180",
        "830 180 150 140",
        "830 180 150 140",
        "830 180 150 140",
      ];
  const outputLabel = !output
    ? "Awaiting this transformation"
    : prep
      ? [
          "Text + identity retained",
          "Bounded chunks + provenance",
          "Seven-dimensional vectors",
          "Searchable index ready",
        ][tour.stage]
      : after?.ctx.released
        ? "Checked answer + citations"
        : after?.halted
          ? "Stopped before release"
          : `${walkthroughStep(tour).short} output ready`;
  const [cameraX, cameraY, cameraWidth, cameraHeight] =
    mobileViews[tour.stage]!.split(" ").map(Number);
  return (
    <figure
      className={cn("tour-system-scene", prep && "scene-preparing", reduced && "scene-still")}
      aria-label={`Visual RAG system: ${walkthroughStep(tour).title}`}
    >
      <figcaption>
        <span className="scene-live-dot" /> SYSTEM VIEW{" "}
        <span>Data transformations · no hidden reasoning</span>
      </figcaption>
      <div className="system-viewport">
        <svg
          className="system-svg system-desktop-svg"
          viewBox={prep ? "0 15 1000 305" : "0 0 1000 350"}
          aria-hidden
        >
          <SystemDrawing
            key={`${tour.phase}-${tour.stage}-${tour.beat}`}
            tour={tour}
            record={record}
            records={records}
            prefix={`${prefix}-wide`}
          />
        </svg>
        <svg className="system-svg system-mobile-svg" viewBox={mobileViews[tour.stage]} aria-hidden>
          <defs>
            <clipPath id={`${prefix}-camera`}>
              <rect x={cameraX} y={cameraY} width={cameraWidth} height={cameraHeight} />
            </clipPath>
          </defs>
          <g clipPath={`url(#${prefix}-camera)`}>
            <SystemDrawing
              key={`${tour.phase}-${tour.stage}-${tour.beat}`}
              tour={tour}
              record={record}
              records={records}
              prefix={`${prefix}-small`}
            />
          </g>
        </svg>
        <div className="system-scene-key">
          <span>
            <i />
            Active path
          </span>
          <span>
            <i />
            Prepared evidence
          </span>
          <span>
            <i />
            Model / untrusted draft
          </span>
        </div>
      </div>
      <div className="scene-data-docks">
        <div className="scene-data-dock">
          <span>INPUT</span>
          <strong>{prep ? record.source.title : "User question + permitted evidence"}</strong>
          <p>
            {prep
              ? tour.stage === 0
                ? `${record.source.publisher} · version and locator retained`
                : record.id
              : stageInput(tour).ctx.question}
          </p>
        </div>
        <div className={cn("scene-data-dock", output && "dock-ready")}>
          <span>OUTPUT {output && "✓"}</span>
          <strong>{outputLabel}</strong>
          <p>
            {prep
              ? output
                ? record.id
                : "Follow the highlighted operation"
              : (after?.ctx.released?.answer ??
                (output
                  ? after?.results[tour.stage]?.output[0]
                  : "The result remains withheld until the work is done."))}
          </p>
        </div>
      </div>
    </figure>
  );
}
