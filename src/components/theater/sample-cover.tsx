function seedOf(text: string): number {
  let h = 2166136261;
  for (const ch of text) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
}

export function SampleCover({ title, compact = false }: { title: string; compact?: boolean }) {
  const seed = seedOf(title);
  const pair = (seed % 6) + 1;
  const a = `var(--sample-${pair}-a)`;
  const b = `var(--sample-${pair}-b)`;
  const layout = (seed >>> 3) % 3;
  const words = title.split(" ");
  return (
    <svg viewBox="0 0 300 400" preserveAspectRatio="xMidYMid slice" className="block h-full w-full" aria-hidden="true">
      <rect width="300" height="400" fill={a} />
      {layout === 0 ? (
        <>
          <circle cx="210" cy="150" r="118" fill={b} />
          <rect x="0" y="262" width="300" height="34" fill={b} opacity="0.55" />
        </>
      ) : layout === 1 ? (
        <>
          <rect x="34" y="40" width="150" height="230" fill={b} />
          <circle cx="226" cy="246" r="58" fill={a} stroke={b} strokeWidth="14" />
        </>
      ) : (
        <>
          <path d="M0 300 L150 120 L300 300 Z" fill={b} />
          <circle cx="78" cy="96" r="40" fill={b} opacity="0.7" />
        </>
      )}
      {compact ? null : (
        <text x="22" y={layout === 2 ? 352 : 340} fill="var(--sample-ink)" style={{ fontFamily: "var(--font-display)", fontStretch: "125%", fontWeight: 760, fontSize: 26, letterSpacing: "-0.01em" }}>
          {words.map((w, i) => (
            <tspan key={w + i} x="22" dy={i === 0 ? 0 : 28}>
              {w.toUpperCase()}
            </tspan>
          ))}
        </text>
      )}
    </svg>
  );
}
