import "@/styles/theater.css";
import { enabledScenes, THEATER_COPY } from "./scenes/meta";
import { Poster } from "./still";
import { TheaterTabsClient } from "./tabs-client";
import type { SceneId, TheaterDevice } from "./types";

export type TheaterTabsProps = {
  scenes?: SceneId[];
  device?: TheaterDevice;
  label?: string;
  className?: string;
};

export function TheaterTabs({ scenes, device = "auto", label = THEATER_COPY.tabsLabel, className }: TheaterTabsProps) {
  const metas = enabledScenes().filter((m) => !scenes || scenes.includes(m.id));
  const first = metas[0];
  if (!first) return null;
  const tabs = metas.map((m) => ({ scene: m.id, label: m.label, title: m.summary, captions: m.captions, device, box: device }));
  return (
    <TheaterTabsClient
      tabs={tabs}
      label={label}
      className={className}
      labels={{ play: THEATER_COPY.play, pause: THEATER_COPY.pause, replay: THEATER_COPY.replay, sample: THEATER_COPY.sampleData, illustration: THEATER_COPY.illustration }}
      poster={<Poster device={device} address={{ label: first.url }} />}
    />
  );
}
