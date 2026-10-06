import type { CSSProperties, ReactNode, Ref } from "react";
import { Plate } from "@/components/ui/Plate";
import { cn } from "@/lib/utils/cn";
import { frameStyle, presetFor, type FrameVars } from "./engine/geometry";
import type { DeviceKind, SceneAddress } from "./types";

export type FrameProps = {
  device: DeviceKind | "auto";
  address: SceneAddress;
  sampleLabel?: string;
  vars?: FrameVars;
  frameRef?: Ref<HTMLDivElement>;
  contentRef?: Ref<HTMLDivElement>;
  overlay?: ReactNode;
  children: ReactNode;
};

export function Frame({ device, address, sampleLabel = "Sample data", vars, frameRef, contentRef, overlay, children }: FrameProps) {
  const auto = device === "auto" && !vars;
  const style = auto ? undefined : (frameStyle(vars ?? presetFor(device === "auto" ? "desktop" : device)) as CSSProperties);
  return (
    <div ref={frameRef} className="th-frame" data-auto={auto ? "" : undefined} style={style}>
      <div className="th-strip">
        <span className={cn("th-address", address.external && "th-address-external")} data-external={address.external || undefined}>
          <span className="truncate">{address.label}</span>
        </span>
        <Plate variant="neutral" size="sm" className="th-sample">
          {sampleLabel}
        </Plate>
      </div>
      <div className="th-screen">
        <div ref={contentRef} className="th-content">
          {children}
          {overlay}
        </div>
      </div>
    </div>
  );
}
