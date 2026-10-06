import { STORE_POLICY } from "@/config/store-policy";
import { TimelineSteps } from "@/components/account/PurchaseTimeline";
import { SectionHead } from "./SectionHead";

export const DELIVERY_STEPS = [
  { title: "Check platform and region", body: "Each product page names the platform the key works on, its activation region and the supported languages." },
  { title: "Pay by card", body: "Pay on the payment provider's secure page. We re-check each price before you pay and show you any change." },
  { title: "Your key is issued", body: `After your payment is confirmed the key appears ${STORE_POLICY.delivery.where}, ${STORE_POLICY.delivery.usualTime}. We email you when it is ready.` },
  { title: "Redeem it", body: "Copy the key and enter it on the platform. Activation steps for each platform are on your order page." },
];

export function HomeDelivery() {
  return (
    <section aria-labelledby="delivery-title" data-section="how-delivery-works" className="border-t border-line">
      <div className="mx-auto max-w-wide px-gutter pb-16 pt-20">
        <SectionHead id="delivery-title" title="How delivery works" lead="No download from us and nothing shipped. You receive an activation key and redeem it on the platform." link={{ href: "/how-it-works", label: "Read how delivery works" }} />
        <TimelineSteps steps={DELIVERY_STEPS} className="mt-12" />
      </div>
    </section>
  );
}
