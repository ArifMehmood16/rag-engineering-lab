/** Low-effects ORBIT: a static vector rendering with no WebGL and no animation. */
export function OrbitStatic({ count, selected }: { count: number; selected: number }) {
  const nodes = Array.from({ length: count }, (_, i) => {
    const t = (i / count) * Math.PI * 2 - Math.PI / 2;
    return [200 + Math.cos(t) * 165, 150 + Math.sin(t) * 70] as const;
  });
  return (
    <svg viewBox="0 0 400 300" className="size-full" aria-hidden>
      <g fill="none" strokeWidth="1">
        <ellipse cx="200" cy="150" rx="165" ry="70" className="stroke-info/40" />
        <ellipse cx="200" cy="150" rx="105" ry="38" className="stroke-accent/50" transform="rotate(-18 200 150)" />
        <ellipse cx="200" cy="150" rx="95" ry="34" className="stroke-info/40" transform="rotate(20 200 150)" />
        <circle cx="200" cy="150" r="46" className="stroke-primary/60" strokeDasharray="3 4" />
        {nodes.map(([x, y], i) => (
          <line key={i} x1="200" y1="150" x2={x} y2={y} className={i === selected ? "stroke-primary" : "stroke-info/20"} />
        ))}
      </g>
      <circle cx="200" cy="150" r="22" className="fill-primary/25" />
      {nodes.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i === selected ? 7 : 4} className={i === selected ? "fill-primary" : "fill-info/70"} />
      ))}
    </svg>
  );
}
