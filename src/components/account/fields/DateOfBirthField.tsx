"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { FieldError, controlErrorClass } from "@/components/ui/Field";
import { Select } from "@/components/ui/Select";
import { STORE_POLICY } from "@/config/store-policy";

interface DateOfBirthFieldProps {
  idPrefix: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
}

function split(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || "");
  return match ? { year: match[1], month: String(Number(match[2])), day: String(Number(match[3])) } : { year: "", month: "", day: "" };
}

export function DateOfBirthField({ idPrefix, value, onChange, onBlur, error }: DateOfBirthFieldProps) {
  const t = useTranslations("forms");
  const [draft, setDraft] = useState(() => split(value));
  const parts = value ? split(value) : draft;

  const years = useMemo(() => {
    const latest = new Date().getFullYear() - STORE_POLICY.minAge;
    return Array.from({ length: 100 }, (_, i) => String(latest - i));
  }, []);
  const months = useMemo(
    () => Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: new Intl.DateTimeFormat("en-GB", { month: "short" }).format(new Date(Date.UTC(2000, i, 1))) })),
    [],
  );

  const update = (key: "day" | "month" | "year", next: string) => {
    const merged = { ...parts, [key]: next };
    setDraft(merged);
    if (merged.day && merged.month && merged.year) {
      onChange(`${merged.year}-${merged.month.padStart(2, "0")}-${merged.day.padStart(2, "0")}`);
    } else {
      onChange("");
    }
  };

  const describedBy = error ? `${idPrefix}-dob-error` : `${idPrefix}-dob-hint`;

  return (
    <fieldset className="m-0 min-w-0 border-0 p-0" aria-describedby={describedBy} aria-invalid={error ? true : undefined}>
      <legend className="mb-1.5 p-0 text-ui-sm font-medium leading-[1.4] text-ink">
        {t("dateOfBirth")}
        <span className="text-ink-muted" aria-hidden="true"> *</span>
      </legend>
      <div className="grid grid-cols-[minmax(0,4.75rem)_minmax(0,1fr)_minmax(0,6rem)] gap-2">
        <Select
          id={`${idPrefix}-dob-day`}
          label={t("day")}
          labelHidden
          value={parts.day}
          onChange={(e) => update("day", e.target.value)}
          onBlur={onBlur}
          autoComplete="bday-day"
          placeholder={t("day")}
          className={error ? controlErrorClass : undefined}
          aria-invalid={error ? true : undefined}
          options={Array.from({ length: 31 }, (_, i) => ({ value: String(i + 1), label: String(i + 1) }))}
        />
        <Select
          id={`${idPrefix}-dob-month`}
          label={t("month")}
          labelHidden
          value={parts.month}
          onChange={(e) => update("month", e.target.value)}
          onBlur={onBlur}
          autoComplete="bday-month"
          placeholder={t("month")}
          className={error ? controlErrorClass : undefined}
          aria-invalid={error ? true : undefined}
          options={months}
        />
        <Select
          id={`${idPrefix}-dob-year`}
          label={t("year")}
          labelHidden
          value={parts.year}
          onChange={(e) => update("year", e.target.value)}
          onBlur={onBlur}
          autoComplete="bday-year"
          placeholder={t("year")}
          className={error ? controlErrorClass : undefined}
          aria-invalid={error ? true : undefined}
          options={years.map((y) => ({ value: y, label: y }))}
        />
      </div>
      {error ? (
        <FieldError id={`${idPrefix}-dob-error`} className="mt-1.5">
          {error}
        </FieldError>
      ) : (
        <p id={`${idPrefix}-dob-hint`} className="meta mt-1.5 text-ink-muted">
          {t("dobHint", { minAge: STORE_POLICY.minAge })}
        </p>
      )}
    </fieldset>
  );
}
