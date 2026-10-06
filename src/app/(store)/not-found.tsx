import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { EmptyStage } from "@/components/skin/SkinStage";
import { CalibratedRuler } from "@/components/skin/FloatRuler";
import { NAV_CATEGORIES } from "@/config/navigation";

export default async function NotFound() {
  const t = await getTranslations("errors");

  return (
    <div className="mx-auto max-w-container px-gutter pb-24 pt-12 lg:pt-20">
      <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-12 lg:gap-x-10">
        <figure data-scene="not-found" className="m-0 lg:col-span-6">
          <EmptyStage className="w-full" />
          <CalibratedRuler jaw={0.404} jawLabel="0.404 · no listing here" decorative className="mt-6" />
        </figure>

        <div className="lg:col-span-5 lg:col-start-8 lg:pt-6">
          <p className="eyebrow m-0">Error 404</p>
          <h1 className="m-0 mt-3 text-step-5 font-[650] leading-none tracking-[-0.01em] text-ink">Nothing under the lamp</h1>
          <p className="m-0 mt-4 max-w-[46ch] text-step-1 leading-[1.5] text-ink-muted">This page doesn&apos;t exist or the skin is no longer listed.</p>

          <form action="/search" method="get" role="search" className="mt-8 flex max-w-[34rem] items-end gap-3">
            <Input name="q" type="search" label={t("searchLabel")} placeholder="Search skins" wrapperClassName="flex-1" autoComplete="off" />
            <Button type="submit" className="h-12 shrink-0" startContent={<Search aria-hidden="true" />}>
              Search
            </Button>
          </form>

          <nav aria-labelledby="nf-categories" className="mt-10 border-t border-line pt-5">
            <h2 id="nf-categories" className="eyebrow m-0">
              Weapon types
            </h2>
            <ul className="m-0 mt-3 grid list-none grid-cols-2 gap-x-6 p-0">
              {NAV_CATEGORIES.map((cat) => (
                <li key={cat.slug}>
                  <Link href={`/catalog/${cat.slug}`} className="label-caps inline-flex min-h-11 items-center text-[0.9375rem] text-ink decoration-1 underline-offset-4 hover-device:hover:underline">
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <Link href="/" className="mt-8 inline-flex min-h-11 items-center text-ui-md font-semibold text-ink decoration-1 underline-offset-4 hover-device:hover:underline">
            {t("backHome")}
          </Link>
        </div>
      </div>
    </div>
  );
}
