import type { ReactNode } from "react";
import { BRAND } from "@/lib/brand";
import { COMPANY } from "@/lib/company";
import { cn } from "@/lib/utils/cn";

export function CredentialsSheet({ stacked = false, className }: { stacked?: boolean; className?: string }) {
  const rows: { label: string; value: ReactNode; mono?: boolean }[] = [
    { label: "Company", value: COMPANY.name },
    { label: "Company number", value: COMPANY.companyNumber, mono: true },
    ...(COMPANY.vatRegistered ? [{ label: "VAT number", value: COMPANY.vatNumber, mono: true }] : []),
    { label: "Registered office", value: COMPANY.registeredOffice },
    {
      label: "Email",
      value: (
        <a href={`mailto:${COMPANY.email}`} className="break-all decoration-1 underline-offset-4 hover-device:hover:underline">
          {COMPANY.email}
        </a>
      ),
    },
    ...(COMPANY.phone
      ? [
          {
            label: "Phone",
            mono: true,
            value: (
              <a href={`tel:${COMPANY.phone.replace(/\s/g, "")}`} className="decoration-1 underline-offset-4 hover-device:hover:underline">
                {COMPANY.phone}
              </a>
            ),
          },
        ]
      : []),
    { label: "Support hours", value: COMPANY.supportHours },
  ];

  return (
    <section aria-label="Company details" data-credentials="" className={className}>
      <p className="m-0 text-ui-md text-ink">
        {BRAND.name} is a trading name of {COMPANY.name}.
      </p>
      <dl className={cn("m-0 mt-4 grid grid-cols-1 border-t border-line sm:grid-cols-2", !stacked && "lg:grid-cols-[repeat(auto-fit,minmax(200px,1fr))]")}>
        {rows.map((row) => (
          <div key={row.label} className="min-w-0 border-b border-line py-3 sm:pr-6">
            <dt className="eyebrow">{row.label}</dt>
            <dd className={cn("m-0 mt-1.5 text-ink", row.mono ? "font-mono text-data" : "text-ui-md")}>{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
