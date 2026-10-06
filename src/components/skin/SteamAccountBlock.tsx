"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Plate } from "@/components/ui/Plate";
import { cn } from "@/lib/utils/cn";
import type { SteamState } from "@/components/account/SteamDelivery/SteamDelivery";

export function steamTail(steamId64: string) {
  return `…${steamId64.slice(-4)}`;
}

export function SteamAccountBlock({
  steam,
  nextPath,
  showTradeStatus = true,
  tradeHref,
  action,
  className,
}: {
  steam: SteamState | null;
  nextPath: string;
  showTradeStatus?: boolean;
  tradeHref?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  if (!steam) {
    return (
      <div className={cn("flex flex-col items-start gap-3", className)}>
        <p className="m-0 text-step-0 text-ink">Link your Steam account so we can send skins to it.</p>
        <Button as="a" href={`/api/auth/steam?link=1&next=${encodeURIComponent(nextPath)}`} variant="steam">
          Sign in through Steam
        </Button>
        <p className="m-0 text-ui-sm text-ink-muted">You sign in on Steam&apos;s own page. We never see your Steam password or Steam Guard codes.</p>
      </div>
    );
  }
  const initials = (steam.personaName ?? "S").slice(0, 2).toUpperCase();
  return (
    <div data-steam-account="" className={cn("flex flex-wrap items-center gap-x-4 gap-y-3", className)}>
      {steam.avatar ? (
        <Image src={steam.avatar} alt="" width={40} height={40} unoptimized className="size-10 shrink-0 rounded-control bg-surface-1" />
      ) : (
        <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-control bg-surface-1 font-mono text-data text-ink">
          {initials}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="m-0 truncate text-ui-md font-semibold text-ink">{steam.personaName ?? "Steam user"}</p>
        <p className="m-0 font-mono text-[0.75rem] text-ink-muted">SteamID {steamTail(steam.steamId64)}</p>
      </div>
      {showTradeStatus ? (
        <div className="flex items-center gap-3">
          {steam.tradeUrlVerified ? (
            <Plate variant="success">Trade URL ready</Plate>
          ) : (
            <>
              <Plate variant="warning">Trade URL missing</Plate>
              {tradeHref ? (
                <Link href={tradeHref} className="text-ui-sm font-semibold text-ink underline decoration-1 underline-offset-4">
                  Add trade URL
                </Link>
              ) : null}
            </>
          )}
        </div>
      ) : null}
      {action}
    </div>
  );
}
