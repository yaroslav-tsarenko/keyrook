import { useId, type SVGProps } from "react";
import { MONOGRAM_K, MONOGRAM_TICKS, WORDMARK } from "@/lib/brand-mark";

type MarkProps = Omit<SVGProps<SVGSVGElement>, "children"> & {
  title?: string;
};

export function Wordmark({ title, className, ticks = true, ...rest }: MarkProps & { ticks?: boolean }) {
  const maskId = `km${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const labelled = Boolean(title);
  const { width, height, letters, dial, index } = WORDMARK;
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role={labelled ? "img" : undefined}
      aria-label={labelled ? title : undefined}
      aria-hidden={labelled ? undefined : true}
      focusable="false"
      {...rest}
    >
      {ticks ? (
        <defs>
          <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width={width} height={height}>
            <rect width={width} height={height} fill="white" />
            <path d={WORDMARK.ticks} fill="black" />
          </mask>
        </defs>
      ) : null}
      <path d={letters} fill="currentColor" />
      <path d={dial} fill="currentColor" mask={ticks ? `url(#${maskId})` : undefined} />
      <rect x={index.x} y={index.y} width={index.width} height={index.height} fill="var(--color-accent)" />
    </svg>
  );
}

export function Monogram({ title, className, size, ...rest }: MarkProps & { size?: number }) {
  const labelled = Boolean(title);
  const tile = 512;
  const c = tile / 2;
  const r = tile * 0.39;
  const cap = tile * 0.34;
  const s = cap / MONOGRAM_K.cap;
  const kx = c + 4 - (MONOGRAM_K.width * s) / 2 - MONOGRAM_K.left * s;
  const ky = c + 6 - cap / 2;
  return (
    <svg
      viewBox={`0 0 ${tile} ${tile}`}
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role={labelled ? "img" : undefined}
      aria-label={labelled ? title : undefined}
      aria-hidden={labelled ? undefined : true}
      focusable="false"
      {...rest}
    >
      <rect width={tile} height={tile} fill="var(--color-surface-dark)" />
      {Array.from({ length: MONOGRAM_TICKS / 2 }, (_, i) => i).filter((i) => i > 0).map((i) => (
        <rect key={i} x={-2} y={-r} width={i % 5 === 0 ? 6 : 3} height={i % 5 === 0 ? 26 : 14} fill="var(--color-text-tertiary)" transform={`translate(${c} ${c}) rotate(${i * 7.2})`} />
      ))}
      <path d={MONOGRAM_K.path} fill="currentColor" transform={`translate(${kx} ${ky}) scale(${s})`} />
      <rect x={c - 6} y={c - r - 14} width={12} height={58} fill="var(--color-accent)" />
    </svg>
  );
}

export function BrandMark({ size = 28, className }: { size?: number; className?: string }) {
  return <Monogram size={size} className={className} />;
}
