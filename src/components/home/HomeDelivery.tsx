import { STORE_POLICY } from "@/config/store-policy";
import { TimelineSteps } from "@/components/skin/PurchaseTimeline";
import { SectionHead } from "./SectionHead";

export const DELIVERY_STEPS = [
  { title: "Sign in through Steam", body: "Link the Steam account that should receive your skins. We read your public Steam ID and profile name, nothing else." },
  { title: "Add your trade URL", body: "Paste the trade URL from your Steam settings. We check that it belongs to the account you linked." },
  { title: "Pay by card", body: "Pay on the payment provider's secure page. We re-confirm each price before you pay and show you any change." },
  {
    title: "Accept the trade offer in Steam",
    body: `We send your skin as a ${STORE_POLICY.delivery.method} after your payment is confirmed, ${STORE_POLICY.delivery.usualTime}. Accept the offer in Steam to receive it.`,
  },
];

export function HomeDelivery() {
  return (
    <section aria-labelledby="delivery-title" data-section="how-delivery-works" className="border-t border-line">
      <div className="mx-auto max-w-wide px-gutter pb-16 pt-20">
        <SectionHead id="delivery-title" title="How delivery works" lead="No parcel and no waiting for a courier. The skin arrives as a trade offer in Steam." link={{ href: "/how-it-works", label: "Read how delivery works" }} />
        <TimelineSteps steps={DELIVERY_STEPS} className="mt-12" />
      </div>
    </section>
  );
}
