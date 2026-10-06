import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Search } from "lucide-react";
import { EmptyBay } from "@/components/shared/EmptyState/EmptyState";
import { Button } from "@/components/ui/Button";

export function SearchForm({ query, label, placeholder, submit }: { query: string; label: string; placeholder: string; submit: string }) {
  return (
    <form role="search" action="/search" method="get" className="flex items-stretch gap-3">
      <label htmlFor="search-page-input" className="sr-only">
        {label}
      </label>
      <div className="relative min-w-0 flex-1">
        <Search size={20} aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted" />
        <input
          id="search-page-input"
          name="q"
          type="search"
          defaultValue={query}
          placeholder={placeholder}
          autoComplete="off"
          enterKeyHint="search"
          className="h-14 w-full rounded-control border border-control bg-raised pl-12 pr-4 text-step-1 text-ink shadow-lamp-catch placeholder:text-ink-subtle hover-device:hover:border-ink-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        />
      </div>
      <Button type="submit" size="lg" className="h-14">
        {submit}
      </Button>
    </form>
  );
}

export async function SearchNoResults({ query, categories }: { query: string; categories: { name: string; href: string; count: number }[] }) {
  const t = await getTranslations("catalog");
  return (
    <section aria-labelledby="no-results-title" className="grid gap-x-16 gap-y-10 py-6 lg:grid-cols-12">
      <div className="lg:col-span-5">
        <EmptyBay />
        <h2 id="no-results-title" className="mt-5 text-step-3 font-semibold leading-[1.1] text-ink">
          {query ? t("noResultsTitle", { query }) : t("emptyQueryTitle")}
        </h2>
        {query ? (
          <ul className="mt-5 flex list-disc flex-col gap-2 pl-5 text-step-0 text-ink-muted">
            <li>{t("tipSpelling")}</li>
            <li>{t("tipBroader")}</li>
          </ul>
        ) : (
          <p className="mt-4 text-step-0 text-ink-muted">{t("emptyQueryBody")}</p>
        )}
      </div>
      {categories.length > 0 ? (
        <nav aria-labelledby="browse-title" className="lg:col-span-6 lg:col-start-7">
          <h2 id="browse-title" className="eyebrow m-0">
            {t("browseTitle")}
          </h2>
          <ul className="m-0 mt-4 grid list-none grid-cols-1 border-t border-line p-0 sm:grid-cols-2 sm:gap-x-8">
            {categories.map((c) => (
              <li key={c.href} className="border-b border-line">
                <Link href={c.href} className="label-caps flex min-h-12 items-center justify-between gap-3 text-[0.9375rem] text-ink hover-device:hover:underline hover-device:hover:underline-offset-4">
                  {c.name}
                  <span className="font-mono text-[0.75rem] font-normal normal-case tracking-normal text-ink-subtle">{c.count}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </section>
  );
}
