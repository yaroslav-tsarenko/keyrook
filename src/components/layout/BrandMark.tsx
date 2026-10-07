import type { SVGProps } from "react";
import { LOCKUP, MARK, WORDMARK } from "@/lib/brand-mark";

type MarkProps = Omit<SVGProps<SVGSVGElement>, "children"> & {
  title?: string;
};

type Detail = "full" | "small" | "tiny";

function a11y(title?: string) {
  return title ? { role: "img" as const, "aria-label": title } : { "aria-hidden": true as const };
}

function MarkShape({ detail = "full" }: { detail?: Detail }) {
  const { path, lamp } = MARK[detail];
  return (
    <>
      <path d={path} fill="currentColor" fillRule="evenodd" />
      <circle cx={lamp.cx} cy={lamp.cy} r={lamp.r} fill="var(--color-accent)" />
    </>
  );
}

export function Mark({ title, className, detail = "full", ...rest }: MarkProps & { detail?: Detail }) {
  return (
    <svg viewBox={`0 0 ${MARK.size} ${MARK.size}`} xmlns="http://www.w3.org/2000/svg" className={className} focusable="false" {...a11y(title)} {...rest}>
      <MarkShape detail={detail} />
    </svg>
  );
}

export function Wordmark({ title, className, mark = true, detail = "full", ...rest }: MarkProps & { mark?: boolean; detail?: Detail }) {
  const cap = WORDMARK.cap;
  if (!mark) {
    return (
      <svg viewBox={`0 0 ${WORDMARK.width} ${cap + WORDMARK.descender}`} xmlns="http://www.w3.org/2000/svg" className={className} focusable="false" {...a11y(title)} {...rest}>
        <path d={WORDMARK.letters} fill="currentColor" />
      </svg>
    );
  }
  const size = LOCKUP.markToCap * cap;
  const top = (cap - size) / 2;
  const gap = LOCKUP.gapToCap * cap;
  return (
    <svg viewBox={`0 ${top} ${size + gap + WORDMARK.width} ${size}`} xmlns="http://www.w3.org/2000/svg" className={className} focusable="false" {...a11y(title)} {...rest}>
      <g transform={`translate(0 ${top}) scale(${size / MARK.size})`}>
        <MarkShape detail={detail} />
      </g>
      <path d={WORDMARK.letters} fill="currentColor" transform={`translate(${size + gap} 0)`} />
    </svg>
  );
}
