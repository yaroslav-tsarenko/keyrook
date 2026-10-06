"use client";

import { useTranslations } from "next-intl";
import type { UseFormRegisterReturn } from "react-hook-form";
import { Input } from "@/components/ui/Field";
import { CountrySelect } from "./CountrySelect";

interface AddressFieldsProps {
  idPrefix: string;
  registers: {
    street: UseFormRegisterReturn;
    address2?: UseFormRegisterReturn;
    city: UseFormRegisterReturn;
    postcode: UseFormRegisterReturn;
    country: UseFormRegisterReturn;
  };
  errors: { street?: string; address2?: string; city?: string; postcode?: string; country?: string };
  autoCompleteSection?: string;
}

export function AddressFields({ idPrefix, registers, errors, autoCompleteSection = "shipping" }: AddressFieldsProps) {
  const t = useTranslations("forms");
  const ac = (token: string) => `${autoCompleteSection} ${token}`;
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-6">
      <Input
        id={`${idPrefix}-street`}
        label={t("street")}
        required
        autoComplete={ac("address-line1")}
        error={errors.street}
        wrapperClassName="sm:col-span-6"
        {...registers.street}
      />
      {registers.address2 ? (
        <Input
          id={`${idPrefix}-address2`}
          label={<>{t("address2")} <span className="text-ink-muted">{t("optional")}</span></>}
          autoComplete={ac("address-line2")}
          error={errors.address2}
          wrapperClassName="sm:col-span-6"
          {...registers.address2}
        />
      ) : null}
      <Input
        id={`${idPrefix}-city`}
        label={t("city")}
        required
        autoComplete={ac("address-level2")}
        error={errors.city}
        wrapperClassName="sm:col-span-3"
        {...registers.city}
      />
      <Input
        id={`${idPrefix}-postcode`}
        label={t("postcode")}
        required
        autoComplete={ac("postal-code")}
        error={errors.postcode}
        wrapperClassName="sm:col-span-3"
        className="uppercase"
        {...registers.postcode}
      />
      <CountrySelect
        id={`${idPrefix}-country`}
        required
        error={errors.country}
        wrapperClassName="sm:col-span-6"
        autoComplete={ac("country")}
        {...registers.country}
      />
    </div>
  );
}
