"use client";

import { useState } from "react";
import { Check, Copy, Eye, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";

interface KeyEntry {
  id: string;
  revealed: boolean;
  type: string;
}

type Revealed = { value: string } | { error: string };

export function KeyVault({ keys, platformLabel, className }: { keys: KeyEntry[]; platformLabel: string | null; className?: string }) {
  const [shown, setShown] = useState<Record<string, Revealed>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  if (keys.length === 0) return null;

  const reveal = async (id: string) => {
    setBusy(id);
    try {
      const res = await fetch(`/api/account/keys/${encodeURIComponent(id)}`, { method: "POST", cache: "no-store" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || typeof body.key !== "string") throw new Error(res.status === 429 ? "Too many requests. Wait a minute and try again." : "We could not show this key. Contact us with your order number.");
      setShown((s) => ({ ...s, [id]: { value: body.key } }));
    } catch (err) {
      setShown((s) => ({ ...s, [id]: { error: err instanceof Error ? err.message : "We could not show this key." } }));
    } finally {
      setBusy(null);
    }
  };

  const copy = async (id: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(id);
      window.setTimeout(() => setCopied((c) => (c === id ? null : c)), 2000);
    } catch {
      setCopied(null);
    }
  };

  return (
    <div data-key-vault="" className={cn("flex flex-col gap-2", className)}>
      <p className="eyebrow m-0">{keys.length === 1 ? "Your key" : `Your keys (${keys.length})`}</p>
      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {keys.map((key, index) => {
          const state = shown[key.id];
          const value = state && "value" in state ? state.value : null;
          return (
            <li key={key.id} className="flex flex-wrap items-center gap-3 rounded-control border border-line bg-raised px-3 py-2">
              <KeyRound size={16} aria-hidden="true" className="shrink-0 text-ink-muted" />
              {value ? (
                <code data-key-value="" className="min-w-0 flex-1 select-all break-all font-mono text-data text-ink">
                  {value}
                </code>
              ) : (
                <span className="min-w-0 flex-1 text-ui-sm text-ink-muted">
                  Key {index + 1} {key.revealed ? "· revealed before" : "· hidden"}
                </span>
              )}
              {value ? (
                <Button size="sm" variant="outline" onPress={() => copy(key.id, value)} startContent={copied === key.id ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}>
                  {copied === key.id ? "Copied" : "Copy"}
                </Button>
              ) : (
                <Button size="sm" variant="outline" isLoading={busy === key.id} onPress={() => reveal(key.id)} startContent={<Eye size={16} aria-hidden="true" />}>
                  Reveal key
                </Button>
              )}
              {state && "error" in state ? <p className="m-0 w-full text-ui-sm text-danger">{state.error}</p> : null}
            </li>
          );
        })}
      </ul>
      <p className="m-0 text-ui-sm text-ink-muted">
        Keep your key private until you redeem it{platformLabel ? ` on ${platformLabel}` : ""}. Anyone who sees it can use it.
      </p>
    </div>
  );
}
