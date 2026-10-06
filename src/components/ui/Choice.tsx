"use client";

import { useEffect, useId, useRef, type InputHTMLAttributes, type ReactNode, type Ref } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { FieldError } from "./Field";
import { Lamp } from "./Lamp";

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: ReactNode;
  description?: ReactNode;
  count?: number;
  indeterminate?: boolean;
  error?: ReactNode;
  dense?: boolean;
  wrapperClassName?: string;
  ref?: Ref<HTMLInputElement>;
}

function assignRef<T>(ref: Ref<T> | undefined, value: T | null) {
  if (!ref) return;
  if (typeof ref === "function") ref(value);
  else (ref as { current: T | null }).current = value;
}

export function Checkbox({ label, description, count, indeterminate, error, dense, wrapperClassName, className, id, ref, ...rest }: CheckboxProps) {
  const autoId = useId();
  const fieldId = id || autoId;
  const local = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (local.current) local.current.indeterminate = Boolean(indeterminate);
  }, [indeterminate]);

  return (
    <div className={cn("flex flex-col gap-1", wrapperClassName)}>
      <label
        htmlFor={fieldId}
        className={cn(
          "group flex cursor-pointer items-start gap-2.5 text-step-0 leading-[1.45] text-ink",
          dense ? "min-h-11 items-center py-2" : "py-1",
          rest.disabled && "cursor-not-allowed text-ink-subtle",
        )}
      >
        <span className="relative mt-[3px] grid size-[18px] shrink-0 place-items-center">
          <input
            ref={(node) => {
              local.current = node;
              assignRef(ref, node);
            }}
            id={fieldId}
            type="checkbox"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${fieldId}-error` : undefined}
            className={cn(
              "peer absolute inset-0 m-0 cursor-pointer appearance-none border-[1.5px] border-control bg-raised",
              "transition-colors duration-[120ms] hover-device:hover:border-ink-muted",
              "checked:border-brand checked:bg-brand indeterminate:border-brand indeterminate:bg-brand",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
              "disabled:cursor-not-allowed disabled:bg-surface-1 disabled:border-line",
              error && "border-danger",
              className,
            )}
            {...rest}
          />
          <Check size={12} aria-hidden="true" className="pointer-events-none relative text-on-brand opacity-0 [stroke-width:2.5] peer-checked:opacity-100 peer-indeterminate:opacity-0" />
          <span aria-hidden="true" className="pointer-events-none absolute h-0.5 w-2 bg-on-brand opacity-0 peer-indeterminate:opacity-100" />
        </span>
        <span className="flex min-w-0 flex-1 items-baseline justify-between gap-3">
          <span className="min-w-0">
            {label}
            {description ? <span className="meta mt-0.5 block text-ink-muted">{description}</span> : null}
          </span>
          {typeof count === "number" ? <span className="shrink-0 font-mono text-data-sm text-ink-muted">{count.toLocaleString("en-GB")}</span> : null}
        </span>
      </label>
      {error ? <FieldError id={`${fieldId}-error`}>{error}</FieldError> : null}
    </div>
  );
}

export interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: ReactNode;
  description?: ReactNode;
  count?: number;
  wrapperClassName?: string;
  ref?: Ref<HTMLInputElement>;
}

function RadioDot({ inputProps }: { inputProps: InputHTMLAttributes<HTMLInputElement> & { ref?: Ref<HTMLInputElement> } }) {
  return (
    <span className="relative mt-[3px] grid size-[18px] shrink-0 place-items-center">
      <input
        type="radio"
        {...inputProps}
        className={cn(
          "peer absolute inset-0 m-0 cursor-pointer appearance-none rounded-round border-[1.5px] border-control bg-raised",
          "transition-colors duration-[120ms] hover-device:hover:border-ink-muted checked:border-brand",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
          "disabled:cursor-not-allowed disabled:bg-surface-1 disabled:border-line",
          inputProps.className,
        )}
      />
      <span aria-hidden="true" className="pointer-events-none relative size-2 rounded-round bg-lamp-on opacity-0 peer-checked:opacity-100" />
    </span>
  );
}

export function Radio({ label, description, count, wrapperClassName, id, ref, ...rest }: RadioProps) {
  const autoId = useId();
  const fieldId = id || autoId;
  return (
    <label htmlFor={fieldId} className={cn("flex min-h-11 cursor-pointer items-center gap-2.5 py-2 text-step-0 leading-[1.4] text-ink", wrapperClassName)}>
      <RadioDot inputProps={{ ...rest, id: fieldId, ref }} />
      <span className="flex min-w-0 flex-1 items-baseline justify-between gap-3">
        <span className="min-w-0">
          {label}
          {description ? <span className="meta mt-0.5 block text-ink-muted">{description}</span> : null}
        </span>
        {typeof count === "number" ? <span className="shrink-0 font-mono text-data-sm text-ink-muted">{count.toLocaleString("en-GB")}</span> : null}
      </span>
    </label>
  );
}

export interface RadioRowProps extends Omit<RadioProps, "count"> {
  meta?: ReactNode;
  aside?: ReactNode;
}

export function RadioRow({ label, description, meta, aside, wrapperClassName, id, ref, ...rest }: RadioRowProps) {
  const autoId = useId();
  const fieldId = id || autoId;
  return (
    <label
      htmlFor={fieldId}
      className={cn(
        "flex cursor-pointer items-start gap-3 border border-control bg-plate px-4 py-4 shadow-machined transition-colors duration-[120ms]",
        "hover-device:hover:border-ink-muted has-checked:bg-brand-soft",
        "has-disabled:cursor-not-allowed has-disabled:text-ink-subtle",
        wrapperClassName,
      )}
    >
      <RadioDot inputProps={{ ...rest, id: fieldId, ref }} />
      <span className="flex min-w-0 flex-1 flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <span className="min-w-0">
          <span className="block font-medium text-ink">{label}</span>
          {description ? <span className="meta mt-0.5 block text-ink-muted">{description}</span> : null}
          {meta ? <span className="meta mt-0.5 block text-ink-muted">{meta}</span> : null}
        </span>
        {aside ? <span className="tabular shrink-0 text-ink">{aside}</span> : null}
      </span>
    </label>
  );
}

export interface SwitchProps {
  checked: boolean;
  onChange?: (checked: boolean) => void;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
  lockedText?: ReactNode;
  id?: string;
  className?: string;
}

export function Switch({ checked, onChange, label, description, disabled, lockedText, id, className }: SwitchProps) {
  const autoId = useId();
  const fieldId = id || autoId;
  return (
    <div className={cn("flex items-start justify-between gap-6", className)}>
      <div className="min-w-0">
        <span id={`${fieldId}-label`} className="block text-step-0 font-[560] text-ink">
          {label}
        </span>
        {description ? (
          <span id={`${fieldId}-desc`} className="meta mt-1 block text-ink-muted">
            {description}
          </span>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-3">
        {lockedText ? <span className="meta text-ink-muted">{lockedText}</span> : null}
        <button
          id={fieldId}
          type="button"
          role="switch"
          aria-checked={checked}
          aria-labelledby={`${fieldId}-label`}
          aria-describedby={description ? `${fieldId}-desc` : undefined}
          disabled={disabled}
          onClick={() => onChange?.(!checked)}
          className={cn(
            "relative h-[22px] w-10 shrink-0 border transition-colors duration-[180ms] ease-[var(--ease-std)]",
            checked ? "border-accent-edge bg-brand" : "border-control bg-surface-2 hover-device:hover:border-ink-muted",
            disabled ? "cursor-not-allowed opacity-80" : "cursor-pointer",
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              "absolute left-[2px] top-[2px] size-4 rounded-round shadow-machined transition-transform duration-[180ms] ease-[var(--ease-latch)]",
              checked ? "translate-x-[18px] bg-on-brand" : "translate-x-0 bg-ink-muted",
            )}
          />
        </button>
      </div>
    </div>
  );
}

export interface SegmentOption<T extends string> {
  value: T;
  label: ReactNode;
  disabled?: boolean;
}

export interface SegmentedProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  size?: "sm" | "md";
  fullWidth?: boolean;
  className?: string;
}

export function Segmented<T extends string>({ options, value, onChange, label, size = "md", fullWidth = false, className }: SegmentedProps<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const enabled = options.map((o, i) => (o.disabled ? -1 : i)).filter((i) => i >= 0);
  const move = (from: number, dir: 1 | -1) => {
    const pos = enabled.indexOf(from);
    const next = enabled[(pos + dir + enabled.length) % enabled.length];
    if (next === undefined) return;
    onChange(options[next].value);
    refs.current[next]?.focus();
  };
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn("inline-flex border border-control bg-surface-2 p-0", fullWidth && "flex w-full", className)}
    >
      {options.map((option, index) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            ref={(node) => {
              refs.current[index] = node;
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={option.disabled}
            tabIndex={selected || (!options.some((o) => o.value === value) && index === 0) ? 0 : -1}
            onClick={() => onChange(option.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight" || e.key === "ArrowDown") {
                e.preventDefault();
                move(index, 1);
              } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
                e.preventDefault();
                move(index, -1);
              }
            }}
            className={cn(
              "label-caps relative flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap px-3 text-[0.75rem] transition-colors duration-[120ms]",
              size === "sm" ? "h-8" : "h-9 touch-device:h-11",
              fullWidth && "flex-1",
              index > 0 && "border-l border-line",
              selected ? "bg-plate text-ink shadow-machined" : "text-ink-muted hover-device:hover:text-ink",
              option.disabled && "cursor-not-allowed text-ink-subtle",
            )}
          >
            {selected ? <Lamp on /> : null}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
