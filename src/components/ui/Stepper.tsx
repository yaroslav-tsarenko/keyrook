"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "./Button";
import { Alert } from "./Alert";

export interface StepperStep {
  id: string;
  title: string;
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
  const headingRefs = useRef<(HTMLHeadingElement | null)[]>([]);
  const summaryRef = useRef<HTMLDivElement>(null);
  const previous = useRef(current);

  useEffect(() => {
    if (previous.current === current) return;
    previous.current = current;
    headingRefs.current[current]?.focus();
  }, [current]);

  useEffect(() => {
    if (errorSummary && errorSummary.fields.length > 0) summaryRef.current?.focus();
  }, [errorSummary]);

  const resolvedContinue = typeof continueLabel === "function" ? continueLabel(current) : continueLabel;
  const active = steps[current];

  return (
    <div className={className}>
      <p aria-live="polite" className="sr-only">
        {active ? `Step ${current + 1} of ${steps.length}, ${active.title}` : ""}
      </p>
      <ol aria-label={label} className="m-0 list-none p-0">
        {steps.map((step, index) => {
          const state = index < current ? "complete" : index === current ? "current" : "upcoming";
          const open = state === "current";
          const last = index === steps.length - 1;
          return (
            <li key={step.id} data-step-state={state} aria-current={open ? "step" : undefined} className="relative">
              {!last ? <span aria-hidden="true" className="absolute bottom-0 left-4 top-8 w-px bg-line" /> : null}
              <div className="relative flex min-h-14 flex-wrap items-center gap-x-4 gap-y-1 py-3 sm:min-h-16">
                <span
                  aria-hidden="true"
                  className={cn(
                    "relative z-[1] flex size-8 shrink-0 items-center justify-center rounded-control font-mono text-[1rem] font-semibold",
                    state === "current" ? "bg-brand text-on-brand" : "bg-surface-1 text-ink",
                    state === "upcoming" && "text-ink-subtle",
                  )}
                >
                  {state === "complete" ? <Check size={16} strokeWidth={2} /> : index + 1}
                </span>
                <h2
                  ref={(node) => {
                    headingRefs.current[index] = node;
                  }}
                  tabIndex={open ? -1 : undefined}
                  id={`${baseId}-${step.id}-title`}
                  className={cn(
                    "m-0 min-w-0 flex-1 font-display text-step-2 font-semibold leading-[1.1] outline-none",
                    state === "upcoming" ? "text-ink-subtle" : "text-ink",
                  )}
                >
                  <span className="sr-only">Step {index + 1}: </span>
                  {step.title}
                </h2>
                {state === "complete" && onEdit ? (
                  <button
                    type="button"
                    onClick={() => onEdit(index)}
                    className="min-h-11 cursor-pointer text-ui-md font-semibold text-ink decoration-1 underline-offset-4 hover-device:hover:underline"
                  >
                    Change<span className="sr-only"> {step.title}</span>
                  </button>
                ) : null}
                {state === "complete" && step.summary ? <p className="m-0 w-full pl-12 text-ui-sm text-ink-muted">{step.summary}</p> : null}
              </div>
              <div
                inert={!open}
                aria-labelledby={`${baseId}-${step.id}-title`}
                role="group"
                className={cn("grid transition-[grid-template-rows] duration-[200ms] ease-[var(--ease-instrument)]", open ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}
              >
                <div className="relative min-h-0 overflow-hidden">
                  <div className="pb-8 pl-12 pt-2">
                    {open && errorSummary && errorSummary.fields.length > 0 ? (
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
                    {step.content}
                    {!hideActions && open ? (
                      <div className="mt-8 flex flex-wrap-reverse items-center justify-between gap-4">
                        {index > 0 && onBack ? (
                          <Button variant="ghost" onPress={onBack}>
                            Back
                          </Button>
                        ) : (
                          <span />
                        )}
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
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
