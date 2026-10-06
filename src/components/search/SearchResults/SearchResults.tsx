import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Search } from "lucide-react";
import { EmptyBox } from "@/components/shared/EmptyState/EmptyState";
import { Button } from "@/components/ui/Button";

export function SearchForm({ query, label, placeholder, submit, inputId = "search-page-input" }: { query: string; label: string; placeholder: string; submit: string; inputId?: string }) {
  return (
    <form role="search" action="/search" method="get" className="flex items-stretch gap-2">
      <label htmlFor={inputId} className="sr-only">
        {label}
      </label>
      <div className="relative min-w-0 flex-1">
        <Search size={20} aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted" />
        <input
          id={inputId}
          name="q"
          type="search"
          defaultValue={query}
          placeholder={placeholder}
          autoComplete="off"
          enterKeyHint="search"
          className="h-14 w-full border border-control bg-raised pl-12 pr-4 text-[1.0625rem] text-ink shadow-machined-pressed placeholder:text-ink-subtle hover-device:hover:border-ink-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        />
      </div>
      <Button type="submit" size="lg" className="h-14">
        {submit}
      </Button>
    </form>
  );
}

export interface PlatformLocker {
  name: string;
  href: string;
  count: number;
  tone: string;
}

export async function SearchNoResults({ query, platforms }: { query: string; platforms: PlatformLocker[] }) {
  const t = await getTranslations("catalog");
  return (
    <section aria-labelledby="no-results-title" className="grid gap-x-16 gap-y-10 py-6 lg:grid-cols-12">
      <div className="lg:col-span-5">
        <EmptyBox />
        <h2 id="no-results-title" className="m-0 mt-5 text-step-3 leading-[1.1] text-ink">
          {query ? t("noResultsTitle", { query }) : t("emptyQueryTitle")}
        </h2>
        {query ? (
          <ul className="m-0 mt-5 flex list-disc flex-col gap-2 pl-5 text-step-0 text-ink-muted">
            <li>{t("tipSpelling")}</li>
            <li>{t("tipBroader")}</li>
            <li>Or browse by platform.</li>
          </ul>
        ) : (
          <p className="m-0 mt-4 text-step-0 text-ink-muted">{t("emptyQueryBody")}</p>
        )}
      </div>
      {platforms.length > 0 ? (
        <nav aria-labelledby="browse-title" className="lg:col-span-6 lg:col-start-7">
          <h2 id="browse-title" className="eyebrow m-0">
            {t("browseTitle")}
          </h2>
          <ul className="m-0 mt-4 grid list-none grid-cols-2 gap-2 p-0 sm:grid-cols-3">
            {platforms.map((p, i) => (
              <li key={p.href} data-platform={p.tone} className={i === 0 ? "col-span-2 sm:col-span-1" : undefined}>
                <Link href={p.href} className="plate flex h-[76px] flex-col justify-between p-3 hover-device:hover:bg-raised">
                  <span className="flex items-center gap-2">
                    <span aria-hidden="true" className="size-1.5 bg-platform" />
                    <span className="eyebrow text-ink">{p.name}</span>
                  </span>
                  <span className="font-mono text-[0.75rem] text-ink-muted">
                    <span className="text-ink">{p.count.toLocaleString("en-GB")}</span> keys
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </section>
  );
}
