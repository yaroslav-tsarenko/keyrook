"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export type CoverAspect = "3/4" | "4/3" | "16/9" | "1/1" | "card";

const ASPECT: Record<CoverAspect, string> = {
  "3/4": "aspect-[3/4]",
  "4/3": "aspect-[4/3]",
  "16/9": "aspect-video",
  "1/1": "aspect-square",
  card: "aspect-[1.586/1]",
};

export const COVER_SIZES = {
  card: "(min-width: 1536px) 280px, (min-width: 1280px) 25vw, (min-width: 840px) 33vw, 50vw",
  pdp: "(min-width: 1024px) 560px, 90vw",
  row: "80px",
} as const;

export function portraitFit(width: number | null | undefined, height: number | null | undefined): "cover" | "contain" | null {
  if (!width || !height) return null;
  const ratio = width / height;
  return ratio >= 0.68 && ratio <= 0.82 ? "cover" : "contain";
}

export interface CoverProps {
  src?: string | null;
  alt: string;
  aspect?: CoverAspect;
  sizes?: string;
  priority?: boolean;
  compact?: boolean;
  fit?: "cover" | "contain" | "auto";
  width?: number | null;
  height?: number | null;
  platformLabel?: string | null;
  className?: string;
  imageClassName?: string;
  children?: ReactNode;
}

export function Cover({ src, alt, aspect = "3/4", sizes, priority, compact = false, fit = "auto", width, height, platformLabel, className, imageClassName, children }: CoverProps) {
  const [failed, setFailed] = useState(false);
  const known = portraitFit(width, height);
  const [measured, setMeasured] = useState<"cover" | "contain" | null>(null);
  const resolved = fit !== "auto" ? fit : known ?? measured ?? (aspect === "3/4" ? "cover" : "contain");
  const show = Boolean(src) && !failed;
  return (
    <div data-cover="" data-fit={show ? resolved : "empty"} className={cn("cover", ASPECT[aspect], className)}>
      {show ? (
        <Image
          src={src as string}
          alt={alt}
          fill
          priority={priority}
          unoptimized
          sizes={sizes ?? (compact ? COVER_SIZES.row : COVER_SIZES.card)}
          className={cn(resolved === "cover" ? "object-cover" : "object-contain", imageClassName)}
          onLoad={(e) => {
            if (fit !== "auto" || known) return;
            const img = e.currentTarget;
            const next = portraitFit(img.naturalWidth, img.naturalHeight);
            if (next && aspect === "3/4") setMeasured(next);
          }}
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="absolute inset-0 z-[1] flex flex-col items-center justify-center gap-2 px-2 text-center text-ink-muted">
          <ImageOff size={compact ? 16 : 24} aria-hidden="true" />
          {!compact && platformLabel ? <span className="eyebrow">{platformLabel}</span> : null}
        </div>
      )}
      {children}
    </div>
  );
}

export { Cover as ProductCover };
export type { CoverProps as ProductCoverProps };
