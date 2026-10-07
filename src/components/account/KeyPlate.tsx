"use client";

import { useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { Copy, CopyCheck, Eye, EyeOff, MessageSquareWarning, SquareArrowOutUpRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/Button";
import { Plate } from "@/components/ui/Plate";
import { Lamp, Bolts } from "@/components/ui/Lamp";
import { DialLoader } from "@/components/ui/Dial";
import { Modal } from "@/components/ui/Dialog";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Alert";
import { LabelRow, productFace } from "@/components/product/ProductCard";
import { ActivationStepList } from "@/components/product/ActivationSteps";
import { activationFor } from "@/config/activation";
import { STORE_POLICY } from "@/config/store-policy";
import { useAuth } from "@/providers/AuthProvider";
import type { KeySummary } from "@/lib/keys/taxonomy";
import { runDecrypt } from "@/lib/motion/decrypt";
import { decryptGlyph } from "@/lib/keys/decrypt";

export type KeyPlateStatus = "issuing" | "ready" | "reported" | "replaced" | "refunded";

const MASKS: Record<string, number[]> = {
  xbox: [5, 5, 5, 5, 5],
  playstation: [4, 4, 4],
  nintendo: [4, 4, 4, 4],
};

const SEPARATOR = /[-–—\s]/;

function maskFor(platform: string | null | undefined): string {
  const groups = MASKS[platform ?? ""] ?? [5, 5, 5];
  return groups.map((n) => "•".repeat(n)).join("-");
}

function groupsOf(value: string): string[][] {
  const groups: string[][] = [];
  let current: string[] = [];
  for (const ch of Array.from(value)) {
    if (SEPARATOR.test(ch)) {
      if (current.length) groups.push(current);
      groups.push([ch]);
      current = [];
    } else current.push(ch);
  }
  if (current.length) groups.push(current);
  return groups;
}

export function spellOut(value: string): string {
  return Array.from(value)
    .map((ch) => {
      if (SEPARATOR.test(ch)) return ch === " " ? "(space)" : "–";
      if (ch === "0") return "zero";
      if (ch === "O") return "O(letter)";
      if (ch === "1") return "one";
      if (ch === "I") return "I(letter)";
      if (ch === "l") return "l(lower L)";
      if (/[a-z]/.test(ch)) return `${ch}(lower)`;
      return ch;
    })
    .join(" ");
}

export function KeySlots({ value, masked, progress, className, demoId }: { value: string; masked: boolean; progress?: number; className?: string; demoId?: string }) {
  const groups = groupsOf(value);
  const decrypting = !masked && progress !== undefined && progress < 1;
  let index = 0;
  return (
    <div data-key-slots="" data-demo={demoId} aria-hidden="true" className={cn("flex flex-wrap items-center gap-y-2 key-code text-key", className)}>
      {groups.map((group, gi) =>
        group.length === 1 && SEPARATOR.test(group[0]) ? (
          <span key={`s${gi}`} className="px-1 font-mono text-ink-muted sm:px-1.5">
            {group[0] === " " ? " " : "–"}
          </span>
        ) : (
          <span key={`g${gi}`} className="inline-flex">
            {group.map((ch) => {
              const i = index++;
              const glyph = decrypting ? decryptGlyph(value, valueIndex(groups, gi, i), progress) : null;
              return (
                <span
                  key={i}
                  data-slot={i}
                  data-char={masked ? undefined : ch}
                  data-phase={glyph?.phase}
                  className={cn("tumbler-slot", (masked || glyph?.phase === "masked" || glyph?.phase === "scramble") && "text-ink-muted", glyph?.phase === "settled" && "text-accent-ink")}
                >
                  {glyph ? glyph.char : ch}
                </span>
              );
            })}
          </span>
        ),
      )}
    </div>
  );
}

function valueIndex(groups: string[][], groupIndex: number, slotIndex: number): number {
  let seen = 0;
  let position = 0;
  for (let g = 0; g < groups.length; g++) {
    const group = groups[g];
    const separator = group.length === 1 && SEPARATOR.test(group[0]);
    if (separator) {
      position += 1;
      continue;
    }
    if (g === groupIndex) return position + (slotIndex - seen);
    seen += group.length;
    position += group.length;
  }
  return position;
}

function stamp(iso: string | null | undefined) {
  if (!iso) return null;
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}

const STATUS_TAG: Record<KeyPlateStatus, { label: string; variant: "success" | "warning" | "info" | "neutral" } | null> = {
  issuing: null,
  ready: { label: "Ready", variant: "success" },
  reported: { label: "Reported", variant: "warning" },
  replaced: { label: "Replaced", variant: "info" },
  refunded: { label: "Refunded", variant: "neutral" },
};

const REASONS = ["Already redeemed", "Invalid key", "Wrong region", "Wrong product", "Other"];

export interface KeyPlateProps {
  keyId: string;
  title: string;
  productSlug?: string | null;
  keyInfo?: KeySummary | null;
  index?: number;
  total?: number;
  status: KeyPlateStatus;
  keyType?: string;
  revealedBefore?: boolean;
  issuedAt?: string | null;
  revealedAt?: string | null;
  orderNumber?: string;
  activationNotes?: string[];
  refundedAt?: string | null;
  demo?: boolean;
  justIssued?: boolean;
  demoValue?: string;
  demoState?: { masked: boolean; decrypt: number; copied: boolean };
  className?: string;
  children?: ReactNode;
}

type Revealed = { value: string; type: string; revealedAt: string | null };

export function KeyPlate({
  keyId,
  title,
  productSlug,
  keyInfo,
  index,
  total,
  status,
  keyType = "text",
  revealedBefore = false,
  issuedAt,
  revealedAt,
  orderNumber,
  activationNotes = [],
  refundedAt,
  demo = false,
  justIssued = false,
  demoValue,
  demoState,
  className,
}: KeyPlateProps) {
  const face = productFace(title, keyInfo ?? null);
  const guide = activationFor(keyInfo?.platform);
  const { user } = useAuth();
  const baseId = useId();
  const copyRef = useRef<HTMLButtonElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const plateRef = useRef<HTMLElement>(null);
  const decryptNext = useRef(false);
  const [revealed, setRevealed] = useState<Revealed | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<"ok" | "failed" | null>(null);
  const [announce, setAnnounce] = useState("");
  const [open, setOpen] = useState<"steps" | "notes" | "spell" | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [reported, setReported] = useState(status === "reported");
  const firstReveal = revealed?.revealedAt ?? revealedAt ?? null;
  const effective: KeyPlateStatus = reported && status === "ready" ? "reported" : status;
  const tag = STATUS_TAG[effective];
  const controlled = demo && demoState ? demoState : null;
  const masked = controlled ? controlled.masked : !revealed;
  const value = controlled ? (controlled.masked ? "" : (demoValue ?? "")) : (revealed?.value ?? "");
  const copyState = controlled ? (controlled.copied ? "ok" : null) : copied;
  const pin = /\bPIN[:\s]+(\S+)/i.exec(value);
  const code = pin ? value.slice(0, pin.index).replace(/[\s:,;-]+(code)?$/i, "").replace(/^code[:\s]+/i, "").trim() : value;

  useLayoutEffect(() => {
    if (!revealed || !decryptNext.current) return;
    decryptNext.current = false;
    const slots = Array.from(plateRef.current?.querySelectorAll<HTMLElement>("[data-key-slots] [data-slot]") ?? []);
    return runDecrypt(slots, () => copyRef.current?.focus());
  }, [revealed]);

  const reveal = async () => {
    if (demo) {
      setRevealed({ value: demoValue ?? "", type: "text", revealedAt: null });
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/account/keys/${encodeURIComponent(keyId)}`, { method: "POST", cache: "no-store" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || typeof body.key !== "string") throw new Error(res.status === 429 ? "Too many requests. Wait a minute and try again." : "We couldn't show this key. Contact us with your order number.");
      decryptNext.current = true;
      setRevealed({ value: body.key, type: typeof body.type === "string" ? body.type : keyType, revealedAt: typeof body.revealedAt === "string" ? body.revealedAt : null });
      setAnnounce("Key revealed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't show this key.");
    } finally {
      setBusy(false);
    }
  };

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied("ok");
      setAnnounce("Key copied");
      window.setTimeout(() => setCopied((c) => (c === "ok" ? null : c)), 2000);
    } catch {
      setCopied("failed");
      const node = textRef.current;
      if (node) {
        node.classList.remove("sr-only");
        const range = document.createRange();
        range.selectNodeContents(node);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
    }
  };

  const isImage = (revealed?.type ?? keyType) === "image" || /^data:image\//.test(value);

  return (
    <article
      ref={plateRef}
      data-key-plate=""
      data-decrypt=""
      data-issued={justIssued ? "" : undefined}
      data-state={masked ? "masked" : "revealed"}
      data-status={effective}
      data-platform={face.tone}
      className={cn("plate bolted steel-grain relative w-full max-w-[760px] p-4 sm:p-7", effective === "refunded" && "bg-surface-1 [background-image:none]", className)}
    >
      <Bolts size={8} />
      <p aria-live="polite" className="sr-only">
        {announce}
      </p>
      <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-2">
        <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2">
          {total && total > 1 && index ? (
            <span className="eyebrow">
              Key {index} of {total}
            </span>
          ) : null}
          <LabelRow face={face} />
        </div>
        {tag ? (
          <Plate variant={tag.variant} size="sm">
            {tag.label}
          </Plate>
        ) : null}
      </header>

      <h3 className="m-0 mt-3 px-2 font-sans text-step-1 font-[640] leading-[1.3] tracking-normal text-ink [font-stretch:100%]">
        {productSlug && !demo ? (
          <Link href={`/product/${productSlug}`} className="underline-offset-4 hover-device:hover:underline">
            {face.title}
          </Link>
        ) : (
          face.title
        )}
      </h3>

      <div className="mt-5 px-2">
        {effective === "issuing" ? (
          <div className="flex flex-col gap-3">
            <KeySlots value={maskFor(keyInfo?.platform).replace(/•/g, " ")} masked />
            <p className="m-0 flex items-center gap-3 text-ui-md text-ink-muted">
              <DialLoader label="Issuing your key" />
              Usually within minutes after payment is confirmed.
            </p>
          </div>
        ) : effective === "refunded" ? (
          <p className="m-0 text-ui-md text-ink">Refunded to your card{refundedAt ? ` on ${stamp(refundedAt)}` : ""}.</p>
        ) : isImage && revealed ? (
          <div className="flex flex-col gap-3">
            <div className="cover relative aspect-[16/9] max-w-[480px]">
              <Image src={value} alt={`Key image for ${face.title}`} fill unoptimized sizes="480px" className="object-contain" />
            </div>
            <div className="flex flex-wrap gap-3">
              <Button as="a" href={value} target="_blank" rel="noopener noreferrer" variant="outline" size="sm">
                Open full size
              </Button>
              <Button as="a" href={value} download={true} variant="outline" size="sm">
                Download image
              </Button>
            </div>
          </div>
        ) : pin && revealed ? (
          <dl className="m-0 flex flex-col gap-4">
            {[
              ["Code", code],
              ["PIN", pin[1]],
            ].map(([label, part]) => (
              <div key={label} className="flex flex-wrap items-center gap-4">
                <dt className="eyebrow w-12">{label}</dt>
                <dd className="m-0 flex flex-wrap items-center gap-3">
                  <KeySlots value={part} masked={false} />
                  <Button variant="outline" size="sm" onPress={() => copy(part)} startContent={<Copy size={16} aria-hidden="true" />}>
                    Copy {label === "PIN" ? "PIN" : "code"}
                  </Button>
                </dd>
              </div>
            ))}
          </dl>
        ) : (
          <>
            <KeySlots value={masked ? maskFor(keyInfo?.platform) : value} masked={masked} progress={controlled && !controlled.masked ? controlled.decrypt : undefined} demoId={demo ? "key" : undefined} />
            {revealed ? (
              <span ref={textRef} className="sr-only key-code">
                {value}
              </span>
            ) : (
              <span className="sr-only">Key hidden. Choose Reveal key to show it.</span>
            )}
          </>
        )}
      </div>

      {effective === "ready" || effective === "reported" ? (
        <div className="mt-6 flex flex-wrap items-center gap-3 px-2">
          {masked ? (
            <Button onPress={reveal} isLoading={busy} startContent={<Eye size={18} aria-hidden="true" />} data-demo={demo ? "reveal" : undefined}>
              Reveal key
            </Button>
          ) : (
            <>
              {!isImage && !pin ? (
                <Button ref={copyRef} variant="outline" onPress={() => copy(value)} startContent={copyState === "ok" ? <CopyCheck size={18} aria-hidden="true" /> : <Copy size={18} aria-hidden="true" />} data-demo={demo ? "copy" : undefined}>
                  {copyState === "ok" ? "Copied" : "Copy key"}
                </Button>
              ) : null}
              {guide?.redeemUrl ? (
                <Button as="a" href={guide.redeemUrl} target="_blank" rel="noopener noreferrer" variant="outline" endContent={<SquareArrowOutUpRight size={16} aria-hidden="true" />} data-demo={demo ? "redeem" : undefined}>
                  Redeem on {guide.name}
                </Button>
              ) : null}
              <Button variant="ghost" onPress={() => setRevealed(null)} startContent={<EyeOff size={18} aria-hidden="true" />}>
                Hide
              </Button>
            </>
          )}
        </div>
      ) : null}
      {copied === "failed" ? <p className="m-0 mt-2 px-2 text-ui-sm text-ink-muted">Press Ctrl+C / ⌘C to copy.</p> : null}
      {error ? (
        <Alert tone="danger" className="mx-2 mt-4">
          {error}
        </Alert>
      ) : null}
      {effective === "reported" ? (
        <p className="m-0 mt-4 flex items-center gap-2 px-2 text-ui-md text-ink">
          <Lamp on={false} />
          We’re checking it. We reply {STORE_POLICY.support.replyTime}.
        </p>
      ) : null}

      {issuedAt || firstReveal ? (
        <p className="m-0 mt-5 px-2 font-mono text-[0.75rem] text-ink-muted">
          {[issuedAt ? `Issued ${stamp(issuedAt)}` : null, firstReveal ? `First revealed ${stamp(firstReveal)}` : revealedBefore ? "Revealed before" : null].filter(Boolean).join(" · ")}
        </p>
      ) : null}

      {effective !== "issuing" && effective !== "refunded" ? (
        <div className="mt-5 border-t border-line px-2 pt-3">
          <div className="flex flex-wrap gap-x-6 gap-y-1">
            {guide ? (
              <button type="button" aria-expanded={open === "steps"} aria-controls={`${baseId}-steps`} onClick={() => setOpen((o) => (o === "steps" ? null : "steps"))} className="btn-text min-h-10 cursor-pointer text-ui-sm font-[560] text-ink">
                <span data-label="">How to redeem on {guide.name}</span>
              </button>
            ) : null}
            {activationNotes.length ? (
              <button type="button" aria-expanded={open === "notes"} aria-controls={`${baseId}-notes`} onClick={() => setOpen((o) => (o === "notes" ? null : "notes"))} className="btn-text min-h-10 cursor-pointer text-ui-sm font-[560] text-ink">
                <span data-label="">Activation notes from the publisher</span>
              </button>
            ) : null}
            {revealed && !isImage ? (
              <button type="button" aria-expanded={open === "spell"} aria-controls={`${baseId}-spell`} onClick={() => setOpen((o) => (o === "spell" ? null : "spell"))} className="btn-text min-h-10 cursor-pointer text-ui-sm font-[560] text-ink">
                <span data-label="">Spell it out</span>
              </button>
            ) : null}
          </div>
          {open === "steps" && guide ? (
            <div id={`${baseId}-steps`} className="pb-2 pt-2">
              <p className="m-0 mb-2 text-ui-sm text-ink-muted">You need {guide.need}.</p>
              <ActivationStepList guide={guide} size="sm" />
            </div>
          ) : null}
          {open === "notes" ? (
            <div id={`${baseId}-notes`} className="flex flex-col gap-2 pb-2 pt-2 text-ui-sm text-ink">
              {activationNotes.map((n, i) => (
                <p key={i} className="m-0 whitespace-pre-line">
                  {n}
                </p>
              ))}
            </div>
          ) : null}
          {open === "spell" && revealed ? (
            <p id={`${baseId}-spell`} className="m-0 pb-2 pt-2 font-mono text-data leading-[1.8] text-ink [font-feature-settings:'calt'_0]">
              {spellOut(value)}
            </p>
          ) : null}
          {effective === "ready" ? (
            <button type="button" onClick={() => (demo ? undefined : setReportOpen(true))} data-demo={demo ? "report" : undefined} className="btn-text mt-1 inline-flex min-h-10 cursor-pointer items-center gap-2 text-ui-sm font-[560] text-ink-muted hover-device:hover:text-ink">
              <MessageSquareWarning size={16} aria-hidden="true" />
              <span data-label="">Key not working? Report it</span>
            </button>
          ) : null}
        </div>
      ) : null}

      {!demo ? (
        <ReportDialog
          open={reportOpen}
          onClose={() => setReportOpen(false)}
          onSent={() => {
            setReported(true);
            setReportOpen(false);
          }}
          title={face.title}
          keyId={keyId}
          orderNumber={orderNumber ?? ""}
          name={[user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.name || ""}
          email={user?.email ?? ""}
        />
      ) : null}
    </article>
  );
}

function ReportDialog({ open, onClose, onSent, title, keyId, orderNumber, name, email }: { open: boolean; onClose: () => void; onSent: () => void; title: string; keyId: string; orderNumber: string; name: string; email: string }) {
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const send = async () => {
    if (!reason) {
      setError("Choose what happened.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name || email,
          email,
          orderNumber,
          subject: "Key not working",
          message: [`Reason: ${reason}.`, `Product: ${title}.`, `Key reference: ${keyId}.`, note.trim() ? `Note: ${note.trim()}` : null].filter(Boolean).join("\n"),
        }),
      });
      if (!res.ok) throw new Error();
      onSent();
    } catch {
      setError("We couldn't send your report. Try again, or email us with your order number.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Report a key that doesn't work"
      description={`We check it and reply ${STORE_POLICY.support.replyTime}. ${STORE_POLICY.guarantee.headline}.`}
      footer={
        <>
          <Button variant="outline" onPress={onClose}>
            Cancel
          </Button>
          <Button onPress={send} isLoading={busy}>
            Report it
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <Select label="What happened?" required value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Choose a reason" options={REASONS.map((r) => ({ value: r, label: r }))} />
        <Textarea label="Anything else we should know?" hint="Optional. The exact message the platform showed helps us most." value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} />
        {error ? <Alert tone="danger">{error}</Alert> : null}
      </div>
    </Modal>
  );
}
