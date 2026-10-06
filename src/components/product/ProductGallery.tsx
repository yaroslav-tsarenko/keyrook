"use client";

import { useState } from "react";
import Image from "next/image";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { ProductCover } from "./ProductCover";

export interface GalleryImage {
  url: string;
  alt: string | null;
}

export function ProductGallery({ images, title, videoId }: { images: GalleryImage[]; title: string; videoId: string | null }) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const cover = images[0] ?? null;
  const shots = images.slice(1);
  const active = images[index] ?? cover;

  return (
    <div data-gallery="" className="flex flex-col gap-4">
      <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4 max-sm:grid-cols-1">
        <ProductCover src={cover?.url ?? null} alt={cover?.alt || title} aspect="3/4" priority sizes="(min-width: 1024px) 280px, 60vw" className="rounded-tray max-sm:mx-auto max-sm:w-2/3" />
        <div className="flex min-w-0 flex-col gap-3">
          {playing && videoId ? (
            <div className="relative aspect-video overflow-hidden rounded-tray bg-stage">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`}
                title={`${title} video`}
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 size-full border-0"
              />
            </div>
          ) : active && index > 0 ? (
            <ProductCover src={active.url} alt={active.alt || title} aspect="16/9" sizes="(min-width: 1024px) 420px, 100vw" className="rounded-tray" />
          ) : shots[0] ? (
            <ProductCover src={shots[0].url} alt={shots[0].alt || title} aspect="16/9" sizes="(min-width: 1024px) 420px, 100vw" className="rounded-tray" />
          ) : null}
          {shots.length > 0 || videoId ? (
            <ul className="no-scrollbar m-0 flex list-none gap-2 overflow-x-auto p-0">
              {videoId ? (
                <li className="shrink-0">
                  <button
                    type="button"
                    onClick={() => setPlaying(true)}
                    aria-pressed={playing}
                    className={cn("flex h-14 w-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-control border bg-raised text-ui-xs font-semibold text-ink", playing ? "border-ink" : "border-line")}
                  >
                    <Play size={16} aria-hidden="true" />
                    Video
                  </button>
                </li>
              ) : null}
              {shots.map((shot, i) => (
                <li key={shot.url} className="shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setPlaying(false);
                      setIndex(i + 1);
                    }}
                    aria-label={`Show screenshot ${i + 1}`}
                    aria-pressed={!playing && (index === i + 1 || (index === 0 && i === 0))}
                    className={cn("relative block h-14 w-24 cursor-pointer overflow-hidden rounded-control border", !playing && (index === i + 1 || (index === 0 && i === 0)) ? "border-ink" : "border-line")}
                  >
                    <Image src={shot.url} alt="" fill unoptimized sizes="96px" className="object-cover" />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          {videoId && !playing ? <p className="m-0 text-ui-xs text-ink-muted">The video plays from YouTube when you select it.</p> : null}
        </div>
      </div>
    </div>
  );
}
