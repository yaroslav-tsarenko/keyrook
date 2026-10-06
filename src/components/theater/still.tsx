import { urlFor } from "./define";
import { Frame } from "./frame";
import type { AnyScene, DeviceKind, SceneAddress } from "./types";

export type BoxKind = "desktop" | "phone" | "auto";

export function Still({ scene, device, state }: { scene: AnyScene; device: DeviceKind | "auto"; state: Record<string, unknown> }) {
  const View = scene.View;
  return (
    <Frame device={device} address={urlFor(scene, state)}>
      <View s={state} device={device === "auto" ? scene.device : device} focus={null} />
    </Frame>
  );
}

function Bar({ className }: { className: string }) {
  return <span className={`block bg-surface-1 ${className}`} />;
}

export function Poster({ address, device }: { address: SceneAddress; device: DeviceKind | "auto" }) {
  return (
    <Frame device={device} address={address}>
      <div className="flex h-full flex-col gap-6 bg-surface p-8">
        <Bar className="h-11 w-full max-w-[520px]" />
        <div className="grid flex-1 grid-cols-2 gap-4 @3xl:grid-cols-3">
          <span className="plate block" />
          <span className="plate block" />
          <span className="plate hidden @3xl:block" />
        </div>
        <Bar className="h-5 w-2/5" />
      </div>
    </Frame>
  );
}
