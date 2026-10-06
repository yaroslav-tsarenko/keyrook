"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export type CoverAspect = "3/4" | "4/3" | "16/9" | "1/1";

const ASPECT: Record<CoverAspect, string> = {
  "3/4": "aspect-[3/4]",
  "4/3": "aspect-[4/3]",
  "16/9": "aspect-video",
  "1/1": "aspect-square",
};

export interface ProductCoverProps {
  src?: string | null;
  alt: string;
  aspect?: CoverAspect;
  sizes?: string;
  priority?: boolean;
  compact?: boolean;
  fit?: "cover" | "contain";
  className?: string;
  children?: ReactNode;
}

export function ProductCover({ src, alt, aspect = "3/4", sizes, priority, compact = false, fit = "cover", className, children }: ProductCoverProps) {
  const [failed, setFailed] = useState(false);
  const show = Boolean(src) && !failed;
  return (
    <div data-cover="" className={cn("cover", ASPECT[aspect], className)}>
      {show ? (
        <Image
          src={src as string}
          alt={alt}
          fill
          priority={priority}
          unoptimized
          sizes={sizes ?? (compact ? "120px" : "(min-width: 1280px) 300px, (min-width: 1024px) 25vw, 50vw")}
          className={fit === "cover" ? "object-cover" : "object-contain"}
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="absolute inset-0 z-[1] flex flex-col items-center justify-center gap-2 text-ink-muted">
          <ImageOff size={compact ? 16 : 24} aria-hidden="true" />
          {!compact ? <span className="eyebrow">Image unavailable</span> : null}
        </div>
      )}
      {children}
    </div>
  );
}
