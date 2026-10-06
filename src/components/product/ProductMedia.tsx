"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, Play } from "lucide-react";
import { Modal } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";
import { Cover, COVER_SIZES, type CoverAspect } from "./Cover";

export interface GalleryImage {
  url: string;
  alt: string | null;
}

export function ProductMedia({ images, title, videoId, platformLabel, aspect = "3/4", parts = "all", className }: { images: GalleryImage[]; title: string; videoId: string | null; platformLabel?: string | null; aspect?: CoverAspect; parts?: "all" | "cover" | "strip"; className?: string }) {
  const cover = images[0] ?? null;
  const shots = images.slice(1);
  const [open, setOpen] = useState<number | null>(null);
  const [trailer, setTrailer] = useState(false);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") setOpen((i) => (i === null ? i : (i + 1) % shots.length));
      if (e.key === "ArrowLeft") setOpen((i) => (i === null ? i : (i - 1 + shots.length) % shots.length));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, shots.length]);

  return (
    <div data-gallery={parts} className={cn("flex flex-col gap-4", className)}>
      {parts !== "strip" ? (
        <div data-drawer-face="" className="plate p-2">
          <Cover src={cover?.url ?? null} alt={`${title} cover art`} aspect={aspect} priority sizes={COVER_SIZES.pdp} platformLabel={platformLabel} />
        </div>
      ) : null}
      {parts !== "cover" && (shots.length > 0 || videoId) ? (
        <div className="flex flex-col gap-3">
          {shots.length > 0 ? (
            <ul aria-label="Screenshots" className="no-scrollbar m-0 grid list-none auto-cols-[calc((100%-24px)/4)] grid-flow-col gap-2 overflow-x-auto p-0">
              {shots.map((shot, i) => (
                <li key={shot.url}>
                  <button type="button" onClick={() => setOpen(i)} aria-label={`Open screenshot ${i + 1} of ${shots.length}`} className="block w-full cursor-pointer bg-plate p-1 shadow-machined hover-device:hover:outline hover-device:hover:outline-1 hover-device:hover:outline-control">
                    <span className="cover relative block aspect-video">
                      <Image src={shot.url} alt="" fill unoptimized sizes="140px" className="object-cover" />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          {videoId ? (
            <Button variant="outline" size="sm" className="self-start" onPress={() => setTrailer(true)} startContent={<Play size={16} aria-hidden="true" />}>
              Watch trailer
            </Button>
          ) : null}
        </div>
      ) : null}

      <Modal open={open !== null} onClose={() => setOpen(null)} title={open !== null ? `${title} screenshot ${open + 1}` : ""} size="lg">
        {open !== null && shots[open] ? (
          <div className="flex flex-col gap-4">
            <div className="cover relative aspect-video">
              <Image src={shots[open].url} alt={`${title} screenshot ${open + 1}`} fill unoptimized sizes="720px" className="object-contain" />
            </div>
            <div className="flex items-center justify-between gap-4">
              <Button variant="ghost" onPress={() => setOpen((i) => (i === null ? i : (i - 1 + shots.length) % shots.length))} startContent={<ArrowLeft size={16} aria-hidden="true" />}>
                Previous
              </Button>
              <span className="font-mono text-data text-ink-muted">
                {open + 1} / {shots.length}
              </span>
              <Button variant="ghost" onPress={() => setOpen((i) => (i === null ? i : (i + 1) % shots.length))} endContent={<ArrowRight size={16} aria-hidden="true" />}>
                Next
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={trailer}
        onClose={() => {
          setTrailer(false);
          setPlaying(false);
        }}
        title={`${title} trailer`}
        size="lg"
      >
        <div className="cover relative aspect-video">
          {playing && videoId ? (
            <iframe src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`} title={`${title} trailer`} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen className="absolute inset-0 size-full border-0" />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
              <p className="m-0 max-w-[44ch] text-ui-md text-ink-muted">The trailer plays from YouTube. Nothing loads from YouTube until you press Play.</p>
              <Button onPress={() => setPlaying(true)} startContent={<Play size={18} aria-hidden="true" />}>
                Play trailer
              </Button>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
