import { SkinTray, type SkinProduct } from "@/components/skin/SkinTray";
import { TextLink } from "./SectionHead";

export function MarksSplit({ stattrak, souvenir }: { stattrak: { count: number; products: SkinProduct[] }; souvenir: { count: number; products: SkinProduct[] } }) {
  const showSt = stattrak.products.length > 0;
  const showSv = souvenir.products.length > 0;
  if (!showSt && !showSv) return null;
  return (
    <section aria-label="StatTrak™ and Souvenir" data-section="marks" data-scene="marks" className="mx-auto max-w-wide px-gutter pb-20 pt-16">
      <div className="grid gap-y-14 lg:grid-cols-12">
        {showSt ? (
          <div data-marks-col="stattrak" className={showSv ? "lg:col-span-7 lg:border-r lg:border-line lg:pr-10" : "lg:col-span-12"}>
            <h2 className="m-0 font-display text-step-3 font-semibold leading-[1.08] text-ink">StatTrak™</h2>
            <p className="m-0 mt-2 max-w-[48ch] text-step-0 text-ink-muted">Adds a counter that tracks kills made with that weapon.</p>
            <p className="m-0 mt-2 flex flex-wrap items-center gap-x-5 font-mono text-data text-ink">
              {stattrak.count.toLocaleString("en-GB")} in stock
              <TextLink href="/catalog?quality=stattrak" className="font-sans">
                StatTrak™ skins
              </TextLink>
            </p>
            <div data-marks-row="" className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:gap-4">
              {stattrak.products.map((p) => (
                <SkinTray key={p.id} product={p} />
              ))}
            </div>
          </div>
        ) : null}
        {showSv ? (
          <div data-marks-col="souvenir" className={showSt ? "lg:col-span-5 lg:pl-10" : "lg:col-span-12"}>
            <h2 className="m-0 font-display text-step-3 font-semibold leading-[1.08] text-ink">Souvenir</h2>
            <p className="m-0 mt-2 max-w-[40ch] text-step-0 text-ink-muted">Dropped from souvenir packages at CS2 Majors.</p>
            <p className="m-0 mt-2 flex flex-wrap items-center gap-x-5 font-mono text-data text-ink">
              {souvenir.count.toLocaleString("en-GB")} in stock
              <TextLink href="/catalog?quality=souvenir" className="font-sans">
                Souvenir skins
              </TextLink>
            </p>
            <div data-marks-row="" className="mt-6 grid grid-cols-2 gap-3 lg:gap-4">
              {souvenir.products.map((p) => (
                <SkinTray key={p.id} product={p} />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
