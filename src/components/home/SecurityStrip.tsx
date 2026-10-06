import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { CreditCard, ReceiptText, RotateCcwKey, ShieldCheck, Vault } from "lucide-react";
import { STORE_POLICY } from "@/config/store-policy";
import { cn } from "@/lib/utils/cn";

export async function SecurityStrip() {
  const t = await getTranslations("home.strip");
  const cells = [
    { key: "hosted", Icon: CreditCard, text: t("hosted"), link: t("hostedLink"), href: "#ledger", show: STORE_POLICY.payment.hostedPage },
    { key: "3ds", Icon: ShieldCheck, text: t("threeDS"), link: t("threeDSLink"), href: "#ledger", show: STORE_POLICY.payment.threeDSecure },
    { key: "vault", Icon: Vault, text: t("encrypted"), link: t("encryptedLink"), href: "#ledger", show: STORE_POLICY.security.keysEncryptedAtRest },
    { key: "invoice", Icon: ReceiptText, text: t("invoice"), link: t("invoiceLink"), href: "/policies/payment#tax", show: STORE_POLICY.invoices.pdf },
    { key: "guarantee", Icon: RotateCcwKey, text: t("guarantee"), link: t("guaranteeLink"), href: "/policies/returns#when-we-refund", show: STORE_POLICY.guarantee.faultyKey },
  ].filter((c) => c.show);
  if (!cells.length) return null;
  return (
    <section aria-label={t("label")} data-home-section="security-strip" className="border-y border-line bg-rig">
      <ul className={cn("mx-auto my-0 grid max-w-wide list-none grid-cols-2 px-0 lg:grid-cols-5", cells.length < 5 && "lg:grid-cols-4")}>
        {cells.map(({ key, Icon, text, link, href }, i) => (
          <li
            key={key}
            className={cn(
              "flex min-h-20 flex-col justify-center gap-1 border-line px-gutter py-4 lg:px-6",
              i % 2 === 1 && "border-l lg:border-l",
              i > 0 && "lg:border-l",
              i >= 2 && "max-lg:border-t",
              i === cells.length - 1 && cells.length % 2 === 1 && "max-lg:col-span-2",
              i === cells.length - 1 && cells.length % 2 === 1 && "max-lg:border-l-0",
            )}
          >
            <p className="m-0 flex items-start gap-2.5 text-ui-md leading-[1.35] text-ink">
              <Icon size={18} aria-hidden="true" className="mt-px shrink-0 text-ink-muted" />
              {text}
            </p>
            <Link href={href} className="btn-text ml-[28px] w-fit text-ui-sm text-ink-muted hover-device:hover:text-ink">
              <span data-label="">{link}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
