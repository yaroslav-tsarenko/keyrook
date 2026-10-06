"use client";

import { useEffect, useId, useRef, useState, type ReactNode, type RefObject } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

let scrollLocks = 0;

function lockScroll() {
  scrollLocks += 1;
  if (scrollLocks === 1) {
    const gap = window.innerWidth - document.documentElement.clientWidth;
    document.documentElement.style.overflow = "hidden";
    if (gap > 0) document.documentElement.style.paddingRight = `${gap}px`;
  }
}

function unlockScroll() {
  scrollLocks = Math.max(0, scrollLocks - 1);
  if (scrollLocks === 0) {
    document.documentElement.style.overflow = "";
    document.documentElement.style.paddingRight = "";
  }
}

type Phase = "closed" | "open" | "closing";

export function useNativeDialog(open: boolean, closeMs: number, initialFocus?: RefObject<HTMLElement | null>) {
  const ref = useRef<HTMLDialogElement>(null);
  const [phase, setPhase] = useState<Phase>("closed");

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open) {
      if (!dialog.open) {
        dialog.showModal();
        lockScroll();
      }
      setPhase("open");
      if (initialFocus?.current) initialFocus.current.focus();
      return;
    }
    if (!dialog.open) return;
    setPhase("closing");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(() => {
      dialog.close();
      unlockScroll();
      setPhase("closed");
    }, reduced ? 120 : closeMs);
    return () => window.clearTimeout(timer);
  }, [open, closeMs, initialFocus]);

  useEffect(() => {
    const dialog = ref.current;
    return () => {
      if (dialog?.open) {
        dialog.close();
        unlockScroll();
      }
    };
  }, []);

  return { ref, phase };
}

interface DialogShellProps {
  open: boolean;
  onClose: () => void;
  label?: string;
  labelledBy?: string;
  className?: string;
  closeMs: number;
  initialFocus?: RefObject<HTMLElement | null>;
  children: ReactNode;
  dataAttrs?: Record<string, string>;
}

function DialogShell({ open, onClose, label, labelledBy, className, closeMs, initialFocus, children, dataAttrs }: DialogShellProps) {
  const { ref, phase } = useNativeDialog(open, closeMs, initialFocus);
  return (
    <dialog
      ref={ref}
      aria-label={label}
      aria-labelledby={labelledBy}
      aria-modal="true"
      data-phase={phase}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className={cn(
        "border-0 p-0 text-ink backdrop:bg-scrim backdrop:transition-opacity backdrop:duration-[260ms] data-[phase=closing]:backdrop:opacity-0",
        className,
      )}
      {...dataAttrs}
    >
      {phase !== "closed" || open ? children : null}
    </dialog>
  );
}

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: "md" | "lg";
  description?: ReactNode;
  initialFocus?: RefObject<HTMLElement | null>;
  className?: string;
}

export function Modal({ open, onClose, title, children, footer, size = "md", description, initialFocus, className }: ModalProps) {
  const titleId = useId();
  return (
    <DialogShell
      open={open}
      onClose={onClose}
      labelledBy={titleId}
      closeMs={200}
      initialFocus={initialFocus}
      className={cn(
        "m-auto max-h-[calc(100dvh-32px)] w-[calc(100%-32px)] bg-raised shadow-xl",
        size === "lg" ? "max-w-[720px]" : "max-w-[560px]",
        "data-[phase=open]:animate-rise-in data-[phase=closing]:translate-y-2 data-[phase=closing]:opacity-0 transition-[opacity,transform] duration-[200ms] ease-[var(--ease-latch)]",
        className,
      )}
    >
      <div className="flex max-h-[calc(100dvh-32px)] flex-col">
        <div className="flex items-start justify-between gap-4 px-6 pt-6 sm:px-8 sm:pt-8">
          <div className="min-w-0">
            <h2 id={titleId} className="text-step-2 font-semibold leading-[1.15] text-ink">
              {title}
            </h2>
            {description ? <p className="mt-2 text-ink-muted">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-2 -mt-1 flex size-10 shrink-0 cursor-pointer items-center justify-center text-ink hover-device:hover:bg-surface-1"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6 pt-5 sm:px-8 sm:pb-8">{children}</div>
        {footer ? <div className="flex flex-wrap items-center justify-end gap-3 border-t border-line px-6 py-5 sm:px-8">{footer}</div> : null}
      </div>
    </DialogShell>
  );
}

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  side: "right" | "left" | "top" | "bottom";
  label?: string;
  labelledBy?: string;
  children: ReactNode;
  className?: string;
  initialFocus?: RefObject<HTMLElement | null>;
  motion?: string;
}

export function Sheet({ open, onClose, side, label, labelledBy, children, className, initialFocus, motion }: SheetProps) {
  const sideClass =
    side === "right"
      ? "ml-auto mr-0 h-dvh max-h-none w-full max-w-[420px] shadow-panel data-[phase=open]:animate-sheet-in-right data-[phase=closing]:animate-sheet-out-right"
      : side === "left"
        ? "ml-0 mr-auto h-dvh max-h-none w-[min(100%,400px)] max-w-none shadow-panel-left data-[phase=open]:animate-fade-in data-[phase=closing]:opacity-0"
        : side === "bottom"
          ? "mb-0 mt-auto h-dvh max-h-none w-full max-w-none shadow-xl data-[phase=open]:animate-sheet-in-bottom data-[phase=closing]:animate-sheet-out-bottom"
          : "mt-0 mb-auto w-full max-w-none max-h-[80vh] shadow-lg data-[phase=open]:animate-panel-in data-[phase=closing]:-translate-y-1.5 data-[phase=closing]:opacity-0";
  return (
    <DialogShell
      open={open}
      onClose={onClose}
      label={label}
      labelledBy={labelledBy}
      closeMs={200}
      initialFocus={initialFocus}
      dataAttrs={motion ? { "data-motion": motion } : undefined}
      className={cn(
        "inset-y-0 bg-raised transition-[opacity,transform] duration-[200ms] ease-[var(--ease-latch)]",
        sideClass,
        className,
      )}
    >
      {children}
    </DialogShell>
  );
}
