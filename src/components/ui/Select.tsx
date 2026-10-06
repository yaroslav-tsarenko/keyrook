"use client";

import { useId, type ReactNode, type Ref, type SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { FieldShell, controlClass, controlErrorClass, fieldDescribedBy } from "./Field";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  options?: SelectOption[];
  placeholder?: string;
  size?: "md" | "sm";
  inlineLabel?: ReactNode;
  labelHidden?: boolean;
  wrapperClassName?: string;
  ref?: Ref<HTMLSelectElement>;
}

export function Select({
  label,
  hint,
  error,
  options,
  placeholder,
  size = "md",
  inlineLabel,
  labelHidden,
  wrapperClassName,
  className,
  id,
  required,
  children,
  ref,
  ...rest
}: SelectProps) {
  const autoId = useId();
  const fieldId = id || autoId;
  const select = (
    <div className="relative min-w-0 flex-1">
      <select
        ref={ref}
        id={fieldId}
        required={required}
        aria-required={required || undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={fieldDescribedBy(fieldId, hint, error)}
        className={cn(
          controlClass,
          "cursor-pointer appearance-none pr-10",
          size === "sm" ? "h-9 pl-3 text-ui-sm" : "h-12 pl-3.5",
          error ? controlErrorClass : null,
          className,
        )}
        {...rest}
      >
        {placeholder ? (
          <option value="" disabled={required}>
            {placeholder}
          </option>
        ) : null}
        {options
          ? options.map((o) => (
              <option key={o.value} value={o.value} disabled={o.disabled}>
                {o.label}
              </option>
            ))
          : children}
      </select>
      <ChevronDown size={16} aria-hidden="true" className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
    </div>
  );

  if (inlineLabel) {
    return (
      <div className={cn("flex items-center gap-2.5", wrapperClassName)}>
        <label htmlFor={fieldId} className="eyebrow whitespace-nowrap">
          {inlineLabel}
        </label>
        {select}
      </div>
    );
  }

  return (
    <FieldShell id={fieldId} label={label} hint={hint} error={error} required={required} className={wrapperClassName} labelHidden={labelHidden}>
      {select}
    </FieldShell>
  );
}
