"use client";

import { useTranslations } from "next-intl";
import type { UseFormRegisterReturn } from "react-hook-form";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Field";
import { DELIVERY_COUNTRIES } from "@/lib/countries";

interface PhoneFieldProps {
  idPrefix: string;
  dialRegister: UseFormRegisterReturn;
  numberRegister: UseFormRegisterReturn;
  error?: string;
  dialError?: string;
  required?: boolean;
  optional?: boolean;
}

export function PhoneField({ idPrefix, dialRegister, numberRegister, error, dialError, required = true, optional = false }: PhoneFieldProps) {
  const t = useTranslations("forms");
  return (
    <fieldset className="m-0 min-w-0 border-0 p-0">
      <legend className="mb-1.5 p-0 text-ui-sm font-medium leading-[1.4] text-ink">
        {t("phone")}
        {required ? <span className="text-ink-muted" aria-hidden="true"> *</span> : null}
        {optional ? <span className="text-ink-muted"> {t("optional")}</span> : null}
      </legend>
      <div className="grid grid-cols-[minmax(0,7rem)_minmax(0,1fr)] items-start gap-2 sm:grid-cols-[minmax(0,9.5rem)_minmax(0,1fr)]">
        <Select
          id={`${idPrefix}-dial`}
          label={t("dialCode")}
          labelHidden
          error={dialError}
          autoComplete="tel-country-code"
          {...dialRegister}
          options={DELIVERY_COUNTRIES.map((c) => ({ value: c.code, label: `${c.phone} ${c.code}` }))}
        />
        <Input
          id={`${idPrefix}-number`}
          label={t("phoneNumber")}
          labelHidden
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          required={required}
          error={error}
          hint={t("phoneHint")}
          {...numberRegister}
        />
      </div>
    </fieldset>
  );
}
