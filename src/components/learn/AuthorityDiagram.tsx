export function AuthorityDiagram({ k }: { k: string }) {
  const box = "fill-card stroke-foreground";
  const txt = "fill-muted-foreground font-mono text-xs";
  const cap = "fill-muted-foreground font-mono text-[10px] italic";
  const line = "stroke-muted-foreground";
  if (k === "S")
    return (
      <svg
        viewBox="0 0 320 110"
        className="w-full"
        role="img"
        aria-label="Three separately owned responsibilities: propose, policy, execute"
      >
        {[10, 120, 230].map((x, i) => (
          <g key={x}>
            <rect x={x} y={30} width={80} height={34} rx={6} className={box} strokeWidth={1.5} />
            <text x={x + 40} y={51} textAnchor="middle" className={txt}>
              {["Propose", "Policy", "Execute"][i]}
            </text>
          </g>
        ))}
        <line x1={90} y1={47} x2={120} y2={47} className={line} strokeWidth={1.5} />
        <line x1={200} y1={47} x2={230} y2={47} className={line} strokeWidth={1.5} />
        <text x={160} y={95} textAnchor="middle" className={cap}>
          separate owners, separate reasons to change
        </text>
      </svg>
    );
  if (k === "O")
    return (
      <svg
        viewBox="0 0 320 110"
        className="w-full"
        role="img"
        aria-label="Tools extending a stable contract, each requiring permission review"
      >
        <rect x={90} y={8} width={140} height={30} rx={6} className={box} strokeWidth={1.5} />
        <text x={160} y={27} textAnchor="middle" className={txt}>
          stable contract
        </text>
        {[30, 130, 230].map((x, i) => (
          <g key={x}>
            <rect
              x={x}
              y={62}
              width={80}
              height={28}
              rx={6}
              className={box}
              strokeWidth={1.5}
              strokeDasharray={i === 2 ? "4 3" : undefined}
            />
            <text x={x + 40} y={80} textAnchor="middle" className={txt}>
              {["tool A", "tool B", "+ new tool"][i]}
            </text>
            <line x1={x + 40} y1={62} x2={160} y2={38} className={line} strokeWidth={1.5} />
          </g>
        ))}
        <text x={160} y={106} textAnchor="middle" className={cap}>
          each extension: explicit permission review
        </text>
      </svg>
    );
  if (k === "L")
    return (
      <svg
        viewBox="0 0 320 110"
        className="w-full"
        role="img"
        aria-label="Two implementations preserving one behavioural contract"
      >
        <rect x={10} y={38} width={90} height={34} rx={6} className={box} strokeWidth={1.5} />
        <text x={55} y={59} textAnchor="middle" className={txt}>
          contract
        </text>
        {[10, 62].map((y, i) => (
          <g key={y}>
            <rect x={200} y={y} width={110} height={28} rx={6} className={box} strokeWidth={1.5} />
            <text x={255} y={y + 18} textAnchor="middle" className={txt}>
              {["impl A", "impl B"][i]}
            </text>
            <line x1={100} y1={55} x2={200} y2={y + 14} className={line} strokeWidth={1.5} />
          </g>
        ))}
        <text x={150} y={45} textAnchor="middle" className={cap}>
          same observable
        </text>
        <text x={150} y={58} textAnchor="middle" className={cap}>
          behaviour
        </text>
        <text x={160} y={106} textAnchor="middle" className={cap}>
          tests give evidence · confinement bounds effects
        </text>
      </svg>
    );
  if (k === "I")
    return (
      <svg
        viewBox="0 0 320 110"
        className="w-full"
        role="img"
        aria-label="Two clients, each with its own focused interface"
      >
        {[10, 62].map((y, i) => (
          <g key={y}>
            <rect x={10} y={y} width={110} height={28} rx={6} className={box} strokeWidth={1.5} />
            <text x={65} y={y + 18} textAnchor="middle" className={txt}>
              {["summary client", "report client"][i]}
            </text>
            <rect x={210} y={y} width={100} height={28} rx={6} className={box} strokeWidth={1.5} />
            <text x={260} y={y + 18} textAnchor="middle" className={txt}>
              {["readNote", "listNotes"][i]}
            </text>
            <line x1={120} y1={y + 14} x2={210} y2={y + 14} className={line} strokeWidth={1.5} />
          </g>
        ))}
        <text x={160} y={106} textAnchor="middle" className={cap}>
          focused interfaces · per-resource authorisation
        </text>
      </svg>
    );
  return (
    <svg
      viewBox="0 0 320 110"
      className="w-full"
      role="img"
      aria-label="Adapters depend on a policy-owned interface; the dependency points inward"
    >
      <rect x={70} y={8} width={180} height={30} rx={6} className={box} strokeWidth={1.5} />
      <text x={160} y={27} textAnchor="middle" className={txt}>
        policy-owned interface
      </text>
      {[30, 190].map((x, i) => (
        <g key={x}>
          <rect x={x} y={66} width={100} height={28} rx={6} className={box} strokeWidth={1.5} />
          <text x={x + 50} y={84} textAnchor="middle" className={txt}>
            {["adapter A", "adapter B"][i]}
          </text>
          <line
            x1={x + 50}
            y1={66}
            x2={x + 50}
            y2={44}
            className={line}
            strokeWidth={1.5}
            markerEnd="url(#dip-arrow)"
          />
        </g>
      ))}
      <defs>
        <marker id="dip-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0 0 L6 3 L0 6 Z" className="fill-muted-foreground" />
        </marker>
      </defs>
      <text x={160} y={108} textAnchor="middle" className={cap}>
        adapters depend on the abstraction, not the reverse
      </text>
    </svg>
  );
}
