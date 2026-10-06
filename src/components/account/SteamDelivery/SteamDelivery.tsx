"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { SkeletonBar } from "@/components/ui/ReadoutLoader";
import { STORE_POLICY } from "@/config/store-policy";
import { cn } from "@/lib/utils/cn";
import { SteamAccountBlock } from "@/components/skin/SteamAccountBlock";
import { TradeUrlField } from "@/components/skin/TradeUrlField";

export interface SteamState {
  steamId64: string;
  personaName: string | null;
  avatar: string | null;
  profileUrl: string | null;
  tradeUrl: string | null;
  tradeUrlVerified: boolean;
  tradeUrlUpdatedAt: string | null;
}

export function useSteamAccount(enabled = true) {
  const [steam, setSteam] = useState<SteamState | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [failed, setFailed] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    fetch("/api/account/steam", { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as { steam: SteamState | null };
        if (!cancelled) {
          setSteam(data.steam);
          setFailed(false);
        }
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [enabled, tick]);

  const reload = useCallback(() => {
    setLoading(true);
    setTick((n) => n + 1);
  }, []);

  return { steam, setSteam, loading, failed, reload };
}

export interface SteamDeliveryProps {
  nextPath: string;
  steam: SteamState | null;
  loading: boolean;
  failed?: boolean;
  onSaved: (steam: SteamState) => void;
  onRetry?: () => void;
  headingLevel?: 2 | 3;
  showRequirements?: boolean;
  className?: string;
}

export function SteamDelivery({ nextPath, steam, loading, failed, onSaved, onRetry, headingLevel = 2, showRequirements = true, className }: SteamDeliveryProps) {
  const Heading = `h${headingLevel}` as "h2" | "h3";

  if (loading) {
    return (
      <div className={cn("flex flex-col gap-3", className)} aria-busy="true">
        <SkeletonBar className="w-1/2" />
        <SkeletonBar className="w-3/4" />
      </div>
    );
  }

  if (failed) {
    return (
      <Alert
        tone="danger"
        title="We couldn't load your Steam details"
        className={className}
        action={
          onRetry ? (
            <Button size="sm" variant="outline" onPress={onRetry}>
              Try again
            </Button>
          ) : undefined
        }
      >
        Check your connection and try again.
      </Alert>
    );
  }

  return (
    <div data-steam-delivery="" className={cn("flex flex-col gap-8", className)}>
      <section className="flex flex-col gap-3">
        <Heading className="eyebrow m-0">Linked Steam account</Heading>
        <SteamAccountBlock steam={steam} nextPath={nextPath} />
      </section>
      {steam ? (
        <section className="flex flex-col gap-3 border-t border-line pt-6">
          <Heading className="eyebrow m-0">Trade URL</Heading>
          <TradeUrlField steam={steam} onSaved={onSaved} />
        </section>
      ) : null}
      {showRequirements ? (
        <section className="flex flex-col gap-3 border-t border-line pt-6">
          <Heading className="eyebrow m-0">Your Steam account needs</Heading>
          <ul className="m-0 list-none border-t border-line p-0">
            {STORE_POLICY.delivery.requirements.map((r) => (
              <li key={r} className="border-b border-line py-2.5 text-ui-md text-ink first-letter:uppercase">
                {r}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
