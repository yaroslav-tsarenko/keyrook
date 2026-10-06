"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { Modal } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Switch } from "@/components/ui/Choice";
import { cn } from "@/lib/utils/cn";
import { COOKIE_CATEGORIES, COOKIE_TABLE, type CookieCategory } from "@/config/cookies";
import { onOpenCookieSettings, useConsent, writeConsent } from "@/lib/consent";

const bannerButton = cn(
  "label-caps inline-flex h-9 min-w-0 flex-1 cursor-pointer items-center justify-center whitespace-nowrap border border-control bg-plate px-2 text-[0.75rem] text-ink shadow-machined transition-colors duration-[120ms] touch-device:h-11",
  "hover-device:hover:border-ink hover-device:hover:bg-raised active:translate-y-px active:shadow-machined-pressed",
);

function CookieList({ category }: { category: CookieCategory }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const rows = COOKIE_TABLE[category];
  return (
    <div className="mt-3">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 text-ui-sm font-[560] text-ink decoration-1 underline-offset-4 hover-device:hover:underline"
      >
        {open ? "Hide cookies" : "Show cookies"}
        <ChevronDown size={16} aria-hidden="true" className={cn("transition-transform duration-[180ms]", open && "rotate-180")} />
      </button>
      <div id={`${id}-list`} inert={!open} className={cn("grid transition-[grid-template-rows] duration-[200ms] ease-[var(--ease-latch)]", open ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
        <div className="relative min-h-0 overflow-hidden">
          {rows.length === 0 ? (
            <p className="meta pt-2 text-ink-muted">None in use. We will list them here before any are added.</p>
          ) : (
            <div className="pt-2">
              <table className="w-full table-fixed border-collapse text-left text-ui-sm">
                <thead>
                  <tr className="border-b border-rule text-ink-muted">
                    <th scope="col" className="eyebrow w-[32%] py-2 pr-3">Name</th>
                    <th scope="col" className="eyebrow w-[18%] py-2 pr-3 max-sm:hidden">Provider</th>
                    <th scope="col" className="eyebrow py-2 pr-3">Purpose</th>
                    <th scope="col" className="eyebrow w-[20%] py-2">Expiry</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.name} className="border-b border-line align-top">
                      <td className="py-2 pr-3 font-mono text-[0.75rem] text-ink [overflow-wrap:anywhere]">
                        {row.name}
                        <span className="block font-sans text-ink-muted">{row.kind}</span>
                      </td>
                      <td className="py-2 pr-3 text-ink max-sm:hidden">{row.provider}</td>
                      <td className="py-2 pr-3 text-ink">{row.purpose}</td>
                      <td className="py-2 text-ink">{row.expiry}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function CookieConsent() {
  const { consent, ready } = useConsent();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [draft, setDraft] = useState({ analytics: false, marketing: false });

  useEffect(
    () =>
      onOpenCookieSettings(() => {
        const current = consent ?? { analytics: false, marketing: false };
        setDraft({ analytics: current.analytics, marketing: current.marketing });
        setSettingsOpen(true);
      }),
    [consent],
  );

  const openSettings = () => {
    setDraft({ analytics: consent?.analytics ?? false, marketing: consent?.marketing ?? false });
    setSettingsOpen(true);
  };

  const decide = (choice: { analytics: boolean; marketing: boolean }) => {
    writeConsent(choice);
    setSettingsOpen(false);
  };

  const showBanner = ready && !consent && !settingsOpen;

  return (
    <>
      {showBanner ? (
        <section
          role="region"
          aria-label="Cookie consent"
          data-print-hide=""
          data-cookie-banner=""
          className="fixed bottom-[calc(var(--sticky-bar-offset,0px)+16px)] left-4 right-4 z-90 animate-rise-in border border-line bg-raised p-5 text-ink shadow-lg sm:right-auto sm:w-[420px]"
        >
          <div className="flex flex-col gap-4">
            <p className="m-0 text-ui-md leading-[1.5]">
              We use necessary cookies to run the store. Analytics and marketing cookies load only if you allow them.{" "}
              <Link href="/policies/cookies" className="font-[560] text-ink underline decoration-1 underline-offset-4">
                Cookie policy
              </Link>
            </p>
            <div className="flex w-full gap-2">
              <button type="button" className={bannerButton} onClick={() => decide({ analytics: true, marketing: true })}>
                Accept all
              </button>
              <button type="button" className={bannerButton} onClick={() => decide({ analytics: false, marketing: false })}>
                Reject all
              </button>
              <button type="button" className={bannerButton} onClick={openSettings}>
                Customise
              </button>
            </div>
          </div>
        </section>
      ) : null}

      <Modal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        title="Cookie settings"
        description="Choose which optional cookies we may use. You can change this at any time from the footer."
        footer={
          <div className="flex w-full flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
            <Button variant="outline" onPress={() => decide({ analytics: false, marketing: false })}>
              Reject all
            </Button>
            <Button variant="outline" onPress={() => decide({ analytics: true, marketing: true })}>
              Accept all
            </Button>
            <Button variant="primary" onPress={() => decide(draft)}>
              Save choices
            </Button>
          </div>
        }
      >
        <div className="border-t border-line">
          {COOKIE_CATEGORIES.map((category) => {
            const locked = category.id === "necessary";
            const checked = locked ? true : draft[category.id as "analytics" | "marketing"];
            return (
              <div key={category.id} className="border-b border-line py-5">
                <Switch
                  label={category.title}
                  description={category.purpose}
                  checked={checked}
                  disabled={locked}
                  lockedText={locked ? "Always on" : undefined}
                  onChange={(next) => setDraft((d) => ({ ...d, [category.id]: next }))}
                />
                <CookieList category={category.id} />
              </div>
            );
          })}
        </div>
      </Modal>
    </>
  );
}
