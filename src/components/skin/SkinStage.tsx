"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export type StageAspect = "4/3" | "16/10" | "3/4" | "1/1";

const ASPECT: Record<StageAspect, string> = {
  "4/3": "aspect-[4/3]",
  "16/10": "aspect-[16/10]",
  "3/4": "aspect-[3/4]",
  "1/1": "aspect-square",
};

export interface SkinStageProps {
  src?: string | null;
  alt: string;
  aspect?: StageAspect;
  sizes?: string;
  priority?: boolean;
  compact?: boolean;
  lamp?: boolean;
  follow?: boolean;
  className?: string;
  renderClassName?: string;
  viewTransition?: string;
  children?: ReactNode;
}

export function SkinStage({
  src,
  alt,
  aspect = "4/3",
  sizes,
  priority,
  compact = false,
  lamp = true,
  follow = true,
  className,
  renderClassName,
  viewTransition,
  children,
}: SkinStageProps) {
  const [failed, setFailed] = useState(false);
  const show = Boolean(src) && !failed;
  return (
    <div data-stage="" data-lamp={lamp ? "on" : "off"} data-lamp-follow={follow || undefined} className={cn("stage", ASPECT[aspect], className)}>
      {show ? (
        <>
          <span aria-hidden="true" className={cn("contact-shadow", compact && "h-1.5")} />
          <div data-render="" data-depth="3" className={cn("stage-render", renderClassName)} style={viewTransition ? { viewTransitionName: viewTransition } : undefined}>
            <Image
              src={src as string}
              alt={alt}
              fill
              priority={priority}
              sizes={sizes ?? (compact ? "120px" : "(min-width: 1280px) 340px, (min-width: 1024px) 30vw, 50vw")}
              className="object-contain"
              onError={() => setFailed(true)}
            />
          </div>
        </>
      ) : (
        <div className="absolute inset-0 z-[1] flex flex-col items-center justify-center gap-2 text-ink-muted">
          <ImageOff size={compact ? 16 : 24} aria-hidden="true" />
          {!compact ? <span className="eyebrow">No render</span> : null}
        </div>
      )}
      {children}
    </div>
  );
}

export function EmptyStage({ className, aspect = "4/3" }: { className?: string; aspect?: StageAspect }) {
  return <div aria-hidden="true" data-stage="" data-lamp="on" className={cn("stage rounded-tray", ASPECT[aspect], className)} />;
}
