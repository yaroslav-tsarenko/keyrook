import { SkinTray, type SkinProduct } from "@/components/skin/SkinTray";
import { StarMark } from "@/components/skin/StarMark";
import { TextLink } from "./SectionHead";

export function Spotlight({ knives, gloves }: { knives: SkinProduct[]; gloves: SkinProduct[] }) {
  if (knives.length + gloves.length < 3) return null;
  const [feature, ...restKnives] = knives.length ? knives : gloves;
  const rest = [...restKnives, ...(knives.length ? gloves : [])].slice(0, 4);
  return (
    <section aria-labelledby="spotlight-title" data-section="knives-gloves" className="bg-surface-1">
      <div className="mx-auto grid max-w-wide gap-x-6 gap-y-10 px-gutter py-20 lg:grid-cols-12 lg:py-24">
        <div className="lg:col-span-3">
          <p className="eyebrow m-0 mb-3 flex items-center gap-1.5">
            <StarMark size={12} />
            Star items
          </p>
          <h2 id="spotlight-title" className="m-0 text-step-4 font-[650] leading-[1.04] text-ink">
            Knives and gloves
          </h2>
          <p className="m-0 mt-4 max-w-[34ch] text-step-0 leading-[1.55] text-ink-muted">
            The game marks them with a ★ and they only come out of cases as rare special items. These are the top pieces in stock, one per model.
          </p>
          <div className="mt-6 flex flex-col items-start">
            <TextLink href="/catalog/knives">All knives</TextLink>
            <TextLink href="/catalog/gloves">All gloves</TextLink>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:col-span-9 lg:grid-cols-4 lg:gap-4">
          <div className="col-span-2 lg:row-span-2">
            <SkinTray product={feature} variant="feature" headingLevel={3} sizes="(min-width: 1024px) 560px, 100vw" stageAspect="4/3" fill />
          </div>
          {rest.map((p) => (
            <SkinTray key={p.id} product={p} headingLevel={3} />
          ))}
        </div>
      </div>
    </section>
  );
}
