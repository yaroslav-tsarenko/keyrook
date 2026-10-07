import "@/styles/theater.css";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { sceneMeta, THEATER_COPY } from "./scenes/meta";
import { TheaterStage } from "./stage";
import { Poster } from "./still";
import { TheaterSteps, TheaterSync } from "./sync";
import type { SceneId, TheaterDevice } from "./types";

export type FeatureSpotlightProps = {
  scene: SceneId;
  title: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
  device?: TheaterDevice;
  headingLevel?: 2 | 3;
  headingId?: string;
  children?: ReactNode;
  className?: string;
};

export function FeatureSpotlight({ scene, title, description, eyebrow, device = "auto", headingLevel = 2, headingId, children, className }: FeatureSpotlightProps) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  const meta = sceneMeta(scene);
  return (
    <TheaterSync>
      <div className={cn("grid gap-x-16 gap-y-8 lg:grid-cols-12 lg:items-start", className)}>
        <div className="min-w-0 lg:col-span-5 lg:pt-4">
          {eyebrow ? <p className="eyebrow m-0 mb-4">{eyebrow}</p> : null}
          <Heading id={headingId} className="m-0 text-step-4 leading-[1.06] text-ink">
            {title}
          </Heading>
          {description ? <div className="mt-4 max-w-[52ch] text-step-1 leading-[1.5] text-ink-muted">{description}</div> : null}
          <TheaterSteps steps={meta.captions} className="mt-8" />
          {children ? <div className="mt-6">{children}</div> : null}
        </div>
        <div className="min-w-0 lg:col-span-7">
          <TheaterStage
            sceneId={scene}
            device={device}
            box={device}
            title={meta.summary}
            captions={meta.captions}
            external
            poster={<Poster device={device} address={{ label: meta.url }} />}
            labels={{ play: THEATER_COPY.play, pause: THEATER_COPY.pause, replay: THEATER_COPY.replay, sample: THEATER_COPY.sampleData, illustration: THEATER_COPY.illustration }}
          />
        </div>
      </div>
    </TheaterSync>
  );
}
