"use client";

import Link from "next/link";
import { Tabs } from "@/components/ui/Tabs";
import { STORE_POLICY } from "@/config/store-policy";
import { exteriorDef, floatRangeLabel, rarityDef, weaponTypeDef, type SkinSummary } from "@/lib/skins/cs2";
import { cn } from "@/lib/utils/cn";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <tr className="border-b border-line">
      <th scope="row" className="eyebrow h-11 w-[40%] py-3 pr-6 text-left align-top font-medium sm:w-[220px]">
        {label}
      </th>
      <td className="py-3 text-step-0 text-ink">{children}</td>
    </tr>
  );
}

export function SkinDetailTabs({ skin, className }: { skin: SkinSummary | null; className?: string }) {
  const d = STORE_POLICY.delivery;
  const ext = skin ? exteriorDef(skin.exterior) : null;
  const range = skin ? floatRangeLabel(skin.floatMin, skin.floatMax) : null;
  const reading = "measure text-step-0 leading-[1.7] text-ink-muted [&_a]:font-semibold [&_a]:text-ink [&_a]:underline [&_a]:underline-offset-4";

  const details = (
    <div className="grid gap-10 lg:grid-cols-2">
      {skin ? (
        <table className="w-full border-collapse border-t border-rule">
          <caption className="sr-only">Item details</caption>
          <tbody>
            <Row label="Weapon">{skin.weapon}</Row>
            <Row label="Type">{weaponTypeDef(skin.weaponType)?.singular ?? skin.weaponType}</Row>
            <Row label="Finish">{skin.skinName ?? "None (vanilla)"}</Row>
            <Row label="Exterior">{ext ? ext.label : "Not painted"}</Row>
            {range ? (
              <Row label="Float range">
                <span className="font-mono text-data">{range}</span>
              </Row>
            ) : null}
            <Row label="Rarity">{rarityDef(skin.rarity)?.label ?? skin.rarity}</Row>
            {skin.phase ? <Row label="Phase">{skin.phase}</Row> : null}
            {skin.collection ? <Row label="Collection">{skin.collection}</Row> : null}
            <Row label="Quality">{skin.isStatTrak ? "StatTrak™" : skin.isSouvenir ? "Souvenir" : "Standard"}</Row>
          </tbody>
        </table>
      ) : null}
      <div className={reading}>
        <p className="m-0">The image is Steam&apos;s standard render for this skin. Wear and pattern on your copy may differ.</p>
        {range ? <p className="m-0 mt-4">The float of the copy you receive falls inside {range}, the range for its exterior. Steam shows the exact value after delivery.</p> : null}
      </div>
    </div>
  );

  const delivery = (
    <div className={reading}>
      <p className="m-0">
        We send your skin as a {d.method} after your payment is confirmed, {d.usualTime}. Accept the offer in Steam to receive it. {d.offerExpiryNote}
      </p>
      <p className="m-0 mt-4">If we cannot deliver within {d.deadlineHours} hours of payment confirmation, we refund the item.</p>
      <p className="m-0 mt-4">
        Steam may keep items you receive under trade protection for up to {d.tradeProtectionDays} days. Without the Steam Guard Mobile Authenticator a trade hold can last up to {d.tradeHoldMaxDays} days. These are Valve’s rules.
      </p>
      <p className="m-0 mt-4">
        <Link href="/how-it-works">How delivery works</Link>
      </p>
    </div>
  );

  const priceNotes = (
    <div className={reading}>
      <p className="m-0">Prices are re-confirmed when you pay. If one changes, you see the new price before paying and can accept it or remove the item.</p>
      <p className="m-0 mt-4">The price shown is the price you pay in your chosen currency. There are no delivery charges.</p>
    </div>
  );

  return <Tabs className={cn(className)} label="About this skin" items={[{ id: "details", label: "Details", content: details }, { id: "delivery", label: "Delivery", content: delivery }, { id: "price", label: "Price notes", content: priceNotes }]} />;
}
