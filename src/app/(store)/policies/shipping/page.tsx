import Link from "next/link";
import { PolicyLayout, policyMetadata, type PolicySection } from "@/components/layout/PolicyLayout/PolicyLayout";
import { POLICY_FACTS as F } from "@/lib/policy-facts";
import { PLATFORMS } from "@/lib/keys/taxonomy";

export const generateMetadata = policyMetadata(
  "shipping",
  `How ${F.brand} delivers game keys, subscription codes and gift cards: to your account after payment is confirmed, ${F.deliveryUsual}. Regions, languages and redeeming.`,
);

const sections: PolicySection[] = [
  {
    id: "how",
    title: "How keys are delivered",
    body: (
      <>
        <p>
          Everything we sell is digital: activation keys for games and DLC, subscription codes, gift card and top-up codes, and software
          licence keys. Nothing is posted and there is no delivery charge.
        </p>
        <p>
          We request your key from our distribution partner only after our payment provider confirms your payment to us. The key then
          appears {F.deliveryWhere}, {F.deliveryUsual}. {F.deliveryEmailNote}
        </p>
        <p>
          Orders with several products, or several keys of one product, are delivered product by product. Your order page shows the status of
          each one: payment confirmed, issuing key, delivered, or refunded.
        </p>
      </>
    ),
  },
  {
    id: "timing",
    title: "How long it takes",
    body: (
      <>
        <p>
          Most keys are issued within minutes of payment confirmation. We do not promise a fixed number of minutes: a payment check by your
          bank, a security review of the order or a delay at our distribution partner can make it take longer.
        </p>
        <p>
          If we cannot deliver a key within {F.deliveryDeadlineHours} hours of payment confirmation, we refund the price you paid for it
          within {F.refundDays} days to {F.refundMethod} and email you when we do.
        </p>
        <p>We do not sell pre-orders. Every product in the catalogue can be delivered straight after payment.</p>
      </>
    ),
  },
  {
    id: "before",
    title: "Check before you buy",
    body: (
      <>
        <p>Each product page states:</p>
        <ul>
          <li>the platform the key is redeemed on, and the account you need for it;</li>
          <li>the activation region, and what it means for your account&rsquo;s country setting;</li>
          <li>the languages the game or service supports, where the publisher states them;</li>
          <li>the edition, the duration of a subscription, or the value and currency of a gift card;</li>
          <li>system requirements, for PC games and DLC only.</li>
        </ul>
        <p>
          A key for one region only activates on an account set to that region. A DLC needs the base game on the same platform and
          region. Please check these points against your account before ordering.
        </p>
      </>
    ),
  },
  {
    id: "redeem",
    title: "Redeeming your key",
    body: (
      <>
        <p>Open the order in your account, select Reveal key, copy it and redeem it on the platform:</p>
        <ul>
          {PLATFORMS.filter((p) => p.key !== "other").map((p) => (
            <li key={p.key}>
              <strong>{p.label}:</strong> {p.redeem[0]} {p.redeem[1] ?? ""}
            </li>
          ))}
        </ul>
        <p>
          Keep the key private until you redeem it: anyone who sees it can use it. We never ask for your platform password or two-factor
          codes. Full steps are on <Link href="/how-it-works">How delivery works</Link>.
        </p>
      </>
    ),
  },
  {
    id: "not-working",
    title: "If a key does not work",
    body: (
      <p>
        Contact us within {F.guaranteeClaimDays} days of delivery with your order number and a screenshot of the error. We check the key and
        replace it or refund it. The procedure is in our <Link href="/policies/warranty">Key guarantee</Link>.
      </p>
    ),
  },
  {
    id: "where",
    title: "Where we sell",
    body: (
      <p>
        We sell to customers in the {F.marketCountries}. We do not sell to {F.restrictedCountries}, or to {F.restrictedTerritories}, and we
        do not list keys whose activation region is limited to any of them. Do not use a VPN or proxy to redeem a key outside its region:
        the platform can block the key or your account.
      </p>
    ),
  },
  {
    id: "contact",
    title: "Questions about a delivery",
    body: <p>Email {F.email} with your order number. We reply {F.replyTime}.</p>,
  },
];

export default async function ShippingPage() {
  return <PolicyLayout slug="shipping" sections={sections} />;
}
