"use client";

import { useId, useState } from "react";
import { ArrowUpRight, Check, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { controlClass, controlErrorClass, dataInputClass, FieldError } from "@/components/ui/Field";
import { cn } from "@/lib/utils/cn";
import { parseTradeUrl, partnerIdFor } from "@/lib/steam";
import type { SteamState } from "@/components/account/SteamDelivery/SteamDelivery";

const STEAM_TRADE_URL_PAGE = "https://steamcommunity.com/id/me/tradeoffers/privacy#trade_offer_access_url";

export function maskToken(token: string | null | undefined) {
  if (!token) return "";
  return `••••••${token.slice(-4)}`;
}

export function savedTradeParts(url: string | null | undefined) {
  if (!url) return null;
  return parseTradeUrl(url);
}

export function TradeUrlField({
  steam,
  onSaved,
  saveLabel = "Save trade URL",
  autoSaveLabel,
  className,
}: {
  steam: SteamState;
  onSaved: (steam: SteamState) => void;
  saveLabel?: string;
  autoSaveLabel?: string;
  className?: string;
}) {
  const id = useId();
  const saved = savedTradeParts(steam.tradeUrl);
  const [editing, setEditing] = useState(!steam.tradeUrlVerified);
  const [draft, setDraft] = useState("");
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const parsed = draft.trim() ? parseTradeUrl(draft) : null;
  const ownPartner = partnerIdFor(steam.steamId64);
  const formatError = touched && draft.trim() && !parsed ? "This isn't a Steam trade URL. It starts with https://steamcommunity.com/tradeoffer/new/" : null;
  const mismatch = Boolean(parsed && parsed.partnerId !== ownPartner);
  const error = serverError ?? formatError ?? (mismatch ? "This trade URL belongs to a different Steam account. Use the trade URL of the account linked here." : null);

  const save = async () => {
    setTouched(true);
    if (!parsed || mismatch) return;
    setSaving(true);
    setServerError(null);
    try {
      const res = await fetch("/api/account/steam", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tradeUrl: draft.trim() }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setServerError(
          data.code === "TRADE_URL_OTHER_ACCOUNT"
            ? "This trade URL belongs to a different Steam account. Use the trade URL of the account linked here."
            : data.code === "TRADE_URL_INVALID"
              ? "This isn't a Steam trade URL. It starts with https://steamcommunity.com/tradeoffer/new/"
              : "We couldn't save the trade URL. Please try again.",
        );
        return;
      }
      onSaved(data.steam as SteamState);
      setEditing(false);
      setDraft("");
      setTouched(false);
      toast.success("Trade URL saved");
    } catch {
      setServerError("We couldn't save the trade URL. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!editing && saved) {
    return (
      <div data-trade-url="saved" className={cn("flex flex-col gap-3", className)}>
        <div className="grid gap-1 rounded-control bg-surface-1 px-4 py-3 font-mono text-data text-ink">
          <span className="flex flex-wrap justify-between gap-x-4">
            <span>partner {saved.partnerId}</span>
            <span className="inline-flex items-center gap-1.5 font-sans text-ui-sm text-success">
              <Check size={16} aria-hidden="true" />
              matches your Steam account
            </span>
          </span>
          <span>token {maskToken(saved.token)}</span>
        </div>
        <div>
          <Button size="sm" variant="outline" onPress={() => setEditing(true)}>
            Change trade URL
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form
      data-trade-url="edit"
      className={cn("flex flex-col gap-3", className)}
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <label htmlFor={`${id}-input`} className="text-ui-md font-semibold text-ink">
          Steam trade URL
        </label>
        <a href={STEAM_TRADE_URL_PAGE} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-ui-sm font-semibold text-ink decoration-1 underline-offset-4 hover-device:hover:underline">
          Find it in Steam
          <ArrowUpRight size={14} aria-hidden="true" />
        </a>
      </div>
      <input
        id={`${id}-input`}
        inputMode="url"
        autoComplete="off"
        spellCheck={false}
        placeholder="https://steamcommunity.com/tradeoffer/new/?partner=…&token=…"
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value);
          setServerError(null);
        }}
        onBlur={() => setTouched(true)}
        onPaste={() => setTouched(true)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : `${id}-readout`}
        className={cn(controlClass, dataInputClass, "h-12 px-3.5", error && controlErrorClass)}
      />
      {parsed && touched ? (
        <div id={`${id}-readout`} aria-live="polite" className="grid gap-1 rounded-control bg-surface-1 px-4 py-3 font-mono text-data text-ink">
          <span className="flex flex-wrap justify-between gap-x-4">
            <span>partner {parsed.partnerId}</span>
            {mismatch ? (
              <span className="inline-flex items-center gap-1.5 font-sans text-ui-sm text-danger">
                <TriangleAlert size={16} aria-hidden="true" />
                belongs to a different Steam account
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 font-sans text-ui-sm text-success">
                <Check size={16} aria-hidden="true" />
                matches your Steam account
              </span>
            )}
          </span>
          <span>token {maskToken(parsed.token)}</span>
        </div>
      ) : null}
      {error ? <FieldError id={`${id}-error`}>{error}</FieldError> : null}
      <div className="flex flex-wrap gap-3">
        <Button type="submit" isLoading={saving} isDisabled={!draft.trim() || mismatch}>
          {autoSaveLabel ?? saveLabel}
        </Button>
        {steam.tradeUrlVerified ? (
          <Button
            variant="ghost"
            onPress={() => {
              setEditing(false);
              setDraft("");
              setServerError(null);
            }}
          >
            Cancel
          </Button>
        ) : null}
      </div>
    </form>
  );
}
