import type { ReactNode } from "react";
import { Archive, Search, UserKey } from "lucide-react";
import { Wordmark } from "@/components/layout/BrandMark";
import { Tumbler } from "@/components/ui/Tumbler";
import { cn } from "@/lib/utils/cn";
import type { DeviceKind } from "../types";

export function DemoHeader({ device, query = "", placeholder = "Search keys", focused = false, cart = 0, children }: { device: DeviceKind; query?: string; placeholder?: string; focused?: boolean; cart?: number; children?: ReactNode }) {
  const phone = device === "phone";
  return (
    <div className="shrink-0 border-b border-line bg-rig">
      <div className={cn("flex items-center gap-5", phone ? "h-14 px-4" : "h-16 px-6")}>
        <Wordmark className={cn("shrink-0 text-ink", phone ? "h-[17px] w-auto" : "h-[20px] w-auto")} ticks={!phone} />
        {phone ? <span className="flex-1" /> : null}
        <div
          data-demo="search"
          className={cn(
            "flex h-11 min-w-0 items-center gap-2.5 border bg-raised px-3.5 shadow-machined-pressed",
            phone ? "hidden" : "max-w-[560px] flex-1",
            focused ? "border-ink outline-2 outline-offset-2 outline-focus" : "border-control",
          )}
        >
          <Search size={18} aria-hidden="true" className="shrink-0 text-ink-muted" />
          <span className={cn("min-w-0 flex-1 truncate text-ui-md", query ? "text-ink" : "text-ink-subtle")}>
            {query || placeholder}
            {focused ? <span className="th-caret" /> : null}
          </span>
        </div>
        {phone ? null : <span className="flex-1" />}
        {phone ? null : (
          <span className="inline-flex items-center gap-2 text-ui-sm font-[560] text-ink">
            <UserKey size={18} aria-hidden="true" />
            Account
          </span>
        )}
        <span data-demo="cart" className="inline-flex items-center gap-2 text-ui-sm font-[560] text-ink">
          <Archive size={18} aria-hidden="true" />
          {phone ? null : "Cart"}
          {cart > 0 ? <Tumbler value={cart} size="xs" className="[&_.tumbler-slot]:bg-brand [&_.tumbler-slot]:text-on-brand" /> : null}
        </span>
      </div>
      {phone ? (
        <div className="px-4 pb-3">
          <div data-demo="search" className={cn("flex h-11 items-center gap-2.5 border bg-raised px-3.5 shadow-machined-pressed", focused ? "border-ink" : "border-control")}>
            <Search size={18} aria-hidden="true" className="shrink-0 text-ink-muted" />
            <span className={cn("min-w-0 flex-1 truncate text-ui-md", query ? "text-ink" : "text-ink-subtle")}>
              {query || placeholder}
              {focused ? <span className="th-caret" /> : null}
            </span>
          </div>
        </div>
      ) : null}
      {children}
    </div>
  );
}

export function DemoPage({ children, className, scroll }: { children: ReactNode; className?: string; scroll?: string }) {
  return (
    <div data-demo-scroll={scroll} className={cn("min-h-0 flex-1 overflow-hidden", className)}>
      {children}
    </div>
  );
}

export function DemoScreen({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex h-full flex-col bg-surface", className)}>{children}</div>;
}
