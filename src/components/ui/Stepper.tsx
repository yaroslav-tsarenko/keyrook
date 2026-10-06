"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "./Button";
import { Alert } from "./Alert";
import { DialRuler } from "./Dial";

export interface StepperStep {
  id: string;
  title: string;
  short?: string;
  summary?: ReactNode;
  content: ReactNode;
}

export interface StepperErrorSummary {
  fields: { id: string; label: string }[];
  message?: string;
}

export interface StepperProps {
  steps: StepperStep[];
  current: number;
  label: string;
  onEdit?: (index: number) => void;
  onContinue?: () => void;
  onBack?: () => void;
  continueLabel?: string | ((index: number) => string);
  continueDisabled?: boolean;
  continueLoading?: boolean;
  continueType?: "button" | "submit";
  errorSummary?: StepperErrorSummary | null;
  hideActions?: boolean;
  className?: string;
}

export function Stepper({
  steps,
  current,
  label,
  onEdit,
  onContinue,
  onBack,
  continueLabel = "Continue",
  continueDisabled,
  continueLoading,
  continueType = "button",
  errorSummary,
  hideActions,
  className,
}: StepperProps) {
  const baseId = useId();
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const previous = useRef(current);

  useEffect(() => {
    if (previous.current === current) return;
    previous.current = current;
    headingRef.current?.focus();
  }, [current]);

  useEffect(() => {
    if (errorSummary && errorSummary.fields.length > 0) summaryRef.current?.focus();
  }, [errorSummary]);

  const resolvedContinue = typeof continueLabel === "function" ? continueLabel(current) : continueLabel;
  const active = steps[current];
  const done = steps.slice(0, current);

  return (
    <div className={className} data-stepper="">
      <p aria-live="polite" className="sr-only">
        {active ? `Step ${current + 1} of ${steps.length}, ${active.title}` : ""}
      </p>
      <nav aria-label={label}>
        <ol className="sr-only">
          {steps.map((step, index) => (
            <li key={step.id} aria-current={index === current ? "step" : undefined}>
              Step {index + 1}: {step.title}
              {index < current ? ", completed" : ""}
            </li>
          ))}
        </ol>
        <DialRuler
          detents={steps.map((s) => ({ key: s.id, label: s.short ?? s.title }))}
          active={current}
          compactLabels
          doneIcon={<Check size={14} aria-hidden="true" className="text-ink" />}
          className="mb-8"
        />
      </nav>

      {done.length > 0 ? (
        <ul className="m-0 mb-8 flex list-none flex-col border-t border-line p-0">
          {done.map((step, index) => (
            <li key={step.id} className="flex min-h-12 flex-wrap items-center gap-x-4 gap-y-1 border-b border-line py-2">
              <Check size={14} aria-hidden="true" className="text-ink-muted" />
              <span className="label-caps text-[0.75rem] text-ink-muted">{step.title}</span>
              <span className="min-w-0 flex-1 truncate text-ui-sm text-ink-muted">{step.summary}</span>
              {onEdit ? (
                <button type="button" onClick={() => onEdit(index)} className="btn-text min-h-11 cursor-pointer text-ui-sm font-[560] text-ink">
                  <span data-label="">
                    Change<span className="sr-only"> {step.title}</span>
                  </span>
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      {active ? (
        <section role="group" aria-labelledby={`${baseId}-title`} data-step={active.id} className="animate-panel-in">
          <h2 ref={headingRef} tabIndex={-1} id={`${baseId}-title`} className="m-0 mb-6 flex items-baseline gap-3 text-step-3 leading-[1.1] text-ink outline-none">
            <span className="font-mono text-data font-medium text-ink-muted [font-stretch:100%]">{String(current + 1).padStart(2, "0")}</span>
            {active.title}
          </h2>
          {errorSummary && errorSummary.fields.length > 0 ? (
            <div ref={summaryRef} tabIndex={-1} className="mb-6 focus-visible:outline-offset-2">
              <Alert tone="danger" title={errorSummary.message ?? `Check ${errorSummary.fields.length} ${errorSummary.fields.length === 1 ? "field" : "fields"}`}>
                <ul className="m-0 flex list-none flex-col gap-1 p-0">
                  {errorSummary.fields.map((field) => (
                    <li key={field.id}>
                      <a href={`#${field.id}`} className="underline underline-offset-4">
                        {field.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </Alert>
            </div>
          ) : null}
          {active.content}
          {!hideActions ? (
            <div className={cn("mt-10 flex flex-wrap-reverse items-center gap-4 border-t border-line pt-6", current > 0 && onBack ? "justify-between" : "justify-end")}>
              {current > 0 && onBack ? (
                <Button variant="ghost" onPress={onBack}>
                  Back
                </Button>
              ) : null}
              <Button
                size="lg"
                type={continueType}
                onPress={continueType === "button" ? onContinue : undefined}
                isDisabled={continueDisabled}
                isLoading={continueLoading}
                className="max-sm:w-full"
              >
                {resolvedContinue}
              </Button>
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
