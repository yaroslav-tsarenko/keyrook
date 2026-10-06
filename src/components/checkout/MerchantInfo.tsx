import { useTranslations } from "next-intl";
import { COMPANY } from "@/lib/company";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils/cn";

export function MerchantInfo({ variant = "full", className }: { variant?: "full" | "line"; className?: string }) {
  const t = useTranslations("checkout.merchant");
  if (variant === "line") {
    return (
      <p className={cn("meta m-0 text-ink-muted", className)}>
        {t("line", { company: COMPANY.name, brand: BRAND.name })}{" "}
        <a href={`mailto:${COMPANY.email}`} className="underline underline-offset-4 hover-device:hover:text-ink">
          {COMPANY.email}
        </a>
      </p>
    );
  }
  return (
    <div className={cn("text-ui-sm leading-[1.6] text-ink", className)}>
      <p className="m-0">
        {t("soldBy", { company: COMPANY.name, address: `${COMPANY.registeredOffice}, ${COMPANY.country}` })}
      </p>
      <p className="m-0">{t("merchantOfRecord", { company: COMPANY.name })}</p>
      <p className="meta m-0 mt-1 text-ink-muted">
        {t("tradingName", { brand: BRAND.name, company: COMPANY.name, number: COMPANY.companyNumber })}
      </p>
    </div>
  );
}
