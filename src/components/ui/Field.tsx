"use client";

import { useId, useState, type ReactNode, type Ref, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { Eye, EyeOff, OctagonAlert } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export const controlClass = cn(
  "block w-full min-w-0 bg-raised border border-control text-step-0 text-ink placeholder:text-ink-subtle shadow-machined-pressed",
  "transition-[border-color,box-shadow] duration-[120ms] ease-[var(--ease-std)]",
  "hover-device:hover:border-ink-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
  "disabled:bg-surface-1 disabled:text-ink-subtle disabled:cursor-not-allowed disabled:hover:border-control",
);

export const readOnlyClass = "read-only:border-transparent read-only:bg-surface-1 read-only:shadow-none";

export const controlErrorClass = "border-2 border-danger hover-device:hover:border-danger";

export const dataInputClass = "font-mono text-[0.9375rem] tracking-[0.01em]";

export interface FieldShellProps {
  id: string;
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  className?: string;
  labelHidden?: boolean;
  children: ReactNode;
}

export function fieldDescribedBy(id: string, hint?: ReactNode, error?: ReactNode) {
  const ids = [error ? `${id}-error` : null, hint ? `${id}-hint` : null].filter(Boolean);
  return ids.length ? ids.join(" ") : undefined;
}

export function FieldShell({ id, label, hint, error, required, className, labelHidden, children }: FieldShellProps) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      {label ? (
        <label htmlFor={id} className={cn("text-ui-md font-[560] leading-[1.3] text-ink", labelHidden && "sr-only")}>
          {label}
          {required ? (
            <span className="text-ink-muted" aria-hidden="true">
              {" "}*
            </span>
          ) : null}
        </label>
      ) : null}
      {children}
      {hint ? (
        <p id={`${id}-hint`} className="meta text-ink-muted">
          {hint}
        </p>
      ) : null}
      {error ? <FieldError id={`${id}-error`}>{error}</FieldError> : null}
    </div>
  );
}

export function FieldError({ id, children, className }: { id?: string; children: ReactNode; className?: string }) {
  return (
    <p id={id} className={cn("meta flex items-start gap-1.5 text-danger", className)}>
      <OctagonAlert size={16} aria-hidden="true" className="mt-px shrink-0" />
      <span>{children}</span>
    </p>
  );
}

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "prefix" | "size"> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  prefix?: ReactNode;
  suffix?: ReactNode;
  size?: "md" | "sm";
  mono?: boolean;
  labelHidden?: boolean;
  wrapperClassName?: string;
  ref?: Ref<HTMLInputElement>;
}

export function Input({
  label,
  hint,
  error,
  prefix,
  suffix,
  size = "md",
  mono = false,
  labelHidden,
  wrapperClassName,
  className,
  id,
  required,
  ref,
  ...rest
}: InputProps) {
  const autoId = useId();
  const fieldId = id || autoId;
  return (
    <FieldShell id={fieldId} label={label} hint={hint} error={error} required={required} className={wrapperClassName} labelHidden={labelHidden}>
      <div className="relative flex min-w-0">
        {prefix ? (
          <span className="inline-flex shrink-0 items-center border border-r-0 border-control bg-surface-1 px-3 font-mono text-data text-ink-muted">
            {prefix}
          </span>
        ) : null}
        <input
          ref={ref}
          id={fieldId}
          required={required}
          aria-required={required || undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={fieldDescribedBy(fieldId, hint, error)}
          className={cn(controlClass, readOnlyClass, size === "sm" ? "h-10 px-3 text-ui-sm" : "h-12 px-3.5", mono ? dataInputClass : null, suffix ? "pr-11" : null, error ? controlErrorClass : null, className)}
          {...rest}
        />
        {suffix ? <span className="absolute inset-y-0 right-0 flex items-center">{suffix}</span> : null}
      </div>
    </FieldShell>
  );
}

export function PasswordInput(props: Omit<InputProps, "type" | "suffix">) {
  const [visible, setVisible] = useState(false);
  return (
    <Input
      {...props}
      type={visible ? "text" : "password"}
      suffix={
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-pressed={visible}
          aria-label={visible ? "Hide password" : "Show password"}
          className="mr-1 flex h-10 w-10 cursor-pointer items-center justify-center text-ink-muted hover-device:hover:text-ink"
        >
          {visible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
        </button>
      }
    />
  );
}

export function PhoneInput({ dialCode, ...props }: Omit<InputProps, "type" | "prefix"> & { dialCode?: string | null }) {
  return <Input {...props} type="tel" inputMode="tel" autoComplete={props.autoComplete ?? "tel-national"} prefix={dialCode || undefined} />;
}

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  labelHidden?: boolean;
  wrapperClassName?: string;
  ref?: Ref<HTMLTextAreaElement>;
}

export function Textarea({ label, hint, error, labelHidden, wrapperClassName, className, id, required, ref, ...rest }: TextareaProps) {
  const autoId = useId();
  const fieldId = id || autoId;
  return (
    <FieldShell id={fieldId} label={label} hint={hint} error={error} required={required} className={wrapperClassName} labelHidden={labelHidden}>
      <textarea
        ref={ref}
        id={fieldId}
        required={required}
        aria-required={required || undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={fieldDescribedBy(fieldId, hint, error)}
        className={cn(controlClass, readOnlyClass, "min-h-[140px] resize-y px-3.5 py-3 leading-[1.6]", error ? controlErrorClass : null, className)}
        {...rest}
      />
    </FieldShell>
  );
}
