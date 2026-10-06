import { Fragment } from "react";
import { SquareArrowOutUpRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { ActivationGuide } from "@/config/activation";

export function RichStep({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith("**") ? (
          <strong key={i} className="font-[640] text-ink">
            {part.slice(2, -2)}
          </strong>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}

export function ActivationStepList({ guide, className, size = "md" }: { guide: ActivationGuide; className?: string; size?: "sm" | "md" }) {
  return (
    <ol className={cn("m-0 flex list-none flex-col p-0", className)}>
      {guide.steps.map((step, i) => (
        <li key={step} className={cn("grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 border-b border-line", size === "sm" ? "py-2" : "py-3")}>
          <span aria-hidden="true" className="tumbler-slot mt-px text-[0.8125rem]">
            {i + 1}
          </span>
          <span className={cn("text-ink", size === "sm" ? "text-ui-sm" : "text-ui-md")}>
            <span className="sr-only">Step {i + 1}: </span>
            <RichStep text={step} />
          </span>
        </li>
      ))}
    </ol>
  );
}

export function RedeemLink({ guide, className }: { guide: ActivationGuide; className?: string }) {
  if (!guide.redeemUrl) return null;
  return (
    <a
      href={guide.redeemUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={cn("label-caps inline-flex h-9 items-center gap-2 border border-control bg-plate px-3.5 text-[0.8125rem] text-ink shadow-machined hover-device:hover:border-ink hover-device:hover:bg-raised", className)}
    >
      {guide.redeemLabel}
      <SquareArrowOutUpRight size={16} aria-hidden="true" />
      <span className="sr-only">(opens in a new tab)</span>
    </a>
  );
}
