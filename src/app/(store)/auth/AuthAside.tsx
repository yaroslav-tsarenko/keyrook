import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { BRAND } from "@/lib/brand";

export function AuthAside({ mode }: { mode: "login" | "register" }) {
  const t = useTranslations("auth.aside");
  return (
    <aside className="flex flex-col gap-5 border-t border-line pt-10 lg:border-t-0 lg:pt-2">
      <h2 className="m-0 text-step-3 leading-[1.1] text-ink">{mode === "login" ? t("newTitle", { brand: BRAND.name }) : t("registeredTitle")}</h2>
      {mode === "login" ? (
        <>
          <ul className="m-0 flex list-none flex-col border-t border-line p-0">
            {(["track", "addresses", "saved"] as const).map((key) => (
              <li key={key} className="border-b border-line py-3 text-step-0 text-ink">
                {t(`benefits.${key}`)}
              </li>
            ))}
          </ul>
          <Button as={Link} href="/auth/register" variant="outline" className="self-start">
            {t("createAccount")}
          </Button>
        </>
      ) : (
        <>
          <p className="m-0 text-ink-muted">{t("registeredBody")}</p>
          <ul className="m-0 flex list-none flex-col border-t border-line p-0">
            {(["track", "addresses", "saved"] as const).map((key) => (
              <li key={key} className="border-b border-line py-3 text-step-0 text-ink">
                {t(`benefits.${key}`)}
              </li>
            ))}
          </ul>
          <Button as={Link} href="/auth/login" variant="outline" className="self-start">
            {t("signIn")}
          </Button>
        </>
      )}
    </aside>
  );
}
